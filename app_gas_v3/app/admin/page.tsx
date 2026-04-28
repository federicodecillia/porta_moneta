import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminPage() {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (role !== "admin") {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col items-center justify-center p-6">
      <div className="w-full rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-[var(--gray)]">
          Area amministrazione v3 pronta per i moduli di fase successiva.
        </p>
      </div>
    </main>
  );
}
