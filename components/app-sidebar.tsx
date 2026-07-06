"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCrm } from "@/context/crm-context";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Settings,
  FileText,
  Receipt,
  Files,
  StickyNote,
  ClipboardList,
  Inbox,
  Bug,
  History,
  LogOut,
} from "lucide-react";

const showDebugNav = process.env.NODE_ENV !== "production";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/files", label: "Files", icon: Files },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/service-requests", label: "Requests", icon: ClipboardList },
  { href: "/intake", label: "Intake", icon: Inbox },
  { href: "/activity", label: "Activity", icon: History },
  ...(showDebugNav ? [{ href: "/debug", label: "Debug", icon: Bug }] : []),
];

export function AppSidebar() {
  const router = useRouter();
  const { intakeSubmissions } = useCrm();
  const newIntakeCount = intakeSubmissions.filter(
    (submission) => submission.status === "New"
  ).length;

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="hidden min-h-screen w-64 border-r bg-slate-950 text-white md:block">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-xl font-bold">Recon CRM</h1>
        <p className="text-sm text-slate-400">Business command center</p>
      </div>

      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/intake" && newIntakeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-950"
                >
                  {newIntakeCount > 99 ? "99+" : newIntakeCount}
                </Badge>
              )}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </nav>
    </aside>
  );
}