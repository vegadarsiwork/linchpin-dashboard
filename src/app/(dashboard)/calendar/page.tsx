import { requireAuth } from "@/lib/auth";
import { EmployeeCalendarView } from "@/components/calendar/employee-calendar-view";

export default async function CalendarPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Calendar</h1>
        <p className="text-muted-foreground">
          Click any day to add an event. Click an event chip to edit or delete it.
        </p>
      </div>
      <EmployeeCalendarView currentUserId={user.id} />
    </div>
  );
}
