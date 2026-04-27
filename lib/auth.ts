/**
 * Auth core — password hashing, HMAC session tokens, user + order ops.
 *
 * Storage is delegated to `./store` which transparently swaps between
 * Supabase (when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set) and a
 * local JSON-file fallback (great for dev without Supabase).
 */

import crypto from "node:crypto";
import { cookies } from "next/headers";
import {
  allOrders,
  allUsers,
  countUsers,
  findUser,
  insertOrder,
  insertUser,
  ordersByUser,
  updateUserOwnership,
} from "./store";
import type { Order, PublicUser, User, UserRole } from "./auth-types";

export type { Order, PublicUser, User, UserRole } from "./auth-types";

/* ---------- password hashing ---------- */

function hashPassword(password: string, salt: string): string {
  return crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
}

/* ---------- session token (HMAC, stateless) ---------- */

const SESSION_COOKIE = "soilplus_session";
const SESSION_TTL_DAYS = 30;

function sessionSecret(): string {
  return (
    process.env.SESSION_SECRET ??
    // deterministic fallback — NOT for prod; see DEPLOY.md.
    "soilplus-dev-secret-change-me-in-production"
  );
}

function signToken(payload: { uid: string; exp: number }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", sessionSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token: string): { uid: string; exp: number } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto
    .createHmac("sha256", sessionSecret())
    .update(body)
    .digest("base64url");
  // constant-time compare to avoid timing leaks
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as { uid: string; exp: number };
    if (!payload.uid || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ---------- public helpers ---------- */

export function toPublic(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, passwordSalt, ...pub } = user;
  return pub;
}

export async function listUsers(): Promise<User[]> {
  return allUsers();
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return findUser({ email });
}

export async function findUserById(id: string): Promise<User | null> {
  return findUser({ id });
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  if (!/.+@.+\..+/.test(email)) throw new Error("Invalid email");
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Email already registered");

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(input.password, salt);

  const totalUsers = await countUsers();
  const user: User = {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim() || email.split("@")[0],
    passwordHash,
    passwordSalt: salt,
    // first user becomes admin (your account)
    role: totalUsers === 0 ? ("admin" as UserRole) : ("user" as UserRole),
    deviceOwner: false,
    createdAt: Date.now(),
  };
  await insertUser(user);
  return toPublic(user);
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const candidate = hashPassword(password, user.passwordSalt);
  if (
    candidate.length !== user.passwordHash.length ||
    !crypto.timingSafeEqual(
      Buffer.from(candidate),
      Buffer.from(user.passwordHash),
    )
  ) {
    return null;
  }
  return user;
}

/* ---------- session cookie helpers ---------- */

export async function setSessionCookie(userId: string): Promise<void> {
  const exp = Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const token = signToken({ uid: userId, exp });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exp),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await findUserById(payload.uid);
  if (!user) return null;
  return toPublic(user);
}

/* ---------- orders ---------- */

export async function listOrders(): Promise<Order[]> {
  return allOrders();
}

export async function ordersForUser(userId: string): Promise<Order[]> {
  return ordersByUser(userId);
}

export async function createOrder(input: {
  user: User | PublicUser;
  phone: string;
  country: string;
  city: string;
  address: string;
  quantity: number;
}): Promise<Order> {
  if (input.quantity < 1 || input.quantity > 100) {
    throw new Error("Quantity must be 1–100");
  }
  const unit = 70;
  const order: Order = {
    id: crypto.randomUUID(),
    userId: input.user.id,
    email: input.user.email,
    name: input.user.name,
    phone: input.phone.trim(),
    country: input.country.trim(),
    city: input.city.trim(),
    address: input.address.trim(),
    quantity: input.quantity,
    unitPriceUsd: unit,
    totalUsd: input.quantity * unit,
    status: "pending",
    createdAt: Date.now(),
  };
  await insertOrder(order);
  return order;
}

/**
 * Mark a user as device-owner once any of their orders hits `paid` or beyond.
 * Call this after you manually flip an order's status in Supabase.
 */
export async function recomputeDeviceOwnership(userId: string): Promise<void> {
  const orders = await ordersByUser(userId);
  const owns = orders.some(
    (o) =>
      o.status === "paid" || o.status === "shipped" || o.status === "delivered",
  );
  await updateUserOwnership(userId, owns);
}
