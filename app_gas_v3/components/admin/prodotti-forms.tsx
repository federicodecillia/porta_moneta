"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/ui/toast";
import { adminLoadProducts, adminDuplicateProducts, adminLoadFromCatalog } from "@/lib/actions/admin";
import { formatEur, getProductEmoji } from "@/lib/utils";
import type { CatalogProductItem } from "@/lib/db/queries";

type CycleOption = { cycleId: string; title: string };

// ── Load from text ────────────────────────────────────────────────────────────

export function LoadProductsForm({ cycleId }: { cycleId: string }) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await adminLoadProducts(cycleId, text);
        toast.success(`${result.count} prodotti caricati`);
        setText("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore nel parsing");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-pm-border bg-white p-4 shadow-sm">
      <p className="mb-1 text-[13px] font-bold text-pm-near-black">Carica prodotti da testo</p>
      <p className="mb-3 font-mono text-[10px] text-pm-teal">
        Formato: Nome;Varietà;Formato;Prezzo;Fornitore;Note;Categoria;Unità
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={"Carota;;500 g;1.75;Biofattoria Rossi;\nMela;Golden;1 kg;2.50;;"}
        className="w-full rounded-lg border border-pm-border px-3 py-2 font-mono text-[12px] text-pm-near-black focus:outline-none focus:ring-2 focus:ring-pm-orange/30"
      />
      <button
        type="submit"
        disabled={isPending || !text.trim()}
        className="mt-3 w-full rounded-xl bg-pm-orange py-2 text-[13px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Caricamento…" : "Carica prodotti"}
      </button>
    </form>
  );
}

// ── Duplicate from cycle ──────────────────────────────────────────────────────

export function DuplicateProductsForm({
  cycleId,
  pastCycles,
}: {
  cycleId: string;
  pastCycles: CycleOption[];
}) {
  const [sourceCycleId, setSourceCycleId] = useState(pastCycles[0]?.cycleId ?? "");
  const [isPending, startTransition] = useTransition();

  function handleDuplicate() {
    if (!sourceCycleId) return;
    if (!window.confirm("Sostituire i prodotti correnti con quelli del ciclo selezionato?")) return;
    startTransition(async () => {
      try {
        const result = await adminDuplicateProducts(sourceCycleId, cycleId);
        toast.success(`${result.count} prodotti duplicati`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore");
      }
    });
  }

  if (pastCycles.length === 0) return null;

  return (
    <div className="rounded-xl border border-pm-border bg-white p-4 shadow-sm">
      <p className="mb-3 text-[13px] font-bold text-pm-near-black">Duplica da ciclo precedente</p>
      <select
        value={sourceCycleId}
        onChange={(e) => setSourceCycleId(e.target.value)}
        className="mb-3 w-full rounded-lg border border-pm-border px-3 py-2 text-[13px] text-pm-near-black focus:outline-none focus:ring-2 focus:ring-pm-teal/30"
      >
        {pastCycles.map((c) => (
          <option key={c.cycleId} value={c.cycleId}>
            {c.title}
          </option>
        ))}
      </select>
      <button
        onClick={handleDuplicate}
        disabled={isPending || !sourceCycleId}
        className="w-full rounded-xl bg-pm-teal py-2 text-[13px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Duplicazione…" : "Duplica prodotti"}
      </button>
    </div>
  );
}

// ── Load from catalog ─────────────────────────────────────────────────────────

