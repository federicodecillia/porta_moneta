import { AppShell } from "@/components/app-shell";
import { getUserRole, requireUserSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await requireUserSession();
  const role = getUserRole(session);

  return (
    <AppShell
      email={session.user.email}
      isAdmin={role === "admin"}
    >
      <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Home</h2>
        <p className="mt-1 text-sm text-[var(--gray)]">
          Sessione attiva. Shell v3 pronta.
        </p>
        <div className="mt-4 rounded-lg bg-[var(--teal-l)] p-3">
          <p className="text-xs font-medium text-[var(--gray)]">Email</p>
          <p className="text-base font-semibold">{session.user.email}</p>
        </div>
      </section>
    </AppShell>
  );
}
