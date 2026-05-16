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

export default function SettingsPage() {
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
              <Input defaultValue="Recon Dev LLC" />
            </div>

            <div className="space-y-2">
              <Label>Default Email</Label>
              <Input placeholder="you@example.com" />
            </div>

            <div className="space-y-2">
              <Label>Default Hourly Rate</Label>
              <Input defaultValue="35" />
            </div>
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