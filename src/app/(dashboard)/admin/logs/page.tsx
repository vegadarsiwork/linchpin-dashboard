import { requireAdmin } from "@/lib/auth";
import { AdminLogsView } from "@/components/logs/admin-logs-view";

export default async function AdminLogsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logs — Admin</h1>
        <p className="text-muted-foreground">
          Submit daily logs on behalf of employees. All submissions are logged with your name and timestamp.
        </p>
      </div>
      <AdminLogsView />
    </div>
  );
}
