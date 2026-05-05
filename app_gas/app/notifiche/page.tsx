import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getUserRole, requireUserSession } from "@/lib/auth/session";
import { getMemberNotifications } from "@/lib/db/queries";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { formatDateShort } from "@/lib/utils";

export default async function NotifichePage() {
  const session = await requireUserSession();
  const role = getUserRole(session);
  const memberId = session.user.memberId!;

  const notifications = await getMemberNotifications(memberId, 50);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <AppShell email={session.user.email} isAdmin={role === "admin"} memberId={memberId}>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-black tracking-[-0.03em] text-pm-near-black">
          Notifiche
        </h1>
        {unreadCount > 0 && (
          <form
            action={async () => {
              "use server";
              await markAllNotificationsRead();
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-pm-border px-[13px] py-[5px] font-mono text-[11px] font-bold uppercase tracking-widest text-pm-near-black"
            >
              Segna tutte ✓
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="mb-4 text-4xl">🔔</span>
          <p className="text-[15px] font-bold text-pm-near-black">Nessuna notifica</p>
          <p className="mt-1 text-[13px] text-pm-gray">
            Ti avviseremo quando ci sono novità sull&apos;ordine o sul saldo.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-pm-border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {notifications.map((n, i) => (
            <form
              key={n.notificationId}
              action={async () => {
                "use server";
                await markNotificationRead(n.notificationId);
                redirect(n.href ?? "/storico");
              }}
              className={i < notifications.length - 1 ? "border-b border-pm-border" : ""}
            >
              <button
                type="submit"
                className="flex w-full items-start gap-3 px-4 py-[14px] text-left"
              >
                <span
                  className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${
                    n.readAt ? "bg-transparent" : "bg-pm-orange"
                  }`}
                  aria-label={n.readAt ? undefined : "Non letta"}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[13px] leading-snug ${
                      n.readAt ? "font-medium text-pm-gray" : "font-bold text-pm-near-black"
                    }`}
                  >
                    {n.title}
                  </div>
                  <div className="mt-[3px] text-[12px] leading-snug text-pm-gray">{n.body}</div>
                  <div className="mt-[5px] font-mono text-[10px] text-pm-gray-light">
                    {formatDateShort(n.createdAt)}
                  </div>
                </div>
              </button>
            </form>
          ))}
        </div>
      )}
    </AppShell>
  );
}
