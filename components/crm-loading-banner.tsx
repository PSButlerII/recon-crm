"use client";

import { useCrm } from "@/context/crm-context";

export function CrmLoadingBanner() {
  const { isLoadingCrm } = useCrm();

  if (!isLoadingCrm) return null;

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
      Loading CRM data...
    </div>
  );
}