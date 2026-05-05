import { getAllSuppliersAdmin, getAllCatalogProducts } from "@/lib/db/queries";
import { FornitoriForm, FornitoriList } from "./fornitori-forms";

export async function TabFornitori() {
  const [suppliers, catalogBySupplier] = await Promise.all([
    getAllSuppliersAdmin(),
    getAllCatalogProducts(),
  ]);

  return (
    <div className="space-y-4">
      <FornitoriForm />
      <FornitoriList suppliers={suppliers} catalogBySupplier={catalogBySupplier} />
    </div>
  );
}
