"use client";

import { useState } from "react";
import { adminGetCycleOrderDetails } from "@/lib/actions/admin-cycles";
import { formatEur, getProductEmoji } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

type OrderDetail = {
  memberId: string;
  memberName: string;
  productName: string;
  variant: string | null;
  format: string | null;
  unit: string | null;
  category: string | null;
  emoji: string | null;
  supplierName: string | null;
  productSupplier: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export function ClosedCycleDetails({
  cycleId,
  cycleTitle,
  buttonLabel = "Vedi ordini",
}: {
  cycleId: string;
  cycleTitle: string;
  buttonLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);

  async function handleOpen() {
    setIsOpen(true);
    setLoading(true);
    try {
      const result = await adminGetCycleOrderDetails(cycleId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setOrderDetails(result.orders || []);
      }
    } catch {
      toast.error("Errore nel caricamento dettagli");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="rounded-lg bg-pm-teal/10 px-3 py-1 text-[11px] font-bold text-pm-teal hover:bg-pm-teal/20"
      >
        {buttonLabel}
      </button>
    );
  }

  // Group by member
  const grouped = orderDetails.reduce((acc: Record<string, OrderDetail[]>, ord) => {
    if (!acc[ord.memberName]) acc[ord.memberName] = [];
    acc[ord.memberName].push(ord);
    return acc;
  }, {});
  const grandTotal = orderDetails.reduce((s, l) => s + parseFloat(l.lineTotal), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-[600px] flex-col rounded-2xl bg-pm-warm-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-pm-border p-5">
          <div>
            <h3 className="text-[16px] font-black text-pm-near-black">{cycleTitle}</h3>
            <p className="text-[12px] text-pm-gray">
              {Object.keys(grouped).length} soci · {formatEur(grandTotal)} da addebitare
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full bg-pm-border p-2 text-pm-gray hover:bg-pm-gray-light"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-20 text-center text-pm-gray">Caricamento in corso...</div>
          ) : orderDetails.length === 0 ? (
            <div className="py-20 text-center text-pm-gray">Nessun ordine trovato per questo ciclo.</div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([memberName, lines]) => {
                const total = lines.reduce((s, l) => s + parseFloat(l.lineTotal), 0);
                return (
                  <div key={memberName} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-pm-teal/20 pb-1">
                      <span className="text-[14px] font-bold text-pm-near-black">{memberName}</span>
                      <span className="text-[13px] font-black text-pm-teal">{formatEur(total)}</span>
                    </div>
                    <div className="space-y-1 pl-2">
                      {lines.map((l, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 text-[12px] text-pm-near-black">
                          <div className="flex min-w-0 flex-1 gap-2">
                            <span className="shrink-0 text-[16px]">{l.emoji || getProductEmoji(l.productName)}</span>
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {l.productName} {l.variant && <span className="text-pm-gray">({l.variant})</span>}
                              </div>
                              <div className="truncate text-[10px] text-pm-gray">
                                {[l.supplierName ?? l.productSupplier, l.category, l.format].filter(Boolean).join(" · ")}
                              </div>
                            </div>
                          </div>
                          <span className="shrink-0 text-right font-mono text-pm-gray">
                            {l.quantity} × {formatEur(parseFloat(l.unitPrice))}
                            {l.unit ? `/${l.unit}` : ""} = {formatEur(parseFloat(l.lineTotal))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-pm-border p-4">
          <button
            onClick={() => downloadSupplierCsv(orderDetails, cycleTitle)}
            disabled={orderDetails.length === 0}
            className="flex-1 rounded-xl border border-pm-teal/30 bg-pm-teal-light py-3 text-[13px] font-bold text-pm-teal active:scale-95 disabled:opacity-50"
          >
            ⬇ CSV fornitore
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 rounded-xl bg-pm-near-black py-3 text-[14px] font-bold text-white shadow-lg active:scale-95"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

// Aggregates the per-member order lines into a single row per product,
// then triggers a CSV download. The output is the shopping list that
// can be emailed straight to the supplier: each row has the product
// identity, total quantity ordered, unit price, and total amount.
//
// Lines are grouped by (productName, variant, unit) so the same item
// across multiple members consolidates into one row. Suppliers are
// listed in separate sections inside the CSV via blank-row separators
// so a single export covers a cycle that mixes suppliers.
function downloadSupplierCsv(orders: OrderDetail[], cycleTitle: string) {
  if (orders.length === 0) return;

  type Aggregate = {
    supplierName: string;
    productName: string;
    variant: string | null;
    format: string | null;
    unit: string | null;
    unitPrice: number;
    totalQty: number;
    totalAmount: number;
  };

  const byKey = new Map<string, Aggregate>();
  for (const line of orders) {
    const supplier = line.supplierName ?? line.productSupplier ?? "—";
    const key = [
      supplier,
      line.productName,
      line.variant ?? "",
      line.format ?? "",
      line.unit ?? "",
    ]
      .join("|")
      .toLowerCase();

    const existing = byKey.get(key);
    if (existing) {
      existing.totalQty += line.quantity;
      existing.totalAmount += parseFloat(line.lineTotal);
    } else {
      byKey.set(key, {
        supplierName: supplier,
        productName: line.productName,
        variant: line.variant,
        format: line.format,
        unit: line.unit,
        unitPrice: parseFloat(line.unitPrice),
        totalQty: line.quantity,
        totalAmount: parseFloat(line.lineTotal),
      });
    }
  }

  // Sort by supplier, then by product name within each supplier.
  const rows = Array.from(byKey.values()).sort((a, b) => {
    const s = a.supplierName.localeCompare(b.supplierName);
    return s !== 0 ? s : a.productName.localeCompare(b.productName);
  });

  // CSV header. Italian labels because the file is meant to be emailed
  // to Italian-speaking suppliers.
  const header = [
    "Fornitore",
    "Prodotto",
    "Varietà",
    "Formato",
    "Unità",
    "Quantità totale",
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

  const lines = [join(header)];
  let currentSupplier = "";
  for (const r of rows) {
    if (r.supplierName !== currentSupplier) {
      if (currentSupplier !== "") lines.push("");
      currentSupplier = r.supplierName;
    }
    lines.push(
      join([
        r.supplierName,
        r.productName,
        r.variant,
        r.format,
        r.unit,
        r.totalQty,
        r.unitPrice.toFixed(2).replace(".", ","),
        r.totalAmount.toFixed(2).replace(".", ","),
      ]),
    );
  }

  const csv = "﻿" + lines.join("\n"); // BOM so Excel detects UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // Sanitize cycle title for the filename: only keep alnum, dash, underscore.
  const safeTitle = cycleTitle.replace(/[^a-zA-Z0-9_\-]+/g, "_").slice(0, 60);
  a.download = `ordine_fornitore_${safeTitle || "ciclo"}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
