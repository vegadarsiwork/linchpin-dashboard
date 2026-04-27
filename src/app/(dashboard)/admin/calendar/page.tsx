import { requireAdmin } from "@/lib/auth";
import { AdminCalendarView } from "@/components/calendar/admin-calendar-view";

export default async function AdminCalendarPage() {
  const user = await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Calendar — Admin</h1>
        <p className="text-muted-foreground">
          Filter by employee to view their events. Add company-wide events visible to everyone.
        </p>
      </div>
      <AdminCalendarView currentUserId={user.id} />
    </div>
  );
}
