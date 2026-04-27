import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const record = await prisma.attendance.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
    include: { overriddenBy: { select: { name: true } } },
  });

  return NextResponse.json(record);
}
