import { NextResponse } from "next/server";
import {
  findUserById,
  getSessionUser,
  ordersForUser,
  recomputeDeviceOwnership,
  toPublic,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ user: null });

  // Auto-sync device-owner flag with the current order state. This lets an
  // admin simply flip orders.status = 'paid' in the DB — the user unlocks
  // the Dashboard on their next page load, no server restart needed.
  const orders = await ordersForUser(session.id);
  const shouldOwn = orders.some(
    (o) =>
      o.status === "paid" || o.status === "shipped" || o.status === "delivered",
  );
  if (shouldOwn !== session.deviceOwner) {
    await recomputeDeviceOwnership(session.id);
  }

  // Re-fetch so the caller sees the updated flag in the same response.
  const fresh = await findUserById(session.id);
  const user = fresh ? toPublic(fresh) : session;
  return NextResponse.json({ user, orders });
}
