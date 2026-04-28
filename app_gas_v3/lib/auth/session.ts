import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type UserRole = "admin" | "member" | "attivo" | "socio" | null;
export type AppSession = {
  user: {
    email: string;
    role?: string | null;
    active?: boolean;
  };
};

export async function requireUserSession(): Promise<AppSession> {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  return {
    user: {
      email,
      role: (session.user as { role?: string | null } | undefined)?.role ?? null,
      active: Boolean(
        (session.user as { active?: boolean } | undefined)?.active,
      ),
    },
  };
}

export function getUserRole(session: AppSession): UserRole {
  const role = session.user.role;
  return typeof role === "string" ? (role as UserRole) : null;
}
