import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type UserRole = "admin" | "member" | "attivo" | "socio" | null;
export type AppSession = {
  user: {
    email: string;
    role?: string | null;
    active?: boolean;
    memberId?: string | null;
    fullName?: string | null;
  };
};

export async function requireUserSession(): Promise<AppSession> {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  const u = session.user as {
    role?: string | null;
    active?: boolean;
    memberId?: string | null;
    fullName?: string | null;
  };
  return {
    user: {
      email,
      role: u?.role ?? null,
      active: Boolean(u?.active),
      memberId: u?.memberId ?? null,
      fullName: u?.fullName ?? null,
    },
  };
}

export function getUserRole(session: AppSession): UserRole {
  const role = session.user.role;
  return typeof role === "string" ? (role as UserRole) : null;
}
