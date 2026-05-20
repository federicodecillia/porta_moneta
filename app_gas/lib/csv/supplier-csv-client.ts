// Client-side builder for the "ordine fornitore" CSV — one row per
// (supplier, product, member, quantity). Used both by the "Vedi ordini"
// modal and by the Admin > Ordini export so the two surfaces produce the
// exact same file.

export type SupplierCsvLine = {
  productName: string;
  variant: string | null;
  format: string | null;
  unit: string | null;
  category?: string | null;
  emoji?: string | null;
  supplierName: string | null;
  productSupplier: string | null;
  memberName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  actualQuantity: string | null;
  actualLineTotal: string | null;
};

// Stable supplier label even when the cycle-level supplier and the
// product-level supplier disagree (legacy free-text field).
const supplierOf = (l: SupplierCsvLine) => l.supplierName ?? l.productSupplier ?? "—";

export function downloadSupplierCsv(orders: SupplierCsvLine[], cycleTitle: string) {
  if (orders.length === 0) return;

  // Sort by supplier → product → member, with variant/format/unit as
  // tiebreakers so two products with the same name but different
  // packaging stay adjacent.
  const rows = [...orders].sort((a, b) => {
    const s = supplierOf(a).localeCompare(supplierOf(b));
    if (s !== 0) return s;
    const p = a.productName.localeCompare(b.productName);
    if (p !== 0) return p;
    const v = (a.variant ?? "").localeCompare(b.variant ?? "");
    if (v !== 0) return v;
    const f = (a.format ?? "").localeCompare(b.format ?? "");
    if (f !== 0) return f;
    return a.memberName.localeCompare(b.memberName);
  });

  const header = [
    "Fornitore",
    "Prodotto",
    "Varietà",
    "Formato",
    "Unità",
    "Socio",
    "Quantità",
    "Prezzo unitario",
    "Totale (€)",
  ];

  // RFC 4180-ish escaping: wrap in quotes if the value contains a quote,
  // comma, semicolon, or newline; double any embedded quotes.
  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const join = (cells: Array<string | number | null>) => cells.map(escape).join(";");

  const lines: string[] = [join(header)];
  let currentSupplier = "";

  for (const r of rows) {
    const supplier = supplierOf(r);
    if (supplier !== currentSupplier) {
      if (currentSupplier !== "") lines.push("");
      currentSupplier = supplier;
    }

    const effectiveQty =
      r.actualQuantity != null
        ? parseFloat(r.actualQuantity).toString().replace(".", ",")
        : String(r.quantity);
    const effectiveTotalEur =
      r.actualLineTotal != null
        ? parseFloat(r.actualLineTotal).toFixed(2).replace(".", ",")
        : parseFloat(r.lineTotal).toFixed(2).replace(".", ",");
    lines.push(
      join([
        supplier,
        r.productName,
        r.variant,
        r.format,
        r.unit,
        r.memberName,
        effectiveQty,
        parseFloat(r.unitPrice).toFixed(2).replace(".", ","),
        effectiveTotalEur,
      ]),
    );
  }

  const csv = "﻿" + lines.join("\n"); // BOM so Excel detects UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeTitle = cycleTitle.replace(/[^a-zA-Z0-9_\-]+/g, "_").slice(0, 60);
  a.download = `ordine_fornitore_${safeTitle || "ciclo"}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
