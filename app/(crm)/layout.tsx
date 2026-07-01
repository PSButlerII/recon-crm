import { AppSidebar } from "@/components/app-sidebar";
import { CrmLoadingBanner } from "@/components/crm-loading-banner";
import { CrmProvider } from "@/context/crm-context";
import { requirePageAuth } from "@/lib/auth/require-auth";
import { connection } from "next/server";

export default async function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  await requirePageAuth();

  return (
    <CrmProvider>
      <div className="flex min-h-screen bg-slate-100">
        <AppSidebar />
        <main className="flex-1 p-6">
          <CrmLoadingBanner />
          {children}
        </main>
      </div>
    </CrmProvider>
  );
}
