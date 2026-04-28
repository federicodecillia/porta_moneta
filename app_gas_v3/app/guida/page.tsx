import { AppShell } from "@/components/app-shell";
import { getUserRole, requireUserSession } from "@/lib/auth/session";

export default async function GuidaPage() {
  const session = await requireUserSession();
  const role = getUserRole(session);

  return (
    <AppShell
      email={session.user.email}
      isAdmin={role === "admin"}
    >
      <section className="rounded-xl border border-pm-border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Guida</h2>
        <p className="text-pm-gray mt-2 text-sm">
          Placeholder fase 2.3. FAQ e contenuti guida nella fase 3.4.
        </p>
      </section>
    </AppShell>
  );
}
