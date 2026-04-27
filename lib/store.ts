/**
 * Storage adapter: Supabase (production) or local JSON files (dev).
 *
 *   • If SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, all user & order
 *     reads/writes go to Postgres. The service_role client bypasses RLS,
 *     which is correct because all access is already authenticated at the
 *     Next.js API layer via our session cookie.
 *   • Otherwise, we fall back to `.data/users.json` + `.data/orders.json`
 *     in the project root — perfect for local dev without Supabase.
 *
 * The public surface (`getUsers / putUsers / getOrders / putOrders`) is
 * identical in both modes so callers (lib/auth.ts) don't care which
 * backend is active.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Order, User } from "./auth-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

/* ================================================================== */
/*  Supabase client (lazy)                                            */
/* ================================================================== */

type Client = import("@supabase/supabase-js").SupabaseClient;
let _client: Client | null = null;

async function supa(): Promise<Client> {
  if (_client) return _client;
  const { createClient } = await import("@supabase/supabase-js");
  _client = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  return _client;
}

/* ================================================================== */
/*  Row <-> object mapping                                             */
/* ================================================================== */

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  password_salt: string;
  role: "user" | "admin";
  device_owner: boolean;
  created_at: number;
};

type OrderRow = {
  id: string;
  user_id: string;
  email: string;
  name: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  quantity: number;
  unit_price_usd: number;
  total_usd: number;
  status: Order["status"];
  created_at: number;
};

const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  passwordHash: r.password_hash,
  passwordSalt: r.password_salt,
  role: r.role,
  deviceOwner: r.device_owner,
  createdAt: r.created_at,
});

const fromUser = (u: User): UserRow => ({
  id: u.id,
  email: u.email,
  name: u.name,
  password_hash: u.passwordHash,
  password_salt: u.passwordSalt,
  role: u.role,
  device_owner: u.deviceOwner,
  created_at: u.createdAt,
});

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  userId: r.user_id,
  email: r.email,
  name: r.name,
  phone: r.phone,
  country: r.country,
  city: r.city,
  address: r.address,
  quantity: r.quantity,
  unitPriceUsd: r.unit_price_usd,
  totalUsd: r.total_usd,
  status: r.status,
  createdAt: r.created_at,
});

const fromOrder = (o: Order): OrderRow => ({
  id: o.id,
  user_id: o.userId,
  email: o.email,
  name: o.name,
  phone: o.phone,
  country: o.country,
  city: o.city,
  address: o.address,
  quantity: o.quantity,
  unit_price_usd: o.unitPriceUsd,
  total_usd: o.totalUsd,
  status: o.status,
  created_at: o.createdAt,
});

/* ================================================================== */
/*  File helpers                                                       */
/* ================================================================== */

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

/* ================================================================== */
/*  Public surface                                                     */
/* ================================================================== */

export async function allUsers(): Promise<User[]> {
  if (usingSupabase) {
    const { data, error } = await (await supa())
      .from("users")
      .select("*");
    if (error) throw new Error(`Supabase users read failed: ${error.message}`);
    return (data as UserRow[]).map(toUser);
  }
  return readJson<User[]>(USERS_FILE, []);
}

export async function findUser(
  match: { id: string } | { email: string },
): Promise<User | null> {
  if (usingSupabase) {
    const q = (await supa()).from("users").select("*").limit(1);
    const { data, error } =
      "id" in match
        ? await q.eq("id", match.id)
        : await q.ilike("email", match.email);
    if (error) throw new Error(`Supabase user find failed: ${error.message}`);
    const row = (data as UserRow[] | null)?.[0];
    return row ? toUser(row) : null;
  }
  const users = await readJson<User[]>(USERS_FILE, []);
  if ("id" in match) return users.find((u) => u.id === match.id) ?? null;
  return (
    users.find((u) => u.email.toLowerCase() === match.email.toLowerCase()) ??
    null
  );
}

export async function insertUser(user: User): Promise<void> {
  if (usingSupabase) {
    const { error } = await (await supa()).from("users").insert(fromUser(user));
    if (error) throw new Error(`Supabase user insert failed: ${error.message}`);
    return;
  }
  const users = await readJson<User[]>(USERS_FILE, []);
  users.push(user);
  await writeJson(USERS_FILE, users);
}

export async function updateUserOwnership(
  userId: string,
  deviceOwner: boolean,
): Promise<void> {
  if (usingSupabase) {
    const { error } = await (await supa())
      .from("users")
      .update({ device_owner: deviceOwner })
      .eq("id", userId);
    if (error) throw new Error(`Supabase user update failed: ${error.message}`);
    return;
  }
  const users = await readJson<User[]>(USERS_FILE, []);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  if (users[idx].deviceOwner !== deviceOwner) {
    users[idx].deviceOwner = deviceOwner;
    await writeJson(USERS_FILE, users);
  }
}

export async function countUsers(): Promise<number> {
  if (usingSupabase) {
    const { count, error } = await (await supa())
      .from("users")
      .select("*", { count: "exact", head: true });
    if (error) throw new Error(`Supabase user count failed: ${error.message}`);
    return count ?? 0;
  }
  const users = await readJson<User[]>(USERS_FILE, []);
  return users.length;
}

export async function allOrders(): Promise<Order[]> {
  if (usingSupabase) {
    const { data, error } = await (await supa())
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Supabase orders read failed: ${error.message}`);
    return (data as OrderRow[]).map(toOrder);
  }
  return readJson<Order[]>(ORDERS_FILE, []);
}

export async function ordersByUser(userId: string): Promise<Order[]> {
  if (usingSupabase) {
    const { data, error } = await (await supa())
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Supabase orders read failed: ${error.message}`);
    return (data as OrderRow[]).map(toOrder);
  }
  const all = await readJson<Order[]>(ORDERS_FILE, []);
  return all.filter((o) => o.userId === userId);
}

export async function insertOrder(order: Order): Promise<void> {
  if (usingSupabase) {
    const { error } = await (await supa())
      .from("orders")
      .insert(fromOrder(order));
    if (error) throw new Error(`Supabase order insert failed: ${error.message}`);
    return;
  }
  const orders = await readJson<Order[]>(ORDERS_FILE, []);
  orders.push(order);
  await writeJson(ORDERS_FILE, orders);
}
