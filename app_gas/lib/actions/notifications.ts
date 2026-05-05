"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";

export async function markNotificationRead(notificationId: string) {
  const session = await requireUserSession();
  const memberId = session.user.memberId!;
  const db = getDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.notificationId, notificationId), eq(notifications.memberId, memberId)));
  revalidatePath("/notifiche");
  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const session = await requireUserSession();
  const memberId = session.user.memberId!;
  const db = getDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.memberId, memberId), isNull(notifications.readAt)));
  revalidatePath("/notifiche");
  revalidatePath("/");
}
