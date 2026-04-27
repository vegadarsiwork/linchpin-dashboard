import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPayView } from "@/components/pay/admin-pay-view";

export default async function AdminPayPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "INTERN"] } },
    select: { id: true, name: true, email: true, designation: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pay Records — Admin</h1>
        <p className="text-muted-foreground">
          Calculate pay, add adjustments, and export monthly payroll summaries.
        </p>
      </div>
      <AdminPayView users={users} />
    </div>
  );
}
