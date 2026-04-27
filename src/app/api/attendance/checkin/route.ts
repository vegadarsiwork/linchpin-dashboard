import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LATE_HOUR = 9;
const LATE_MIN = 30;

function isOfficeIp(ip: string): boolean {
  const raw = process.env.OFFICE_IP ?? "";
  if (!raw) return true; // skip check if env not set
  return raw.split(",").map((s) => s.trim()).includes(ip);
}

function isLate(time: Date): boolean {
  const h = time.getHours();
  const m = time.getMinutes();
  return h > LATE_HOUR || (h === LATE_HOUR && m >= LATE_MIN);
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : (headersList.get("x-real-ip") ?? "");

  if (!isOfficeIp(ip)) {
    return NextResponse.json(
      { message: "You must be connected to the office WiFi to check in" },
      { status: 403 }
    );
  }

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });

  if (existing) {
    return NextResponse.json(
      { message: "Already checked in today" },
      { status: 400 }
    );
  }

  const late = isLate(now);
  const record = await prisma.attendance.create({
    data: {
      userId: user.id,
      date: today,
      checkInTime: now,
      status: late ? "LATE" : "PRESENT",
      payMultiplier: late ? 0.5 : 1.0,
      markedAt: now,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
