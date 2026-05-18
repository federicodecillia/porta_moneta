import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orders, products } from "@/lib/db/schema";

type Row = {
  name: string;
  variant: string | null;
  format: string | null;
  unit: string | null;
  unitPrice: string;
  totalQty: string;
  totalEur: string;
};

const escape = (s: string | null | undefined): string => {
  const v = s ?? "";
  return /[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

const eur = (n: number): string => n.toFixed(2).replace(".", ",");
const qty = (n: number): string =>
  Number.isInteger(n) ? String(n) : n.toFixed(3).replace(".", ",").replace(/,?0+$/, "");

const slug = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "ciclo";

// Builds an aggregated-per-product CSV for a supplier order. One row per
// product with the SUM of ordered quantities across all members. Includes a
// BOM + Excel-friendly `sep=;` hint so it opens correctly with comma decimals
// on Italian locales.
export async function buildSupplierAggregateCsv(
  cycleId: string,
  cycleTitle: string,
): Promise<{
  filename: string;
  content: Buffer;
  rowCount: number;
  grandTotal: number;
}> {
  const db = getDb();
  const rows = (await db
    .select({
      name: products.name,
      variant: products.variant,
      format: products.format,
      unit: products.unit,
      unitPrice: products.unitPrice,
      totalQty: sql<string>`sum(${orders.quantity})`,
      totalEur: sql<string>`sum(${orders.lineTotal})`,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.productId))
    .where(eq(orders.cycleId, cycleId))
    .groupBy(
      products.productId,
      products.name,
      products.variant,
      products.format,
      products.unit,
      products.unitPrice,
    )
    .orderBy(products.name)) as Row[];

  const header = "Prodotto;Variante;Formato;Unita;Prezzo unitario EUR;Quantita totale;Totale EUR";
  const lines = rows.map((r) =>
    [
      escape(r.name),
      escape(r.variant),
      escape(r.format),
      escape(r.unit),
      eur(parseFloat(r.unitPrice)),
      qty(parseFloat(r.totalQty)),
      eur(parseFloat(r.totalEur)),
    ].join(";"),
  );

  const grandTotal = rows.reduce((s, r) => s + parseFloat(r.totalEur), 0);
  const totalLine = `TOTALE;;;;;;${eur(grandTotal)}`;

  // BOM prefix keeps Excel happy with the accented characters and the `sep=;`
  // hint forces it to use the Italian-friendly decimal-comma layout. We return
  // a Buffer (not a string) because the Resend SDK base64-decodes string
  // attachments, which corrupts UTF-8 payloads.
  const text = ["sep=;", header, ...lines, totalLine].join("\n");
  const content = Buffer.from("﻿" + text, "utf-8");

  return {
    filename: `ordine_${slug(cycleTitle)}.csv`,
    content,
    rowCount: rows.length,
    grandTotal,
  };
}
