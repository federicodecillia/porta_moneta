"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/ui/toast";
import {
  adminArchiveSupplier,
  adminDeleteSupplier,
  adminUpsertSupplier,
  type UpsertSupplierInput,
} from "@/lib/actions/admin";
import { formatDate, formatEur, getProductEmoji } from "@/lib/utils";

type Supplier = {
  supplierId: string;
  name: string;
  macroCategory: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  cycleCount: number;
};

type SupplierProductItem = {
  name: string;
  variant: string | null;
  format: string | null;
  unitPrice: string;
  cycleTitle: string;
  pickupDate: string | null;
};

// ── Supplier Form ─────────────────────────────────────────────────────────────

export function FornitoriForm({
  supplier,
  onClose,
}: {
  supplier?: Supplier;
  onClose?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!supplier;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: UpsertSupplierInput = {
      supplierId: supplier?.supplierId,
      name: fd.get("name") as string,
      macroCategory: (fd.get("macroCategory") as string) || undefined,
      contactName: (fd.get("contactName") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
      active: true,
    };
    startTransition(async () => {
      try {
        await adminUpsertSupplier(data);
        toast.success(isEdit ? "Fornitore aggiornato" : "Fornitore aggiunto");
        onClose?.();
        if (!isEdit) (e.target as HTMLFormElement).reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore");
      }
    });
  }

  const inputCls =
    "w-full rounded-lg border border-pm-border px-3 py-2 text-[13px] text-pm-near-black focus:outline-none focus:ring-2 focus:ring-pm-orange/30";
  const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-pm-gray";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-pm-border bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-bold text-pm-near-black">
          {isEdit ? `Modifica: ${supplier.name}` : "Aggiungi fornitore"}
        </p>
        {isEdit && onClose && (
          <button type="button" onClick={onClose} className="text-[11px] text-pm-gray">
            ✕ Annulla
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Nome *</label>
            <input name="name" required defaultValue={supplier?.name} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Categoria</label>
            <input
              name="macroCategory"
              placeholder="es. Frutta e Verdura"
              defaultValue={supplier?.macroCategory ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Referente</label>
            <input
              name="contactName"
              defaultValue={supplier?.contactName ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Telefono</label>
            <input
              name="phone"
              type="tel"
              defaultValue={supplier?.phone ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              name="email"
              type="email"
              defaultValue={supplier?.email ?? ""}
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Indirizzo</label>
            <input
              name="address"
              defaultValue={supplier?.address ?? ""}
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Note</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={supplier?.notes ?? ""}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-xl bg-pm-orange py-2 text-[13px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Salvataggio…" : isEdit ? "Aggiorna" : "Aggiungi fornitore"}
      </button>
    </form>
  );
}

// ── Supplier List ─────────────────────────────────────────────────────────────

export function FornitoriList({
  suppliers,
  productsBySupplier,
}: {
  suppliers: Supplier[];
  productsBySupplier: Record<string, SupplierProductItem[]>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleArchive(s: Supplier) {
    startTransition(async () => {
      try {
        await adminArchiveSupplier(s.supplierId, !s.active);
        toast.success(s.active ? "Fornitore archiviato" : "Fornitore riattivato");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore");
      }
    });
  }

  function handleDelete(s: Supplier) {
    if (!window.confirm(`Eliminare "${s.name}"?`)) return;
    startTransition(async () => {
      const result = await adminDeleteSupplier(s.supplierId);
      if (result?.error) toast.error(result.error);
      else toast.success(`${s.name} eliminato`);
    });
  }

  const active = suppliers.filter((s) => s.active);
  const archived = suppliers.filter((s) => !s.active);

  function renderGroup(label: string, list: Supplier[]) {
    if (list.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wider text-pm-gray-light">
          {label} ({list.length})
        </p>
        <div className="overflow-hidden rounded-xl border border-pm-border bg-white shadow-sm">
          {list.map((s) => (
            <div key={s.supplierId} className="divide-y divide-pm-border">
              {editingId === s.supplierId ? (
                <div className="p-4">
                  <FornitoriForm supplier={s} onClose={() => setEditingId(null)} />
                </div>
              ) : (
                <>
                  {/* Supplier row */}
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === s.supplierId ? null : s.supplierId)
                    }
                    className="flex w-full items-center justify-between border-b border-pm-border px-4 py-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-pm-near-black">{s.name}</span>
                        {!s.active && (
                          <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 text-[9px] font-bold text-pm-gray">
                            archiviato
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-pm-gray-light">
                        {s.macroCategory && `${s.macroCategory} · `}
                        {s.contactName && `${s.contactName} · `}
                        {s.cycleCount} cicl{s.cycleCount === 1 ? "o" : "i"} ·{" "}
                        {(productsBySupplier[s.supplierId] ?? []).length} prodotti
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(s.supplierId); }}
                        className="rounded-full border border-pm-border px-2.5 py-1 text-[10px] font-semibold text-pm-gray"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleArchive(s); }}
                        className="rounded-full border border-pm-border px-2.5 py-1 text-[10px] font-semibold text-pm-gray"
                      >
                        {s.active ? "Archivia" : "Riattiva"}
                      </button>
                      {s.cycleCount === 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(s); }}
                          className="rounded-full border border-pm-red/30 px-2.5 py-1 text-[10px] font-semibold text-pm-red"
                        >
                          ✕
                        </button>
                      )}
                      <span className="text-[11px] text-pm-gray-light">
                        {expandedId === s.supplierId ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>

                  {/* Contact details + products */}
                  {expandedId === s.supplierId && (
                    <div className="bg-black/[0.01] px-4 py-3">
                      {(s.phone || s.email || s.address) && (
                        <div className="mb-3 space-y-0.5 font-mono text-[11px] text-pm-gray">
                          {s.phone && <div>📞 {s.phone}</div>}
                          {s.email && <div>✉ {s.email}</div>}
                          {s.address && <div>📍 {s.address}</div>}
                          {s.notes && <div className="mt-1 italic text-pm-gray-light">{s.notes}</div>}
                        </div>
                      )}
                      {(productsBySupplier[s.supplierId] ?? []).length === 0 ? (
                        <p className="text-center text-[12px] text-pm-gray">
                          Nessun prodotto associato nei cicli passati
                        </p>
                      ) : (
                        <div>
                          <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-pm-gray-light">
                            Prodotti storici
                          </p>
                          <div className="space-y-1">
                            {(productsBySupplier[s.supplierId] ?? []).slice(0, 20).map((p, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-[12px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[14px]">{getProductEmoji(p.name)}</span>
                                  <span className="text-pm-near-black">{p.name}</span>
                                  {p.variant && (
                                    <span className="text-pm-gray">· {p.variant}</span>
                                  )}
                                  {p.format && (
                                    <span className="font-mono text-[10px] text-pm-gray-light">
                                      {p.format}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] text-pm-gray-light">
                                    {p.cycleTitle}
                                    {p.pickupDate && ` (${formatDate(p.pickupDate)})`}
                                  </span>
                                  <span className="font-mono text-[12px] font-semibold text-pm-near-black">
                                    {formatEur(parseFloat(p.unitPrice))}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderGroup("Attivi", active)}
      {renderGroup("Archiviati", archived)}
      {suppliers.length === 0 && (
        <div className="rounded-xl border border-dashed border-pm-border p-6 text-center text-[13px] text-pm-gray">
          Nessun fornitore ancora. Aggiungine uno qui sopra.
        </div>
      )}
    </div>
  );
}
