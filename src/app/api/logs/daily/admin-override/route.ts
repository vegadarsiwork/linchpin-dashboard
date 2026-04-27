import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function adminOnly() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (admin.role !== "ADMIN") return adminOnly();

  const { userId, date, content, overrideReason } = await req.json();

  if (!userId || !date || !content?.trim() || !overrideReason?.trim()) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId, date: dateObj } },
    create: {
      userId,
      date: dateObj,
      content: content.trim(),
      submittedByAdminId: admin.id,
      overrideReason: overrideReason.trim(),
      submittedAt: new Date(),
    },
    update: {
      content: content.trim(),
      submittedByAdminId: admin.id,
      overrideReason: overrideReason.trim(),
      submittedAt: new Date(),
    },
  });

  await prisma.attendance.updateMany({
    where: { userId, date: dateObj },
    data: { dailyLogSubmitted: true },
  });

  return NextResponse.json(log, { status: 201 });
}

// Returns all admin-submitted logs (history)
export async function GET() {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (admin.role !== "ADMIN") return adminOnly();

  const logs = await prisma.dailyLog.findMany({
    where: { submittedByAdminId: { not: null } },
    include: {
      user: { select: { name: true, email: true } },
      submittedBy: { select: { name: true } },
    },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(logs);
}
