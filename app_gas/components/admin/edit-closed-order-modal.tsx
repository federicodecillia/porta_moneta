"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  adminGetEditClosedOrderBootstrap,
  type EditClosedOrderBootstrap,
} from "@/lib/actions/admin-cycles";
import { adminEditClosedOrder } from "@/lib/actions/admin";
import { toast } from "@/components/ui/toast";
import { formatEur, getProductEmoji } from "@/lib/utils";

type Mode =
  | { kind: "edit"; memberId: string; memberName: string }
  | { kind: "create" }; // pick a member from the dropdown

type Props = {
  cycleId: string;
  cycleTitle: string;
  mode: Mode;
  onClose: () => void;
  /** Optional callback fired after a successful save (parent can refetch). */
  onSaved?: () => void;
};

/**
 * Full-screen modal that lets an admin add/remove/change products inside a
 * closed cycle order. Mirrors the member-facing /ordine stepper UI for
 * familiarity. On save calls `adminEditClosedOrder`, which writes a single
 * `correction` ledger entry with the delta.
 */
export function EditClosedOrderModal({ cycleId, cycleTitle, mode, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [bootstrap, setBootstrap] = useState<EditClosedOrderBootstrap | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [memberId, setMemberId] = useState<string>(mode.kind === "edit" ? mode.memberId : "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const target = mode.kind === "edit" ? mode.memberId : null;
    adminGetEditClosedOrderBootstrap(cycleId, target).then((res) => {
      if (cancelled) return;
      if (res.error || !res.data) {
        toast.error(res.error ?? "Errore nel caricamento");
        onClose();
        return;
      }
      setBootstrap(res.data);
      const initial: Record<string, number> = {};
      for (const l of res.data.memberLines) initial[l.productId] = l.quantity;
      setQuantities(initial);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId, mode.kind, mode.kind === "edit" ? mode.memberId : null]);

  function bump(productId: string, by: number) {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + by);
      const copy = { ...prev };
      if (next === 0) delete copy[productId];
      else copy[productId] = next;
      return copy;
    });
  }

  const grouped = useMemo(() => {
    if (!bootstrap) return [] as Array<[string, EditClosedOrderBootstrap["products"]]>;
    const map = new Map<string, EditClosedOrderBootstrap["products"]>();
    for (const p of bootstrap.products) {
      const key = p.category?.trim() || "Altro";
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "it"));
  }, [bootstrap]);

  const newTotal = useMemo(() => {
    if (!bootstrap) return 0;
    return bootstrap.products.reduce((sum, p) => {
      const qty = quantities[p.productId] ?? 0;
      return qty > 0 ? sum + parseFloat(p.unitPrice) * qty : sum;
    }, 0);
  }, [bootstrap, quantities]);

  const oldTotal = useMemo(
    () =>
      bootstrap?.memberLines.reduce((s, l) => s + parseFloat(l.lineTotal), 0) ?? 0,
    [bootstrap],
  );

  const delta = newTotal - oldTotal;

  function handleSave() {
    if (mode.kind === "create" && !memberId) {
      toast.error("Seleziona un socio");
      return;
    }
    const lines = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    startTransition(async () => {
      try {
        const result = await adminEditClosedOrder({
          cycleId,
          memberId,
          lines,
          note: note.trim() || undefined,
        });
        const deltaMsg =
          Math.abs(result.delta) < 0.005
            ? "Ordine aggiornato (saldo invariato)"
            : result.delta > 0
              ? `Ordine aggiornato: addebito di ${formatEur(result.delta)}`
              : `Ordine aggiornato: rimborso di ${formatEur(-result.delta)}`;
        toast.success(deltaMsg);
        onSaved?.();
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore");
      }
    });
  }

  const memberName =
    mode.kind === "edit"
      ? mode.memberName
      : bootstrap?.members.find((m) => m.memberId === memberId)?.fullName ?? "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-[600px] flex-col rounded-2xl bg-pm-warm-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-pm-border p-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.13em] text-pm-orange">
              {cycleTitle} · {mode.kind === "create" ? "Nuovo ordine" : "Modifica ordine"}
            </div>
            <h3 className="mt-1 text-[16px] font-black text-pm-near-black">
              {mode.kind === "edit" ? memberName : "Aggiungi ordine per un socio"}
            </h3>
            <p className="mt-1 text-[11px] leading-snug text-pm-gray">
              Le modifiche generano una <strong>voce di correzione</strong> nel saldo del socio
              e una notifica con il dettaglio. L&apos;ordine originale e l&apos;addebito esistente non vengono toccati.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-pm-border p-2 text-pm-gray hover:bg-pm-gray-light"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading || !bootstrap ? (
            <div className="py-20 text-center text-pm-gray">Caricamento…</div>
          ) : (
            <>
              {mode.kind === "create" && (
                <div className="mb-4 rounded-xl border border-pm-border bg-white p-3">
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-pm-gray">
                    Socio
                  </label>
                  <select
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="w-full rounded-lg border border-pm-border bg-white px-3 py-2 text-[13px] text-pm-near-black focus:outline-none focus:ring-2 focus:ring-pm-teal/30"
                  >
                    <option value="">— Scegli un socio —</option>
                    {bootstrap.members.map((m) => (
                      <option key={m.memberId} value={m.memberId}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {grouped.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-pm-gray">
                  Questo ciclo non ha prodotti attivi. Riattivane qualcuno per poter modificare l&apos;ordine.
                </div>
              ) : (
                grouped.map(([category, prods]) => (
                  <div key={category} className="mb-5">
                    <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-pm-orange">
                      {category}
                    </div>
                    <div className="overflow-hidden rounded-xl border border-pm-border bg-white">
                      {prods.map((p, i) => {
                        const qty = quantities[p.productId] ?? 0;
                        const meta = [p.variant, p.format].filter(Boolean).join(" · ");
                        return (
                          <div
                            key={p.productId}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                              i < prods.length - 1 ? "border-b border-pm-border" : ""
                            }`}
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-2">
                              <span className="mt-0.5 text-[18px] leading-none">
                                {p.emoji || getProductEmoji(p.name)}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-medium text-pm-near-black">
                                  {p.name}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-pm-gray">
                                  {meta && <span className="font-mono">{meta}</span>}
                                  <span className="font-mono font-semibold text-pm-orange">
                                    {formatEur(parseFloat(p.unitPrice))}
                                  </span>
                                  {p.pricePerKg && (
                                    <span className="font-mono text-[10px] text-pm-gray-light">
                                      ({formatEur(parseFloat(p.pricePerKg))}/kg)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => bump(p.productId, 1)}
                                className="shrink-0 rounded-full bg-black/[0.06] px-3 py-1 text-[18px] font-light text-pm-gray"
                                aria-label={`Aggiungi ${p.name}`}
                              >
                                +
                              </button>
                            ) : (
                              <div className="flex shrink-0 items-center gap-2 rounded-full bg-pm-orange/15 p-0.5">
                                <button
                                  type="button"
                                  onClick={() => bump(p.productId, -1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full text-[16px] font-light text-pm-orange"
                                  aria-label="Riduci"
                                >
                                  −
                                </button>
                                <span className="min-w-[1.5ch] text-center font-mono text-[13px] font-bold text-pm-near-black">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => bump(p.productId, 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full text-[16px] font-light text-pm-orange"
                                  aria-label="Aggiungi"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              <div className="mt-4 rounded-xl border border-pm-border bg-white p-3">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-pm-gray">
                  Motivo (opzionale, mostrato al socio)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder='es. "Aggiunti i 6 uova dimenticati al ritiro"'
                  className="w-full rounded-lg border border-pm-border px-3 py-2 text-[13px] text-pm-near-black focus:outline-none focus:ring-2 focus:ring-pm-teal/30"
                />
              </div>
            </>
          )}
        </div>

        <div className="border-t border-pm-border bg-white p-4">
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wide text-pm-gray-light">
                Prima
              </div>
              <div className="font-mono text-[13px] font-bold text-pm-gray">
                {formatEur(oldTotal)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wide text-pm-gray-light">
                Nuovo
              </div>
              <div className="font-mono text-[13px] font-bold text-pm-near-black">
                {formatEur(newTotal)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-wide text-pm-gray-light">
                Delta
              </div>
              <div
                className={`font-mono text-[13px] font-bold ${
                  Math.abs(delta) < 0.005
                    ? "text-pm-gray"
                    : delta > 0
                      ? "text-pm-red"
                      : "text-pm-teal"
                }`}
              >
                {Math.abs(delta) < 0.005
                  ? "—"
                  : `${delta > 0 ? "+" : "−"}${formatEur(Math.abs(delta))}`}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-pm-border bg-white py-3 text-[13px] font-bold text-pm-gray"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={isPending || (mode.kind === "create" && !memberId)}
              className="flex-1 rounded-xl bg-pm-orange py-3 text-[13px] font-bold text-white shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Salvataggio…" : "Salva modifiche"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
