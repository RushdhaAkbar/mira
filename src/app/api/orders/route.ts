import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { DELIVERY_LKR } from "@/lib/products";
import type { CartItem } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Body {
  items?: CartItem[];
  customer?: { name?: string; phone?: string; address?: string; payment?: string };
}

/** Demo checkout: records the order (no real payment) and returns an order number. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.items?.length) return NextResponse.json({ error: "Bag is empty" }, { status: 400 });

  const subtotal = body.items.reduce((a, it) => a + it.priceLKR, 0);
  const orderNo = "MIRA-" + Math.floor(1000 + Math.random() * 9000);

  const db = await getDb();
  if (db) {
    await db.collection("orders").insertOne({
      orderNo,
      items: body.items,
      customer: body.customer ?? {},
      subtotal,
      delivery: DELIVERY_LKR,
      total: subtotal + DELIVERY_LKR,
      status: "placed",
      createdAt: new Date(),
    });
  }
  return NextResponse.json({ orderNo, total: subtotal + DELIVERY_LKR });
}
