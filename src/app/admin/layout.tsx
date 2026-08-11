import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { getCurrentProfile } from "@/lib/data";
import type { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?next=/admin");
  }

  if (!isAdminProfile(profile)) {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
