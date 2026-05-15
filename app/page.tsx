import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="At-a-glance view of clients, projects, tasks, and upcoming work."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Clients</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Open Projects</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending Tasks</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>
    </>
  );
}