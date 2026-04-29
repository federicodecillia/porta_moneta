import { getAdminCycleProducts, getAllCycles, getOpenCycles, getCatalogBySupplier } from "@/lib/db/queries";
import { Card, CardHeader } from "@/components/ui/card";
import { DuplicateProductsForm, LoadProductsForm, CatalogLoadForm, ProductListItem } from "./prodotti-forms";

export async function TabProdotti() {
  const openCycles = await getOpenCycles();

  if (openCycles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-pm-border p-8 text-center text-[13px] text-pm-gray">
        Nessun ciclo aperto. Crea un ciclo dalla tab <span className="font-semibold">Ciclo</span>.
      </div>
    );
  }

  const allCyclesList = await getAllCycles(20);

  const cycleDataList = await Promise.all(
    openCycles.map(async (c) => {
      const currentProducts = await getAdminCycleProducts(c.cycleId);
      const catalogProducts = c.supplierId ? await getCatalogBySupplier(c.supplierId) : [];
      const pastCycles = allCyclesList
        .filter((pc) => pc.cycleId !== c.cycleId && pc.status === "closed")
        .map((pc) => ({ cycleId: pc.cycleId, title: pc.title }));
      return { cycle: c, currentProducts, catalogProducts, pastCycles };
    })
  );

  return (
    <div className="space-y-8">
      {cycleDataList.map(({ cycle, currentProducts, catalogProducts, pastCycles }) => (
        <div key={cycle.cycleId} className="space-y-4 rounded-xl border border-pm-border bg-[#fdfdfd] p-4 shadow-sm">
          <div className="rounded-xl bg-pm-teal-light px-4 py-3">
            <p className="text-[12px] font-semibold text-pm-teal">
              Ciclo aperto: <span className="text-pm-near-black">{cycle.title}</span>
              <span className="ml-2 text-pm-gray">({currentProducts.length} prodotti)</span>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {catalogProducts.length > 0 && (
              <div className="col-span-1">
                <CatalogLoadForm cycleId={cycle.cycleId} catalogProducts={catalogProducts} />
              </div>
            )}
            <div className="col-span-1 space-y-4">
              <LoadProductsForm cycleId={cycle.cycleId} />
              <DuplicateProductsForm cycleId={cycle.cycleId} pastCycles={pastCycles} />
            </div>
          </div>

          {currentProducts.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-[13px] font-bold text-pm-near-black">
                  Prodotti correnti ({currentProducts.length})
                </h3>
              </CardHeader>
              <div className="divide-y divide-pm-border">
                {currentProducts.map((p, idx) => (
                  <ProductListItem key={p.productId} product={p} index={idx} />
                ))}
              </div>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}
