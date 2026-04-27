import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyLogsView } from "@/components/logs/my-logs-view";

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default async function MyLogsPage() {
  const user = await requireAuth();

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const weekStart = getWeekStart();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const [todayLog, weeklyLog, monthlyLog] = await Promise.all([
    prisma.dailyLog
      .findUnique({
        where: { userId_date: { userId: user.id, date: today } },
        include: { submittedBy: { select: { name: true } } },
      })
      .catch(() => null),
    prisma.weeklyLog
      .findUnique({ where: { userId_weekStart: { userId: user.id, weekStart } } })
      .catch(() => null),
    prisma.monthlyLog
      .findUnique({ where: { userId_month: { userId: user.id, month: monthStart } } })
      .catch(() => null),
  ]);

  function serializeLog(log: typeof todayLog) {
    if (!log) return null;
    return {
      id: log.id,
      date: log.date.toISOString(),
      content: log.content,
      submittedAt: log.submittedAt.toISOString(),
      submittedByAdminId: log.submittedByAdminId,
      overrideReason: log.overrideReason,
      submittedBy: log.submittedBy,
    };
  }

  function serializePeriod(log: { id: string; rawSummary: string; aiSummary: string | null; generatedAt: Date } | null) {
    if (!log) return null;
    return {
      id: log.id,
      rawSummary: log.rawSummary,
      aiSummary: log.aiSummary,
      generatedAt: log.generatedAt.toISOString(),
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Logs</h1>
        <p className="text-muted-foreground">Daily work logs and AI-generated summaries</p>
      </div>
      <MyLogsView
        todayLog={serializeLog(todayLog)}
        weeklyLog={serializePeriod(weeklyLog)}
        monthlyLog={serializePeriod(monthlyLog)}
        todayStr={todayStr}
      />
    </div>
  );
}
