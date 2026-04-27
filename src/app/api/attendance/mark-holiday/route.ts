import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { date, overrideReason } = await req.json();
  if (!date || !overrideReason) {
    return NextResponse.json({ message: "date and overrideReason are required" }, { status: 400 });
  }

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({ select: { id: true } });

  await Promise.all(
    users.map((u) =>
      prisma.attendance.upsert({
        where: { userId_date: { userId: u.id, date: dateObj } },
        create: {
          userId: u.id,
          date: dateObj,
          status: "HOLIDAY",
          payMultiplier: 1.0,
          overrideReason,
          overriddenByAdminId: admin.id,
          markedAt: new Date(),
        },
        update: {
          status: "HOLIDAY",
          overrideReason,
          overriddenByAdminId: admin.id,
          markedAt: new Date(),
        },
      })
    )
  );

  return NextResponse.json({ message: "Holiday marked for all users", count: users.length });
}
