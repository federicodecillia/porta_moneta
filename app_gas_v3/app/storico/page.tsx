import { AppShell } from "@/components/app-shell";
import { getUserRole, requireUserSession } from "@/lib/auth/session";

export default async function StoricoPage() {
  const session = await requireUserSession();
  const role = getUserRole(session);

  return (
    <AppShell
      email={session.user.email}
      isAdmin={role === "admin"}
    >
      <section className="rounded-xl border border-pm-border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Storico</h2>
        <p className="text-pm-gray mt-2 text-sm">
          Placeholder fase 2.3. Storico ordini e movimenti nella fase 3.3.
        </p>
      </section>
    </AppShell>
  );
}
