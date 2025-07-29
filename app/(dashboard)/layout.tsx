// app/(dashboard)/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import DashboardWrapper from "@/components/DashboardWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={session.user} />
      <div className="lg:pl-64">
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <DashboardWrapper>{children}</DashboardWrapper>
          </div>
        </main>
      </div>
    </div>
  );
}