export function CatalogLoadForm({
  cycleId,
  catalogProducts,
}: {
  cycleId: string;
  catalogProducts: CatalogProductItem[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleLoad() {
    if (selected.size === 0) return;
    startTransition(async () => {
      try {
        const result = await adminLoadFromCatalog(cycleId, Array.from(selected));
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success(`${result.count} prodotti caricati dal catalogo`);
        setSelected(new Set());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore");
      }
    });
  }

  return (
    <div className="rounded-xl border border-pm-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-bold text-pm-near-black">Carica da catalogo fornitore</p>
        <button
          onClick={() => setSelected(new Set(catalogProducts.map((p) => p.catalogProductId)))}
          className="text-[11px] font-semibold text-pm-teal"
        >
          Seleziona tutti
        </button>
      </div>

      <div className="mb-3 max-h-60 overflow-y-auto rounded-lg border border-pm-border p-2">
        {catalogProducts.map((p) => (
          <label
            key={p.catalogProductId}
            className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-pm-warm-white/50"
          >
            <input
              type="checkbox"
              checked={selected.has(p.catalogProductId)}
              onChange={() => toggle(p.catalogProductId)}
              className="rounded border-pm-border text-pm-teal focus:ring-pm-teal"
            />
            <div className="flex-1 text-[13px] text-pm-near-black">
              {p.name}
              {p.variant && <span className="ml-1 text-[12px] text-pm-gray">{p.variant}</span>}
              {p.format && (
                <span className="ml-1 font-mono text-[10px] text-pm-gray-light">({p.format})</span>
              )}
            </div>
            <div className="font-mono text-[12px] font-semibold text-pm-near-black">
              {formatEur(parseFloat(p.unitPrice))}
              {p.unit ? `/${p.unit}` : ""}
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={handleLoad}
        disabled={isPending || selected.size === 0}
        className="w-full rounded-xl bg-pm-teal py-2 text-[13px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Caricamento…" : `Carica ${selected.size} prodotti`}
      </button>
    </div>
  );
}

// ── Edit Cycle Product ────────────────────────────────────────────────────────

export function EditCycleProductForm({
  product,
  onClose,
}: {
  product: {
    productId: string;
    name: string;
    variant: string | null;
    format: string | null;
    unit: string | null;
    unitPrice: string;
    notes: string | null;
    category: string | null;
  };
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      variant: (fd.get("variant") as string) || undefined,
      format: (fd.get("format") as string) || undefined,
      unit: (fd.get("unit") as string) || undefined,
      unitPrice: parseFloat((fd.get("unitPrice") as string).replace(",", ".")),
      notes: (fd.get("notes") as string) || undefined,
      category: (fd.get("category") as string) || undefined,
    };
    startTransition(async () => {
      try {
        const { adminUpdateCycleProduct } = await import("@/lib/actions/admin");
        const result = await adminUpdateCycleProduct(product.productId, data);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Prodotto aggiornato");
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore");
      }
    });
  }

  const inputCls =
    "w-full rounded-lg border border-pm-border px-3 py-2 text-[13px] text-pm-near-black focus:outline-none focus:ring-2 focus:ring-pm-teal/30";
  const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-pm-gray";

  return (
    <form onSubmit={handleSubmit} className="my-2 rounded-lg border border-pm-border bg-[#fdfdfd] p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] font-bold text-pm-near-black">Modifica prodotto</p>
        <button type="button" onClick={onClose} className="text-[11px] text-pm-gray">
          ✕ Annulla
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-4">
          <label className={labelCls}>Nome *</label>
          <input name="name" required defaultValue={product.name} className={inputCls} />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className={labelCls}>Varietà</label>
          <input name="variant" defaultValue={product.variant ?? ""} className={inputCls} />
        </div>
        <div className="col-span-1">
          <label className={labelCls}>Formato</label>
          <input name="format" placeholder="es. 1 kg" defaultValue={product.format ?? ""} className={inputCls} />
        </div>
        <div className="col-span-1">
          <label className={labelCls}>Unità</label>
          <input name="unit" placeholder="es. kg" defaultValue={product.unit ?? ""} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Categoria</label>
          <input name="category" placeholder="es. Frutta" defaultValue={product.category ?? ""} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Prezzo *</label>
          <input name="unitPrice" type="number" step="0.01" required defaultValue={product.unitPrice} className={inputCls} />
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className={labelCls}>Note</label>
          <input name="notes" defaultValue={product.notes ?? ""} className={inputCls} />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-3 w-full rounded-lg bg-pm-teal py-1.5 text-[12px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Salvataggio…" : "Salva modifiche"}
      </button>
    </form>
  );
}

// ── Product List Item ─────────────────────────────────────────────────────────

export function ProductListItem({
  product,
  index,
}: {
  product: {
    productId: string;
    name: string;
    variant: string | null;
    format: string | null;
    unit: string | null;
    unitPrice: string;
    notes: string | null;
    category: string | null;
  };
  index: number;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <EditCycleProductForm product={product} onClose={() => setIsEditing(false)} />;
  }

  const emoji = product.name ? getProductEmoji(product.name) : "📦";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-pm-warm-white/50 group">
      <span className="w-6 shrink-0 font-mono text-[11px] text-pm-gray-light">
        {index + 1}
      </span>
      <span className="shrink-0 text-[16px] leading-none">{emoji}</span>
      <div className="min-w-0 flex-1">
        <span className="text-[13px] font-medium text-pm-near-black">{product.name}</span>
        {product.variant && (
          <span className="ml-1.5 text-[12px] text-pm-gray">{product.variant}</span>
        )}
        {product.format && (
          <span className="ml-1.5 font-mono text-[10px] text-pm-gray-light">
            {product.format}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="shrink-0 font-mono text-[13px] font-bold text-pm-near-black">
          {formatEur(parseFloat(product.unitPrice))}{product.unit ? `/${product.unit}` : ""}
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-pm-teal shadow-sm ring-1 ring-inset ring-pm-teal/20 hover:bg-pm-teal hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          Modifica
        </button>
      </div>
    </div>
  );
}
