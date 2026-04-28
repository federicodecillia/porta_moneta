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
      <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Ordine</h2>
        <p className="mt-2 text-sm text-[var(--gray)]">
          Placeholder fase 2.3. Il form ordini arrivera con la fase 3.2.
        </p>
      </section>
    </AppShell>
  );
}

