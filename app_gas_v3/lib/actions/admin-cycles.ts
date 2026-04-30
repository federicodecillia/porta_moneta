"use server";

import { eq, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import { orders, members, products } from "@/lib/db/schema";

async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!email || role !== "admin") throw new Error("Accesso non autorizzato");
  return { email };
}

export async function adminGetCycleOrderDetails(cycleId: string) {
  try {
    await requireAdmin();
    const db = getDb();
    
    const rows = await db
      .select({
        memberId: members.memberId,
        memberName: members.fullName,
        productName: products.name,
        variant: products.variant,
        quantity: orders.quantity,
        unitPrice: orders.unitPriceSnapshot,
        lineTotal: orders.lineTotal,
      })
      .from(orders)
      .innerJoin(members, eq(orders.memberId, members.memberId))
      .innerJoin(products, eq(orders.productId, products.productId))
      .where(eq(orders.cycleId, cycleId))
      .orderBy(asc(members.fullName), asc(products.name));

    return { success: true, orders: rows };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
}
