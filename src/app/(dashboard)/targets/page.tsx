import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { EmployeeTargetsView } from "@/components/targets/employee-targets-view";

export default async function TargetsPage() {
  const user = await requireAuth();

  // Admins manage targets from the dedicated admin page
  if (user.role === "ADMIN") redirect("/dashboard/admin/targets");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Targets</h1>
        <p className="text-muted-foreground">
          Click a target card to update its status. Targets with a red border are overdue.
        </p>
      </div>
      <EmployeeTargetsView />
    </div>
  );
}
