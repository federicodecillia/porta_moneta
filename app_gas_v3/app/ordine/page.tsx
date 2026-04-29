import { AppShell } from "@/components/app-shell";
import { OrderForm } from "./order-form";
import { getUserRole, requireUserSession } from "@/lib/auth/session";
import {
  getCycleProducts,
  getMemberBalance,
  getMemberOrderLines,
  getOpenCycles,
} from "@/lib/db/queries";
import { saveOrder } from "@/lib/actions/order";

export default async function OrdinePage({ searchParams }: { searchParams: { cycleId?: string } }) {
  const session = await requireUserSession();
  const role = getUserRole(session);
  const memberId = session.user.memberId!;

  const [balance, openCycles] = await Promise.all([
    getMemberBalance(memberId),
    getOpenCycles(),
  ]);

  const activeCycles = openCycles.filter(
    (c) => c.accessLevel === "all" || ["admin", "attivo", "member"].includes(role ?? "")
  );

  let openCycle = null;
  if (activeCycles.length > 0) {
    if (searchParams.cycleId) {
      openCycle = activeCycles.find((c) => c.cycleId === searchParams.cycleId) ?? activeCycles[0];
    } else {
      openCycle = activeCycles[0];
    }
  }

  if (!openCycle) {
    return (
      <AppShell email={session.user.email} isAdmin={role === "admin"}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="mb-4 text-4xl">🛒</span>
          <h2 className="text-[18px] font-bold text-pm-near-black">Nessun ordine aperto</h2>
          <p className="mt-2 text-[14px] text-pm-gray">
            Torna quando l&apos;ordine sarà aperto.
          </p>
        </div>
      </AppShell>
    );
  }

  const [cycleProducts, existingLines] = await Promise.all([
    getCycleProducts(openCycle!.cycleId),
    getMemberOrderLines(memberId, openCycle!.cycleId),
  ]);

  return (
    <AppShell email={session.user.email} isAdmin={role === "admin"}>
      <OrderForm
        cycleId={openCycle!.cycleId}
        cycleTitle={openCycle!.title}
        orderCloseAt={openCycle!.orderCloseAt?.toISOString() ?? null}
        products={cycleProducts.map((p) => ({
          productId: p.productId,
          name: p.name,
          variant: p.variant,
          format: p.format,
          unitPrice: p.unitPrice,
          unit: p.unit,
          category: p.category,
          sortOrder: p.sortOrder,
        }))}
        existingLines={existingLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        }))}
        balance={balance}
        saveAction={saveOrder}
      />
    </AppShell>
  );
}
