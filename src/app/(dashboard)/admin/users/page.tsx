import { requireAdmin } from "@/lib/auth";
import { AdminUsersView } from "@/components/users/admin-users-view";

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
        <p className="text-muted-foreground">
          Edit employee details, manage roles, and invite new team members.
        </p>
      </div>
      <AdminUsersView />
    </div>
  );
}
