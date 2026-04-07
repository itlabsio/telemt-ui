import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={session.user?.name} userEmail={session.user?.email} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}