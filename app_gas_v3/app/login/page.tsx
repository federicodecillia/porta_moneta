import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.email) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center p-6">
      <div className="w-full rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Porta Moneta v3</h1>
        <p className="mt-2 text-sm text-[var(--gray)]">
          Accedi con Google per continuare.
        </p>
        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--teal)] px-4 py-2 font-semibold text-white"
          >
            Login con Google
          </button>
        </form>
      </div>
    </main>
  );
}
