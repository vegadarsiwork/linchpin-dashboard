import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });

  if (!existing) {
    return NextResponse.json({ message: "No check-in found for today" }, { status: 400 });
  }

  if (existing.checkOutTime) {
    return NextResponse.json({ message: "Already checked out today" }, { status: 400 });
  }

  const record = await prisma.attendance.update({
    where: { id: existing.id },
    data: { checkOutTime: new Date() },
  });

  return NextResponse.json(record);
}
