import { getAllProductsWithSupplier, getAllSuppliersAdmin } from "@/lib/db/queries";
import { FornitoriForm, FornitoriList } from "./fornitori-forms";

export async function TabFornitori() {
  const [suppliers, productsBySupplier] = await Promise.all([
    getAllSuppliersAdmin(),
    getAllProductsWithSupplier(),
  ]);

  return (
    <div className="space-y-4">
      <FornitoriForm />
      <FornitoriList suppliers={suppliers} productsBySupplier={productsBySupplier} />
    </div>
  );
}
