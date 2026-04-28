import { AppShell } from "@/components/app-shell";
import { getUserRole, requireUserSession } from "@/lib/auth/session";

export default async function OrdinePage() {
  const session = await requireUserSession();
  const role = getUserRole(session);

  return (
    <AppShell
      email={session.user.email}
      isAdmin={role === "admin"}
    >
      <section className="rounded-xl border border-pm-border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Ordine</h2>
        <p className="text-pm-gray mt-2 text-sm">
          Placeholder fase 2.3. Il form ordini arrivera con la fase 3.2.
        </p>
      </section>
    </AppShell>
  );
}
