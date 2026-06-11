import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { brand } from "@/lib/brand";
import { BottomNav } from "@/components/bottom-nav";
import { DemoBanner } from "@/components/demo-banner";
import { LogoutButton } from "@/components/logout-button";
import { NotificationBell } from "@/components/notification-bell";
import { getUnreadNotificationCount } from "@/lib/db/queries";

type AppShellProps = {
  children: ReactNode;
  email: string;
  isAdmin: boolean;
  memberId: string;
};

export async function AppShell({ children, email, isAdmin, memberId }: AppShellProps) {
  const unreadCount = await getUnreadNotificationCount(memberId);

  return (
    <div className="min-h-screen bg-pm-frame sm:p-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] md:max-w-[640px] flex-col bg-pm-warm-white sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-xl sm:border sm:border-pm-border sm:shadow-sm">
        <DemoBanner />
        <header className="border-b border-pm-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link href="/" aria-label="Home" className="inline-flex items-center gap-2">
                <img src={brand.logoUrl} alt={brand.appName} className="h-[26px] w-auto" />
                {brand.headerShowName && (
                  <span className="text-[15px] font-semibold text-pm-near-black">{brand.appName}</span>
                )}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell unreadCount={unreadCount} />
              <LogoutButton
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              />
            </div>
          </div>
          <p className="text-pm-gray mt-3 truncate text-xs">{email}</p>
        </header>

        <main className="flex-1 px-5 py-4 pb-[calc(var(--spacing-nav-h)+1rem)]">{children}</main>
        <BottomNav isAdmin={isAdmin} />
      </div>
    </div>
  );
}
