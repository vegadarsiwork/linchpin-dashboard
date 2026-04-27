import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { userId, date, status, checkInTime, checkOutTime, payMultiplier, overrideReason } =
    await req.json();

  if (!userId || !date || !status || !overrideReason) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const record = await prisma.attendance.upsert({
    where: { userId_date: { userId, date: dateObj } },
    create: {
      userId,
      date: dateObj,
      status,
      checkInTime: checkInTime ? new Date(checkInTime) : null,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      payMultiplier: payMultiplier ?? 1.0,
      overrideReason,
      overriddenByAdminId: admin.id,
      markedAt: new Date(),
    },
    update: {
      status,
      checkInTime: checkInTime ? new Date(checkInTime) : null,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      payMultiplier: payMultiplier ?? 1.0,
      overrideReason,
      overriddenByAdminId: admin.id,
      markedAt: new Date(),
    },
  });

  return NextResponse.json(record);
}
