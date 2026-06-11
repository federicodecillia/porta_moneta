"use client";

import { useMemo, useState, useTransition } from "react";
import { adminArchiveCatalogProduct } from "@/lib/actions/admin";
import type { CatalogProductItem } from "@/lib/db/queries";
import { formatEur, getProductEmoji } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { CatalogCsvActions, CatalogProductForm } from "./prodotti-forms";

type SupplierWithCatalog = {
  supplier: {
    supplierId: string;
    name: string;
  };
  products: CatalogProductItem[];
};

type ProductWithSupplier = CatalogProductItem & {
  supplierName: string;
};

type GroupBy = "category" | "supplier";

const ALL = "__all__";

function groupProducts(products: ProductWithSupplier[], groupBy: GroupBy) {
  const groups = new Map<string, ProductWithSupplier[]>();
  for (const product of products) {
    const key =
      groupBy === "category"
        ? product.category?.trim() || "Senza categoria"
        : product.supplierName;
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, "it"));
}

export function SupplierCatalogList({
  initialData,
}: {
  initialData: SupplierWithCatalog[];
}) {
  const suppliers = initialData.map((item) => item.supplier);
  const allProducts = useMemo(
    () =>
      initialData.flatMap(({ supplier, products }) =>
        products.map((product) => ({ ...product, supplierName: supplier.name })),
      ),
    [initialData],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(allProducts.map((p) => p.category?.trim()).filter((v): v is string => Boolean(v))),
      ).sort((a, b) => a.localeCompare(b, "it")),
    [allProducts],
  );

  const [supplierFilter, setSupplierFilter] = useState(ALL);
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [uploadSupplierId, setUploadSupplierId] = useState(suppliers[0]?.supplierId ?? "");
  const [addingSupplierId, setAddingSupplierId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = allProducts.filter((product) => {
    const supplierMatch = supplierFilter === ALL || product.supplierId === supplierFilter;
    const categoryMatch = categoryFilter === ALL || product.category === categoryFilter;
    return supplierMatch && categoryMatch;
  });

  const grouped = groupProducts(filtered, groupBy);
  const editingProduct = allProducts.find((p) => p.catalogProductId === editingId);

  function handleArchive(id: string, active: boolean) {
    if (!window.confirm(active ? "Riattivare il prodotto?" : "Archiviare il prodotto?")) return;
    startTransition(async () => {
      const result = await adminArchiveCatalogProduct(id, active);
      if (result.error) toast.error(result.error);
      else toast.success(active ? "Prodotto riattivato" : "Prodotto archiviato");
    });
  }

  const defaultAddSupplierId = supplierFilter !== ALL ? supplierFilter : uploadSupplierId;
  const selectedSupplierForAdd = addingSupplierId ?? defaultAddSupplierId;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-brand-border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-bold text-brand-near-black">Carica prodotti</h3>
            <p className="text-[11px] text-brand-gray">
              Importa un listino una sola volta scegliendo il fornitore di destinazione.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
              Fornitore di destinazione
            </span>
            <select
              value={uploadSupplierId}
              onChange={(e) => setUploadSupplierId(e.target.value)}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-[13px] text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            >
              {suppliers.length === 0 ? (
                <option value="">Nessun fornitore disponibile</option>
              ) : (
                suppliers.map((supplier) => (
                  <option key={supplier.supplierId} value={supplier.supplierId}>
                    {supplier.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <CatalogCsvActions supplierId={uploadSupplierId} />
        </div>
      </section>

      <section className="rounded-xl border border-brand-border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-bold text-brand-near-black">Catalogo prodotti</h3>
            <p className="text-[11px] text-brand-gray">
              {filtered.length} prodotti visibili su {allProducts.length}
            </p>
          </div>
          <button
            onClick={() => setAddingSupplierId(defaultAddSupplierId || suppliers[0]?.supplierId || null)}
            disabled={suppliers.length === 0}
            className="rounded-lg bg-brand-teal px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
          >
            + Aggiungi
          </button>
        </div>

        <div className="grid gap-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
              Fornitore
            </span>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-[13px] text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            >
              <option value={ALL}>Tutti i fornitori</option>
              {suppliers.map((supplier) => (
                <option key={supplier.supplierId} value={supplier.supplierId}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
                Categoria
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-[13px] text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              >
                <option value={ALL}>Tutte le categorie</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
                Raggruppa per
              </span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-[13px] text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              >
                <option value="category">Categoria</option>
                <option value="supplier">Fornitore</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {(addingSupplierId || editingProduct) && (
        <CatalogProductForm
          supplierId={editingProduct?.supplierId ?? addingSupplierId ?? selectedSupplierForAdd}
          product={editingProduct}
          onClose={() => {
            setAddingSupplierId(null);
            setEditingId(null);
          }}
        />
      )}

      {grouped.length > 0 ? (
        <div className="space-y-5">
          {grouped.map(([groupName, products]) => (
            <section key={groupName} className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-brand-border bg-brand-warm-white px-4 py-3">
                <h3 className="text-[13px] font-bold text-brand-near-black">{groupName}</h3>
                <span className="font-mono text-[10px] text-brand-gray">{products.length}</span>
              </div>
              <div className="divide-y divide-brand-border">
                {products.map((product) => (
                  <div
                    key={product.catalogProductId}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-brand-warm-white/40 ${
                      !product.active ? "opacity-50 grayscale" : ""
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 text-[22px] leading-none">
                      {product.emoji || getProductEmoji(product.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-bold text-brand-near-black">{product.name}</span>
                        {!product.active && (
                          <span className="rounded bg-brand-gray-light px-1 py-0.5 text-[9px] font-bold uppercase text-brand-gray">
                            Archiviato
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-brand-gray">
                        <span>{product.supplierName}</span>
                        {product.category && <span>{product.category}</span>}
                        {product.variant && <span>{product.variant}</span>}
                        {product.format && <span>{product.format}</span>}
                      </div>
                      {product.notes && (
                        <div className="mt-1 text-[11px] text-brand-gray-light">{product.notes}</div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[13px] font-bold text-brand-near-black">
                        {formatEur(parseFloat(product.unitPrice))}
                      </div>
                      {product.pricePerKg && (
                        <div className="font-mono text-[10px] text-brand-gray-light">
                          ({formatEur(parseFloat(product.pricePerKg))}/kg)
                        </div>
                      )}
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(product.catalogProductId)}
                          className="text-[10px] font-bold text-brand-teal hover:underline"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => handleArchive(product.catalogProductId, !product.active)}
                          className="text-[10px] font-bold text-brand-gray hover:text-brand-near-black hover:underline"
                        >
                          {product.active ? "Archivia" : "Ripristina"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-brand-border p-8 text-center text-[13px] text-brand-gray">
          Nessun prodotto trovato con questi filtri.
        </div>
      )}
    </div>
  );
}
