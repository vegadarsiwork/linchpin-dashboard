import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OverrideLogView } from "@/components/override-log/override-log-view";

export default async function OverrideLogPage() {
  await requireAdmin();

  const employees = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Override Log</h1>
        <p className="text-muted-foreground">
          Complete audit trail of all admin overrides — attendance edits, log submissions, and pay adjustments.
        </p>
      </div>
      <OverrideLogView employees={employees} />
    </div>
  );
}
