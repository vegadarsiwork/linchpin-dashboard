import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckinCard } from "@/components/attendance/checkin-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@prisma/client";

const statusStyle: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-100 text-green-800",
  LATE: "bg-yellow-100 text-yellow-800",
  ABSENT: "bg-red-100 text-red-800",
  HOLIDAY: "bg-blue-100 text-blue-800",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default async function AttendancePage() {
  const user = await requireAuth();

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const [todayRecord, monthRecords] = await Promise.all([
    prisma.attendance
      .findUnique({
        where: { userId_date: { userId: user.id, date: today } },
      })
      .catch(() => null),
    prisma.attendance
      .findMany({
        where: { userId: user.id, date: { gte: monthStart, lte: today } },
        include: { overriddenBy: { select: { name: true } } },
        orderBy: { date: "desc" },
      })
      .catch(() => []),
  ]);

  // Build day-by-day map for the full month up to today
  const recordMap = new Map(
    monthRecords.map((r) => [new Date(r.date).toISOString().split("T")[0], r])
  );

  const days: { dateStr: string; date: Date }[] = [];
  for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
    days.push({ dateStr: d.toISOString().split("T")[0], date: new Date(d) });
  }
  days.reverse();

  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Track your daily check-in and work hours</p>
      </div>

      {/* Check-in / check-out card */}
      <div className="max-w-sm">
        <CheckinCard
          initialRecord={
            todayRecord
              ? {
                  id: todayRecord.id,
                  status: todayRecord.status,
                  checkInTime: todayRecord.checkInTime?.toISOString() ?? null,
                  checkOutTime: todayRecord.checkOutTime?.toISOString() ?? null,
                  payMultiplier: todayRecord.payMultiplier,
                  dailyLogSubmitted: todayRecord.dailyLogSubmitted,
                  overrideReason: todayRecord.overrideReason,
                  overriddenByAdminId: todayRecord.overriddenByAdminId,
                }
              : null
          }
        />
      </div>

      {/* Monthly table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{monthLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Pay</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map(({ dateStr, date }) => {
                const rec = recordMap.get(dateStr);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <TableRow key={dateStr} className={isWeekend ? "opacity-50" : ""}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {fmtDate(date)}
                    </TableCell>
                    <TableCell>
                      {rec ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              statusStyle[rec.status]
                            )}
                          >
                            {rec.status}
                          </span>
                          {rec.overriddenByAdminId && (
                            <span
                              className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 cursor-help"
                              title={`Overridden by ${rec.overriddenBy?.name ?? "admin"}: ${rec.overrideReason}`}
                            >
                              Edited by Admin
                            </span>
                          )}
                        </div>
                      ) : isWeekend ? (
                        <span className="text-xs text-muted-foreground">Weekend</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {rec?.checkInTime ? fmtTime(rec.checkInTime.toISOString()) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {rec?.checkOutTime ? fmtTime(rec.checkOutTime.toISOString()) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {rec ? `${rec.payMultiplier}×` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {rec?.dailyLogSubmitted ? "Log ✓" : ""}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
