import { desc, eq, and, sql, asc } from "drizzle-orm";
import { getDb } from "./client";
import {
  ledgerEntries,
  members,
  orderCycles,
  orders,
  products,
} from "./schema";

export async function getMemberByEmail(email: string) {
  const db = getDb();
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.email, email))
    .limit(1);
  return member ?? null;
}

export async function getMemberBalance(memberId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${ledgerEntries.amount}), '0')`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.memberId, memberId));
  return parseFloat(row?.total ?? "0");
}

export async function getOpenCycle() {
  const db = getDb();
  const [cycle] = await db
    .select()
    .from(orderCycles)
    .where(eq(orderCycles.status, "open"))
    .limit(1);
  return cycle ?? null;
}

export async function getCycleProducts(cycleId: string) {
  const db = getDb();
  return db
    .select()
    .from(products)
    .where(and(eq(products.cycleId, cycleId), eq(products.active, true)))
    .orderBy(asc(products.sortOrder), asc(products.name));
}

export async function getMemberOrderLines(memberId: string, cycleId: string) {
  const db = getDb();
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.memberId, memberId), eq(orders.cycleId, cycleId)));
}

export async function getMemberLedger(memberId: string, limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.memberId, memberId))
    .orderBy(desc(ledgerEntries.entryDate))
    .limit(limit);
}

export type CycleHistoryEntry = {
  cycleId: string;
  title: string;
  pickupDate: Date | null;
  status: string;
  orderTotal: number;
  lines: { productName: string; variant: string | null; quantity: number }[];
};

export async function getMemberStorico(memberId: string): Promise<CycleHistoryEntry[]> {
  const db = getDb();
  const rows = await db
    .select({
      cycleId: orderCycles.cycleId,
      cycleTitle: orderCycles.title,
      pickupDate: orderCycles.pickupDate,
      cycleStatus: orderCycles.status,
      cycleCreatedAt: orderCycles.createdAt,
      lineTotal: orders.lineTotal,
      quantity: orders.quantity,
      productName: products.name,
      variant: products.variant,
      sortOrder: products.sortOrder,
    })
    .from(orders)
    .innerJoin(orderCycles, eq(orders.cycleId, orderCycles.cycleId))
    .innerJoin(products, eq(orders.productId, products.productId))
    .where(eq(orders.memberId, memberId))
    .orderBy(desc(orderCycles.createdAt), asc(products.sortOrder));

  const cycleMap = new Map<string, CycleHistoryEntry>();
  for (const row of rows) {
    if (!cycleMap.has(row.cycleId)) {
      cycleMap.set(row.cycleId, {
        cycleId: row.cycleId,
        title: row.cycleTitle,
        pickupDate: row.pickupDate,
        status: row.cycleStatus,
        orderTotal: 0,
        lines: [],
      });
    }
    const entry = cycleMap.get(row.cycleId)!;
    entry.orderTotal += parseFloat(row.lineTotal);
    entry.lines.push({
      productName: row.productName,
      variant: row.variant,
      quantity: row.quantity,
    });
  }
  return Array.from(cycleMap.values());
}
