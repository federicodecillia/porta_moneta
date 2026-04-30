"use client";

import { useState } from "react";
import { CatalogManager } from "./prodotti-forms";
import type { CatalogProductItem } from "@/lib/db/queries";

type SupplierWithCatalog = {
  supplier: {
    supplierId: string;
    name: string;
  };
  products: CatalogProductItem[];
};

export function SupplierCatalogList({
  initialData,
}: {
  initialData: SupplierWithCatalog[];
}) {
  const [search, setSearch] = useState("");

  const filtered = initialData.filter((item) =>
    item.supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm border border-pm-border">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-pm-gray">
          Cerca fornitore
        </label>
        <input
          type="text"
          placeholder="es. Fabio, BioSette..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-pm-border px-3 py-2 text-[13px] text-pm-near-black focus:outline-none focus:ring-2 focus:ring-pm-teal/30"
        />
      </div>

      <div className="space-y-8">
        {filtered.length > 0 ? (
          filtered.map(({ supplier, products }) => (
            <CatalogManager
              key={supplier.supplierId}
              supplierId={supplier.supplierId}
              supplierName={supplier.name}
              products={products}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-pm-border p-8 text-center text-[13px] text-pm-gray">
            Nessun fornitore trovato per &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
