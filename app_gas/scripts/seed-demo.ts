// Seeds the DEMO database with plausible fake data. Idempotent: truncates
// everything first. Refuses to run unless DEMO_MODE=true so it can never be
// pointed at production by accident (prod never sets that variable).
//
// Local:  npm run db:seed:demo   (reads .env.demo.local)
// CI:     DATABASE_URL=$DEMO_DATABASE_URL DEMO_MODE=true npx tsx scripts/seed-demo.ts
import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  ledgerEntries,
  members,
  notifications,
  orderCycles,
  orders,
  products,
  suppliers,
  supplierProducts,
} from "../lib/db/schema";

if (process.env.DEMO_MODE !== "true") {
  console.error("Refusing to run: DEMO_MODE is not 'true'. This script WIPES the target database.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

const id = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
const daysFromNow = (d: number, hour = 12) => {
  const date = new Date(Date.now() + d * 86_400_000);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function main() {
  console.log("Truncating demo tables…");
  await sql`TRUNCATE TABLE orders, ledger_entries, products, supplier_products,
    order_cycles, suppliers, notifications, audit_log, members CASCADE`;

  // ── Members ────────────────────────────────────────────────────────
  const now = new Date();
  const mk = (fullName: string, email: string, role: string) => ({
    memberId: id("mem"),
    fullName,
    email,
    aliasEmail: null,
    role,
    active: true,
    createdAt: daysFromNow(-90),
    updatedAt: now,
  });
  const demoAdmin = mk("Alice Demo (Admin)", "demo.admin@example.com", "admin");
  const demoSocio = mk("Sofia Demo (Socio)", "demo.socio@example.com", "socio");
  const others = [
    mk("Marco Rossi", "marco.rossi@example.com", "attivo"),
    mk("Giulia Bianchi", "giulia.bianchi@example.com", "socio"),
    mk("Luca Ferrari", "luca.ferrari@example.com", "attivo"),
    mk("Elena Conti", "elena.conti@example.com", "socio"),
    mk("Paolo Greco", "paolo.greco@example.com", "socio"),
    mk("Chiara Moretti", "chiara.moretti@example.com", "attivo"),
  ];
  const allMembers = [demoAdmin, demoSocio, ...others];
  await db.insert(members).values(allMembers);
  console.log(`Inserted ${allMembers.length} members`);

  // ── Suppliers + catalog ────────────────────────────────────────────
  const mkSupplier = (name: string, macroCategory: string, email: string) => ({
    supplierId: id("sup"),
    name,
    macroCategory,
    contactName: null,
    phone: null,
    email,
    address: null,
    notes: null,
    active: true,
    createdAt: daysFromNow(-90),
  });
  const ortofrutta = mkSupplier("Azienda Agricola La Collina", "Ortofrutta", "ordini@lacollina.example.com");
  const forno = mkSupplier("Forno del Borgo", "Panificati", "forno@borgo.example.com");
  const apicoltura = mkSupplier("Apicoltura Miele Vivo", "Dispensa", "info@mielevivo.example.com");
  await db.insert(suppliers).values([ortofrutta, forno, apicoltura]);

  type CatalogItem = {
    supplierId: string; supplierName: string; name: string; format: string | null;
    unit: string | null; unitPrice: string; category: string; emoji: string;
  };
  const catalog: CatalogItem[] = [
    { supplierId: ortofrutta.supplierId, supplierName: ortofrutta.name, name: "Pomodori ciliegino", format: "cassetta 1 kg", unit: "kg", unitPrice: "3.50", category: "Verdura", emoji: "🍅" },
    { supplierId: ortofrutta.supplierId, supplierName: ortofrutta.name, name: "Zucchine", format: "1 kg", unit: "kg", unitPrice: "2.80", category: "Verdura", emoji: "🥒" },
    { supplierId: ortofrutta.supplierId, supplierName: ortofrutta.name, name: "Insalata gentile", format: "cespo", unit: "pz", unitPrice: "1.50", category: "Verdura", emoji: "🥬" },
    { supplierId: ortofrutta.supplierId, supplierName: ortofrutta.name, name: "Pesche", format: "2 kg", unit: "kg", unitPrice: "5.40", category: "Frutta", emoji: "🍑" },
    { supplierId: ortofrutta.supplierId, supplierName: ortofrutta.name, name: "Limoni non trattati", format: "1 kg", unit: "kg", unitPrice: "3.20", category: "Frutta", emoji: "🍋" },
    { supplierId: forno.supplierId, supplierName: forno.name, name: "Pane casereccio", format: "pagnotta 1 kg", unit: "pz", unitPrice: "4.50", category: "Panificati", emoji: "🍞" },
    { supplierId: forno.supplierId, supplierName: forno.name, name: "Focaccia alle olive", format: "teglia", unit: "pz", unitPrice: "6.00", category: "Panificati", emoji: "🫓" },
    { supplierId: apicoltura.supplierId, supplierName: apicoltura.name, name: "Miele millefiori", format: "vasetto 500 g", unit: "pz", unitPrice: "8.50", category: "Dispensa", emoji: "🍯" },
    { supplierId: apicoltura.supplierId, supplierName: apicoltura.name, name: "Miele di acacia", format: "vasetto 500 g", unit: "pz", unitPrice: "10.00", category: "Dispensa", emoji: "🍯" },
  ];
  await db.insert(supplierProducts).values(
    catalog.map((c) => ({
      catalogProductId: id("cat"),
      supplierId: c.supplierId,
      name: c.name,
      variant: null,
      format: c.format,
      unit: c.unit,
      unitPrice: c.unitPrice,
      pricePerKg: null,
      notes: null,
      category: c.category,
      emoji: c.emoji,
      active: true,
      createdAt: daysFromNow(-90),
      archivedAt: null,
    })),
  );
  console.log(`Inserted 3 suppliers, ${catalog.length} catalog products`);

  // ── Cycles ─────────────────────────────────────────────────────────
  const mkCycle = (title: string, openDay: number, closeDay: number, status: "open" | "closed") => ({
    cycleId: id("cyc"),
    title,
    pickupDate: daysFromNow(closeDay + 2, 17),
    pickupEndTime: "19:00",
    pickup2Date: null,
    pickup2EndTime: null,
    shippingCostPerMember: "1.50",
    shippingMode: "fixed_per_member",
    shippingTotal: null,
    orderOpenAt: daysFromNow(openDay, 9),
    orderCloseAt: daysFromNow(closeDay, 22),
    status,
    accessLevel: "soci",
    notes: null,
    createdBy: demoAdmin.email,
    createdAt: daysFromNow(openDay, 9),
    closedAt: status === "closed" ? daysFromNow(closeDay, 22) : null,
    supplierId: null,
  });
  const cycleOld = mkCycle("Ortofrutta e forno — ciclo 1", -16, -14, "closed");
  const cyclePrev = mkCycle("Ortofrutta e miele — ciclo 2", -9, -7, "closed");
  const cycleOpen = mkCycle("Ortofrutta e forno — questa settimana", -1, 5, "open");
  await db.insert(orderCycles).values([cycleOld, cyclePrev, cycleOpen]);

  // Per-cycle products copied from the catalog (first 7 items per cycle).
  const cycleProducts = new Map<string, { productId: string; unitPrice: string }[]>();
  for (const cycle of [cycleOld, cyclePrev, cycleOpen]) {
    const rows = catalog.slice(0, 7).map((c, i) => ({
      productId: id("prd"),
      cycleId: cycle.cycleId,
      name: c.name,
      variant: null,
      format: c.format,
      unitPrice: c.unitPrice,
      pricePerKg: null,
      unit: c.unit,
      supplier: c.supplierName,
      notes: null,
      sortOrder: i,
      active: true,
      supplierId: c.supplierId,
      category: c.category,
      emoji: c.emoji,
    }));
    await db.insert(products).values(rows);
    cycleProducts.set(cycle.cycleId, rows.map((r) => ({ productId: r.productId, unitPrice: r.unitPrice })));
  }
  console.log("Inserted 3 cycles with products");

  // ── Orders ─────────────────────────────────────────────────────────
  // whoOrders[i] orders (i % 3 + 1) product lines with quantity (i % 2) + 1.
  const orderRows: (typeof orders.$inferInsert)[] = [];
  const charges = new Map<string, Map<string, number>>(); // cycleId -> memberId -> total
  const addOrders = (cycleId: string, when: Date, whoOrders: (typeof allMembers)[number][]) => {
    const prods = cycleProducts.get(cycleId)!;
    const byMember = new Map<string, number>();
    whoOrders.forEach((member, i) => {
      let total = 0;
      for (let line = 0; line <= i % 3; line += 1) {
        const product = prods[(i + line * 2) % prods.length];
        const quantity = (i % 2) + 1;
        const lineTotal = quantity * parseFloat(product.unitPrice);
        total += lineTotal;
        orderRows.push({
          orderLineId: id("ord"),
          cycleId,
          memberId: member.memberId,
          productId: product.productId,
          quantity,
          unitPriceSnapshot: product.unitPrice,
          lineTotal: lineTotal.toFixed(2),
          actualQuantity: null,
          actualLineTotal: null,
          updatedAt: when,
        });
      }
      byMember.set(member.memberId, total);
    });
    charges.set(cycleId, byMember);
  };
  addOrders(cycleOld.cycleId, daysFromNow(-15), [demoSocio, ...others.slice(0, 4)]);
  addOrders(cyclePrev.cycleId, daysFromNow(-8), [demoSocio, ...others.slice(1, 5)]);
  addOrders(cycleOpen.cycleId, daysFromNow(0, 10), [demoSocio, others[0], others[3]]);
  await db.insert(orders).values(orderRows);
  console.log(`Inserted ${orderRows.length} order lines`);

  // ── Ledger ─────────────────────────────────────────────────────────
  // Everyone gets an opening top-up; closed cycles charge order + shipping.
  const ledgerRows: (typeof ledgerEntries.$inferInsert)[] = [];
  for (const member of allMembers) {
    ledgerRows.push({
      entryId: id("led"),
      memberId: member.memberId,
      entryDate: daysFromNow(-30),
      type: "topup",
      amount: "100.00",
      cycleId: null,
      note: "Ricarica iniziale",
      createdBy: demoAdmin.email,
      createdAt: daysFromNow(-30),
      updatedAt: null,
      updatedBy: null,
    });
  }
  for (const cycle of [cycleOld, cyclePrev]) {
    const byMember = charges.get(cycle.cycleId)!;
    for (const [memberId, total] of byMember) {
      if (total <= 0) continue;
      ledgerRows.push({
        entryId: id("led"),
        memberId,
        entryDate: cycle.closedAt!,
        type: "order_charge",
        amount: (-total).toFixed(2),
        cycleId: cycle.cycleId,
        note: "Addebito ordine",
        createdBy: demoAdmin.email,
        createdAt: cycle.closedAt!,
        updatedAt: null,
        updatedBy: null,
      });
      ledgerRows.push({
        entryId: id("led"),
        memberId,
        entryDate: cycle.closedAt!,
        type: "shipping_charge",
        amount: "-1.50",
        cycleId: cycle.cycleId,
        note: "Spedizione",
        createdBy: demoAdmin.email,
        createdAt: cycle.closedAt!,
        updatedAt: null,
        updatedBy: null,
      });
    }
  }
  await db.insert(ledgerEntries).values(ledgerRows);
  console.log(`Inserted ${ledgerRows.length} ledger entries`);

  // ── Notifications ──────────────────────────────────────────────────
  await db.insert(notifications).values([
    {
      notificationId: id("not"),
      memberId: demoSocio.memberId,
      role: null,
      type: "topup_received",
      title: "Ricarica registrata",
      body: "La tua ricarica di 100,00 euro e' stata registrata.",
      href: "/storico",
      readAt: daysFromNow(-29),
      createdAt: daysFromNow(-30),
    },
    {
      notificationId: id("not"),
      memberId: demoSocio.memberId,
      role: null,
      type: "order_closed",
      title: "Ordine chiuso",
      body: `E' stato chiuso "${cyclePrev.title}". Controlla lo storico per il dettaglio.`,
      href: `/storico?cycleId=${cyclePrev.cycleId}`,
      readAt: null,
      createdAt: cyclePrev.closedAt!,
    },
  ]);

  console.log("Demo seed completed ✔");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
