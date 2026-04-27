import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AttendanceStatus, InvoiceStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const attendanceBadge: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-100 text-green-800",
  LATE: "bg-yellow-100 text-yellow-800",
  ABSENT: "bg-red-100 text-red-800",
  HOLIDAY: "bg-blue-100 text-blue-800",
};

const invoiceBadgeVariant: Record<
  InvoiceStatus,
  "default" | "secondary" | "outline"
> = {
  PAID: "default",
  SENT: "secondary",
  DRAFT: "outline",
};

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getEmployeeStats(userId: string) {
  const today = startOfToday();
  try {
    const [attendance, pendingTargets, todayLog, upcomingEvents] =
      await Promise.all([
        prisma.attendance.findUnique({
          where: { userId_date: { userId, date: today } },
        }),
        prisma.target.count({
          where: {
            assignedToId: userId,
            status: { in: ["PENDING", "IN_PROGRESS"] },
          },
        }),
        prisma.dailyLog.findUnique({
          where: { userId_date: { userId, date: today } },
        }),
        prisma.calendarEvent.findMany({
          where: { userId, startTime: { gte: new Date() } },
          orderBy: { startTime: "asc" },
          take: 3,
        }),
      ]);
    return { attendance, pendingTargets, todayLog, upcomingEvents };
  } catch {
    return {
      attendance: null,
      pendingTargets: 0,
      todayLog: null,
      upcomingEvents: [] as Awaited<
        ReturnType<typeof prisma.calendarEvent.findMany>
      >,
    };
  }
}

async function getAdminStats() {
  const today = startOfToday();
  try {
    const [presentToday, logsToday, overdueTargets, recentInvoices] =
      await Promise.all([
        prisma.attendance.count({
          where: { date: today, status: { in: ["PRESENT", "LATE"] } },
        }),
        prisma.dailyLog.count({ where: { date: today } }),
        prisma.target.count({ where: { status: "OVERDUE" } }),
        prisma.invoice.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            invoiceNumber: true,
            clientName: true,
            totalAmount: true,
            status: true,
          },
        }),
      ]);
    return { presentToday, logsToday, overdueTargets, recentInvoices };
  } catch {
    return {
      presentToday: 0,
      logsToday: 0,
      overdueTargets: 0,
      recentInvoices: [] as Awaited<
        ReturnType<typeof prisma.invoice.findMany<{ select: { id: true; invoiceNumber: true; clientName: true; totalAmount: true; status: true } }>>
      >,
    };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  description,
  highlight = false,
}: {
  title: string;
  value: number;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(highlight && value > 0 ? "border-destructive/50" : "")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-3xl font-bold",
            highlight && value > 0 ? "text-destructive" : ""
          )}
        >
          {value}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const firstName = user.name?.split(" ")[0] ?? "there";

  if (user.role === "ADMIN") {
    const { presentToday, logsToday, overdueTargets, recentInvoices } =
      await getAdminStats();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Good {greeting()}, {firstName}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Present Today"
            value={presentToday}
            description="Employees checked in"
          />
          <StatCard
            title="Logs Submitted"
            value={logsToday}
            description="Daily logs submitted today"
          />
          <StatCard
            title="Overdue Targets"
            value={overdueTargets}
            description="Targets past their due date"
            highlight
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="divide-y">
                {recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium">{inv.invoiceNumber}</span>
                      <span className="ml-2 text-muted-foreground">
                        {inv.clientName}
                      </span>
                    </div>
                    <div className="ml-4 flex shrink-0 items-center gap-3">
                      <span className="font-medium">
                        ₹{inv.totalAmount.toLocaleString("en-IN")}
                      </span>
                      <Badge variant={invoiceBadgeVariant[inv.status]}>
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Employee view ──
  const { attendance, pendingTargets, todayLog, upcomingEvents } =
    await getEmployeeStats(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Good {greeting()}, {firstName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Attendance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {attendance ? (
              <>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    attendanceBadge[attendance.status]
                  )}
                >
                  {attendance.status}
                </span>
                {attendance.checkInTime && (
                  <p className="text-sm text-muted-foreground">
                    Checked in at {formatTime(new Date(attendance.checkInTime))}
                  </p>
                )}
                {attendance.checkOutTime && (
                  <p className="text-sm text-muted-foreground">
                    Checked out at{" "}
                    {formatTime(new Date(attendance.checkOutTime))}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not checked in yet today.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Daily log status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {todayLog ? (
              <>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Submitted
                </span>
                <p className="text-sm text-muted-foreground">
                  Logged at {formatTime(new Date(todayLog.submittedAt))}
                </p>
              </>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  Not yet submitted
                </span>
                <p className="text-sm text-muted-foreground">
                  Remember to log your work before end of day.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending targets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingTargets}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {pendingTargets === 1 ? "target" : "targets"} pending or in
              progress
            </p>
          </CardContent>
        </Card>

        {/* Upcoming calendar events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming events.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id}>
                    <p className="truncate text-sm font-medium">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(new Date(event.startTime))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
