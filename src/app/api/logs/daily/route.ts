import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ message: "Content is required" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    create: { userId: user.id, date: today, content: content.trim(), submittedAt: new Date() },
    update: { content: content.trim(), submittedAt: new Date() },
  });

  // Reflect in attendance record for today
  await prisma.attendance.updateMany({
    where: { userId: user.id, date: today },
    data: { dailyLogSubmitted: true },
  });

  return NextResponse.json(log, { status: 201 });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const userIdParam = searchParams.get("userId");

  // Admin can view any user's log by passing ?userId=
  const targetUserId =
    userIdParam && user.role === "ADMIN" ? userIdParam : user.id;

  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);

  const log = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: targetUserId, date } },
    include: { submittedBy: { select: { name: true } } },
  });

  return NextResponse.json(log);
}
