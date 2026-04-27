import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { userId } = await params;

  if (user.role !== "ADMIN" && user.id !== userId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const records = await prisma.payRecord.findMany({
    where: { userId },
    orderBy: { month: "desc" },
    include: {
      adjustments: { orderBy: { createdAt: "asc" } },
    },
  });

  const overrideMonths = await prisma.attendance.findMany({
    where: { userId, overriddenByAdminId: { not: null } },
    select: { date: true },
  });

  const overrideSet = new Set(
    overrideMonths.map((a) => {
      const d = new Date(a.date);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    })
  );

  const result = records.map((r) => {
    const d = new Date(r.month);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { ...r, hasAttendanceOverrides: overrideSet.has(key) };
  });

  return NextResponse.json(result);
}
