"use client"

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCrm } from "@/context/crm-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { settings, setSettings, refreshCrmData } = useCrm();

  return (
    <SettingsForm
      key={settings?.id ?? "default-settings"}
      settings={settings}
      setSettings={setSettings}
      refreshCrmData={refreshCrmData}
    />
  );
}

type SettingsFormProps = {
  settings: ReturnType<typeof useCrm>["settings"];
  setSettings: ReturnType<typeof useCrm>["setSettings"];
  refreshCrmData: ReturnType<typeof useCrm>["refreshCrmData"];
};

function SettingsForm({ settings, setSettings, refreshCrmData }: SettingsFormProps) {
  const [businessName, setBusinessName] = useState(
    settings?.businessName ?? "Recon Dev LLC"
  );
  const [defaultEmail, setDefaultEmail] = useState(
    settings?.defaultEmail ?? ""
  );
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(
    settings?.defaultHourlyRate?.toString() ?? "35"
  );
  const [defaultCurrency, setDefaultCurrency] = useState(
    settings?.defaultCurrency ?? "USD"
  );
  const [paymentTerms, setPaymentTerms] = useState(
    settings?.paymentTerms ?? "Due on receipt"
  );

  async function handleSaveSettings() {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessName,
        defaultEmail,
        defaultHourlyRate: Number(defaultHourlyRate),
        defaultCurrency,
        paymentTerms,
      }),
    });

    if (!response.ok) {
      console.error("Failed to save settings.");
      return;
    }

    const data = await response.json();
    setSettings(data.settings);
    await refreshCrmData();
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Basic business and CRM configuration."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>
              Default business information used across the CRM.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Default Email</Label>
              <Input value={defaultEmail} onChange={(e) => setDefaultEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Default Hourly Rate</Label>
              <Input
                value={defaultHourlyRate}
                onChange={(e) => setDefaultHourlyRate(e.target.value)}
              />
            </div>

            <div className="space-y-s">
              <label>Currency</label>
              <input
              value={defaultCurrency}
              onChange={(e)=> setDefaultCurrency(e.target.value)}
              />
            </div>

            <div className="space-y-s">
              <label>Payment Terms</label>
              <input
              value={paymentTerms}
              onChange={(e)=> setPaymentTerms(e.target.value)}
              />
            </div>

            <div></div>

            <Button onClick={handleSaveSettings}>Save Settings</Button>






          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CRM Defaults</CardTitle>
            <CardDescription>
              Defaults we can later connect to database settings.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Default project status: Planning</p>
            <p>Default task status: Todo</p>
            <p>Default currency: USD</p>
            <p>Calendar mode: CRM due dates only</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}