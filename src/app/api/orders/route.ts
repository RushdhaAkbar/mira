import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { DELIVERY_LKR } from "@/lib/products";
import { getTesterId } from "@/lib/tester";
import type { CartItem, Variant } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Body {
  items?: CartItem[];
  variant?: Variant;
  payment?: string;
}

/**
 * Demo checkout for the testing phase: nothing is charged or shipped.
 * Only the basket and study arm are recorded (as a purchase-intent signal);
 * no name, phone or address is stored.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.items?.length) return NextResponse.json({ error: "Bag is empty" }, { status: 400 });

  const subtotal = body.items.reduce((a, it) => a + it.priceLKR, 0);
  const orderNo = "MIRA-TEST-" + Math.floor(1000 + Math.random() * 9000);

  const db = await getDb();
  if (db) {
    await db.collection("orders").insertOne({
      orderNo,
      testerId: await getTesterId(),
      variant: body.variant ?? "ai",
      items: body.items.map(({ productId, name, size, priceLKR }) => ({ productId, name, size, priceLKR })),
      payment: body.payment ?? "cod",
      subtotal,
      total: subtotal + DELIVERY_LKR,
      demo: true,
      createdAt: new Date(),
    });
  }
  return NextResponse.json({ orderNo, total: subtotal + DELIVERY_LKR });
}
