import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { BottomNav } from "@/components/bottom-nav";
import { LogoutButton } from "@/components/logout-button";

type AppShellProps = {
  children: ReactNode;
  email: string;
  isAdmin: boolean;
};

export function AppShell({ children, email, isAdmin }: AppShellProps) {
  return (
    <div className="min-h-screen bg-pm-frame sm:p-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-pm-warm-white sm:min-h-[calc(100vh-3rem)] sm:rounded-xl sm:border sm:border-pm-border sm:shadow-sm">
        <header className="border-b border-pm-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-pm-gray text-[11px] font-medium uppercase tracking-[0.08em]">
                Porta Moneta
              </p>
              <h1 className="text-pm-near-black text-xl font-semibold">v3</h1>
            </div>
            <LogoutButton
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            />
          </div>
          <p className="text-pm-gray mt-3 truncate text-xs">{email}</p>
        </header>

        <main className="flex-1 px-5 py-4 pb-[calc(var(--spacing-nav-h)+1rem)]">{children}</main>
        <BottomNav isAdmin={isAdmin} />
      </div>
    </div>
  );
}
