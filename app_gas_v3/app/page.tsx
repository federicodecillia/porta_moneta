import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center p-6">
      <div className="w-full rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Porta Moneta v3</h1>
        <p className="mt-2 text-sm text-[var(--gray)]">
          Accesso riuscito. Sessione Google attiva.
        </p>
        <div className="mt-4 rounded-md bg-[var(--teal-l)] p-3">
          <p className="text-xs font-medium text-[var(--gray)]">
            Email autenticata
          </p>
          <p className="text-base font-semibold">{session.user.email}</p>
        </div>
        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--orange)] px-4 py-2 font-semibold text-white"
          >
            Logout
          </button>
        </form>
      </div>
    </main>
  );
}
