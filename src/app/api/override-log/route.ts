import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type OverrideEntry = {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  actionType: "Attendance Edit" | "Log Submitted" | "Pay Adjustment";
  employeeName: string;
  employeeEmail: string;
  details: string;
  reason: string | null;
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const employeeId = searchParams.get("employeeId");
  const actionType = searchParams.get("actionType");

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const entries: OverrideEntry[] = [];

  // 1. Attendance overrides
  if (!actionType || actionType === "Attendance Edit") {
    const overrides = await prisma.attendance.findMany({
      where: {
        overriddenByAdminId: { not: null },
        ...(employeeId && { userId: employeeId }),
        ...(fromDate && { markedAt: { gte: fromDate } }),
        ...(toDate && { markedAt: { lte: toDate } }),
      },
      include: {
        user: { select: { name: true, email: true } },
        overriddenBy: { select: { name: true, email: true } },
      },
      orderBy: { markedAt: "desc" },
      take: 200,
    });

    for (const a of overrides) {
      if (!a.overriddenBy) continue;
      entries.push({
        id: `att-${a.id}`,
        timestamp: a.markedAt.toISOString(),
        adminName: a.overriddenBy.name ?? a.overriddenBy.email ?? "Admin",
        adminEmail: a.overriddenBy.email ?? "",
        actionType: "Attendance Edit",
        employeeName: a.user.name ?? a.user.email ?? "Employee",
        employeeEmail: a.user.email ?? "",
        details: `${a.date.toISOString().slice(0, 10)} → ${a.status}${a.payMultiplier !== 1 ? ` (pay ×${a.payMultiplier})` : ""}`,
        reason: a.overrideReason,
      });
    }
  }

  // 2. Log submitted by admin
  if (!actionType || actionType === "Log Submitted") {
    const logs = await prisma.dailyLog.findMany({
      where: {
        submittedByAdminId: { not: null },
        ...(employeeId && { userId: employeeId }),
        ...(fromDate && { submittedAt: { gte: fromDate } }),
        ...(toDate && { submittedAt: { lte: toDate } }),
      },
      include: {
        user: { select: { name: true, email: true } },
        submittedBy: { select: { name: true, email: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 200,
    });

    for (const l of logs) {
      if (!l.submittedBy) continue;
      const preview = l.content.length > 80 ? l.content.slice(0, 80) + "…" : l.content;
      entries.push({
        id: `log-${l.id}`,
        timestamp: l.submittedAt.toISOString(),
        adminName: l.submittedBy.name ?? l.submittedBy.email ?? "Admin",
        adminEmail: l.submittedBy.email ?? "",
        actionType: "Log Submitted",
        employeeName: l.user.name ?? l.user.email ?? "Employee",
        employeeEmail: l.user.email ?? "",
        details: `${l.date.toISOString().slice(0, 10)}: "${preview}"`,
        reason: l.overrideReason,
      });
    }
  }

  // 3. Pay adjustments
  if (!actionType || actionType === "Pay Adjustment") {
    const adjs = await prisma.payAdjustment.findMany({
      where: {
        ...(fromDate && { createdAt: { gte: fromDate } }),
        ...(toDate && { createdAt: { lte: toDate } }),
        ...(employeeId && { payRecord: { userId: employeeId } }),
      },
      include: {
        addedBy: { select: { name: true, email: true } },
        payRecord: {
          select: {
            month: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    for (const a of adjs) {
      const sign = a.amount >= 0 ? "+" : "";
      entries.push({
        id: `adj-${a.id}`,
        timestamp: a.createdAt.toISOString(),
        adminName: a.addedBy.name ?? a.addedBy.email ?? "Admin",
        adminEmail: a.addedBy.email ?? "",
        actionType: "Pay Adjustment",
        employeeName: a.payRecord.user.name ?? a.payRecord.user.email ?? "Employee",
        employeeEmail: a.payRecord.user.email ?? "",
        details: `${a.payRecord.month.toISOString().slice(0, 7)} — ${a.type}: ${a.label} (${sign}₹${Math.abs(a.amount).toLocaleString("en-IN")})`,
        reason: null,
      });
    }
  }

  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return NextResponse.json(entries);
}
