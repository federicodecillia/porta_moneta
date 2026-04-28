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
      <section className="rounded-xl border border-pm-border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Home</h2>
        <p className="text-pm-gray mt-1 text-sm">
          Sessione attiva. Shell v3 pronta.
        </p>
        <div className="mt-4 rounded-lg bg-pm-teal-light p-3">
          <p className="text-pm-gray text-xs font-medium">Email</p>
          <p className="text-base font-semibold">{session.user.email}</p>
        </div>
      </section>
    </AppShell>
  );
}
