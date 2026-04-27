import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { EmployeePayView } from "@/components/pay/employee-pay-view";

export default async function PayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/dashboard/admin/pay");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Pay History</h1>
        <p className="text-muted-foreground">
          Your monthly pay breakdown including attendance and adjustments.
        </p>
      </div>
      <EmployeePayView userId={user.id} />
    </div>
  );
}
