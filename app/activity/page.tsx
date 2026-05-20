"use client";

import { useCrm } from "@/context/crm-context";
import { PageHeader } from "@/components/page-header";
import { WorkspaceItem } from "@/components/workspace-item";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import type { ActivityType } from "@/types/activity";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ActivityPage() {
  const { activity } = useCrm();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | ActivityType>("All");

  const filteredActivity = activity.filter((item) => {
  const matchesSearch =
    item.message.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase());

  const matchesType =
    typeFilter === "All" || item.type === typeFilter;

  return matchesSearch && matchesType;
  });

  const sortedActivity = [...filteredActivity].sort((a, b) => {
    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  });

  return (
    <>
      <PageHeader
        title="Activity"
        description="Recent CRM actions, updates, and system events."
      />

      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search activity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as "All" | ActivityType)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Client">Client</SelectItem>
            <SelectItem value="Project">Project</SelectItem>
            <SelectItem value="Task">Task</SelectItem>
            <SelectItem value="Note">Note</SelectItem>
            <SelectItem value="System">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            Latest changes across clients, projects, tasks, notes, intake, and requests.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="divide-y rounded-xl border">
            {sortedActivity.length > 0 ? (
              sortedActivity.map((item) => (
                <WorkspaceItem
                  key={item.id}
                  title={item.message}
                  description={item.type}
                  metaTop={item.createdAt}
                />
              ))
            ) : (
              <EmptyState message="No activity recorded yet." />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}