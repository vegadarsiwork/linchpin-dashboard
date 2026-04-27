import { requireAdmin } from "@/lib/auth";
import { AdminTargetsView } from "@/components/targets/admin-targets-view";

export default async function AdminTargetsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Targets — Admin</h1>
        <p className="text-muted-foreground">
          Assign and manage targets for your team. Overdue rows are highlighted in red.
        </p>
      </div>
      <AdminTargetsView />
    </div>
  );
}
