import { getAllSuppliers, getCatalogBySupplier } from "@/lib/db/queries";
import { CatalogManager, CleanupButton } from "./prodotti-forms";

export async function TabProdotti() {
  const suppliers = await getAllSuppliers();

  const suppliersWithCatalog = await Promise.all(
    suppliers.map(async (s) => {
      const products = await getCatalogBySupplier(s.supplierId);
      return { supplier: s, products };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-pm-border">
        <div>
          <h2 className="text-[16px] font-bold text-pm-near-black">Catalogo Prodotti</h2>
          <p className="text-[12px] text-pm-gray">Gestisci i listini master per ciascun fornitore.</p>
        </div>
        <CleanupButton />
      </div>

      <div className="space-y-8">
        {suppliersWithCatalog.map(({ supplier, products }) => (
          <CatalogManager
            key={supplier.supplierId}
            supplierId={supplier.supplierId}
            supplierName={supplier.name}
            products={products}
          />
        ))}
      </div>
    </div>
  );
}
