import { requireAdmin } from "@/lib/auth";
import { AdminReportsView } from "@/components/reports/admin-reports-view";

export default async function AdminReportsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports — Admin</h1>
        <p className="text-muted-foreground">
          Generate AI-powered daily team reports from attendance, logs, and targets. Optionally
          email them to all admins automatically.
        </p>
      </div>
      <AdminReportsView />
    </div>
  );
}
