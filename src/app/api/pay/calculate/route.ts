import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { userId, month } = await req.json();
  if (!userId || !month) {
    return NextResponse.json({ message: "userId and month required" }, { status: 400 });
  }

  const [year, mon] = (month as string).split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, mon - 1, 1));
  const monthEnd = new Date(Date.UTC(year, mon, 1));
  const totalDaysInMonth = new Date(Date.UTC(year, mon, 0)).getDate();

  const employee = await prisma.user.findUnique({ where: { id: userId } });
  if (!employee) return NextResponse.json({ message: "User not found" }, { status: 404 });
  if (!employee.baseMonthlySalary) {
    return NextResponse.json({ message: "User has no baseMonthlySalary set" }, { status: 422 });
  }

  const attendance = await prisma.attendance.findMany({
    where: { userId, date: { gte: monthStart, lt: monthEnd } },
  });

  const dailyRate = employee.baseMonthlySalary / totalDaysInMonth;
  let presentDays = 0;
  let lateDays = 0;
  let absentDays = 0;
  let basePay = 0;

  for (const a of attendance) {
    if (a.status === "PRESENT") presentDays++;
    else if (a.status === "LATE") lateDays++;
    else if (a.status === "ABSENT") absentDays++;
    basePay += dailyRate * a.payMultiplier;
  }

  const existing = await prisma.payRecord.findUnique({
    where: { userId_month: { userId, month: monthStart } },
    include: { adjustments: true },
  });

  const adjustmentTotal = existing
    ? existing.adjustments.reduce((s, a) => s + a.amount, 0)
    : 0;

  const record = await prisma.payRecord.upsert({
    where: { userId_month: { userId, month: monthStart } },
    create: {
      userId,
      month: monthStart,
      baseSalary: employee.baseMonthlySalary,
      workingDays: attendance.length,
      presentDays,
      lateDays,
      absentDays,
      basePay,
      calculatedPay: basePay + adjustmentTotal,
    },
    update: {
      baseSalary: employee.baseMonthlySalary,
      workingDays: attendance.length,
      presentDays,
      lateDays,
      absentDays,
      basePay,
      calculatedPay: basePay + adjustmentTotal,
    },
    include: { adjustments: true },
  });

  return NextResponse.json(record);
}
