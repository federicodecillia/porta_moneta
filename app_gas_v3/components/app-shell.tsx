import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { BottomNav } from "@/components/bottom-nav";

type AppShellProps = {
  children: ReactNode;
  email: string;
  isAdmin: boolean;
};

export function AppShell({ children, email, isAdmin }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#ddd8d0] sm:p-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[var(--warm-wh)] sm:min-h-[calc(100vh-3rem)] sm:rounded-xl sm:border sm:border-[var(--border)] sm:shadow-sm">
        <header className="border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--gray)]">
                Porta Moneta
              </p>
              <h1 className="text-xl font-semibold text-[var(--near-blk)]">v3</h1>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--near-blk)]"
              >
                Logout
              </button>
            </form>
          </div>
          <p className="mt-3 truncate text-xs text-[var(--gray)]">{email}</p>
        </header>

        <main className="flex-1 px-5 py-4 pb-[calc(var(--nav-h)+1rem)]">{children}</main>
        <BottomNav isAdmin={isAdmin} />
      </div>
    </div>
  );
}
