import { redirect } from "next/navigation";
import Link from "next/link";
import { GitBranch, LogOut } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getSessionUser();

  // Route protection: Server-side redirect if not authenticated
  if (!user) {
    redirect("/");
  }

  return <>{children}</>;
}
