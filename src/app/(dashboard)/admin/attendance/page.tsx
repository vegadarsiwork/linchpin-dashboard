import { requireAdmin } from "@/lib/auth";
import { AttendanceAdminView } from "@/components/attendance/admin-view";

export default async function AdminAttendancePage() {
  const admin = await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance — Admin</h1>
        <p className="text-muted-foreground">
          View and manage employee attendance. All overrides are logged with your name and timestamp.
        </p>
      </div>
      <AttendanceAdminView adminName={admin.name ?? admin.email ?? "Admin"} />
    </div>
  );
}
