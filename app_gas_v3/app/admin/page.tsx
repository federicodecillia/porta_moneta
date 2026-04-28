import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getUserRole, requireUserSession } from "@/lib/auth/session";

export default async function AdminPage() {
  const session = await requireUserSession();
  const role = getUserRole(session);

  if (role !== "admin") {
    redirect("/");
  }

  return (
    <AppShell
      email={session.user.email}
      isAdmin
    >
      <section className="rounded-xl border border-pm-border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Admin</h2>
        <p className="text-pm-gray mt-2 text-sm">
          Area amministrazione v3 pronta per i moduli di fase successiva.
        </p>
      </section>
    </AppShell>
  );
}
