import { NextResponse } from "next/server";
import {
  createOrder,
  getSessionUser,
  ordersForUser,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }
  const orders = await ordersForUser(user.id);
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`orders:${ip}`, { max: 5, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Too many order attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to order a device." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = str(body.phone).slice(0, 40);
  const country = str(body.country).slice(0, 60);
  const city = str(body.city).slice(0, 80);
  const address = str(body.address).slice(0, 240);
  const quantity = Math.floor(Number(body.quantity ?? 1));

  if (!phone || !country || !city || !address) {
    return NextResponse.json(
      { error: "Phone, country, city and address are required." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
    return NextResponse.json(
      { error: "Quantity must be between 1 and 100." },
      { status: 400 },
    );
  }

  try {
    const order = await createOrder({
      user,
      phone,
      country,
      city,
      address,
      quantity,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create order" },
      { status: 400 },
    );
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
