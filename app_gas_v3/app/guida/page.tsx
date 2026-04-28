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
      <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Guida</h2>
        <p className="mt-2 text-sm text-[var(--gray)]">
          Placeholder fase 2.3. FAQ e contenuti guida nella fase 3.4.
        </p>
      </section>
    </AppShell>
  );
}

