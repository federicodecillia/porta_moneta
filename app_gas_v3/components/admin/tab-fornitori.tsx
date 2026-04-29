import { getAllProductsWithSupplier, getAllSuppliersAdmin, getAllCatalogProducts } from "@/lib/db/queries";
import { FornitoriForm, FornitoriList } from "./fornitori-forms";

export async function TabFornitori() {
  const [suppliers, productsBySupplier, catalogBySupplier] = await Promise.all([
    getAllSuppliersAdmin(),
    getAllProductsWithSupplier(),
    getAllCatalogProducts(),
  ]);

  return (
    <div className="space-y-4">
      <FornitoriForm />
      <FornitoriList suppliers={suppliers} productsBySupplier={productsBySupplier} catalogBySupplier={catalogBySupplier} />
    </div>
  );
}
