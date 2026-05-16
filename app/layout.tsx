import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { CrmProvider } from "@/context/crm-context";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Recon CRM",
  description: "Client and project management for Recon Dev LLC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
          <CrmProvider>
        <div className="flex min-h-screen bg-slate-100">
          <AppSidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
          </CrmProvider>
      </body>
    </html>
  );
}