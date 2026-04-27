import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const include = {
  user: { select: { name: true, email: true } },
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // YYYY-MM
  const filterUserId = searchParams.get("userId");

  const now = new Date();
  const [year, mon] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 0, 23, 59, 59, 999);

  let where: Prisma.CalendarEventWhereInput;

  if (user.role !== "ADMIN") {
    // Employees see their own events + company-wide
    where = {
      startTime: { gte: start, lte: end },
      OR: [{ userId: user.id }, { isCompanyWide: true }],
    };
  } else if (filterUserId) {
    // Admin viewing a specific employee: their non-private events + company-wide
    where = {
      startTime: { gte: start, lte: end },
      OR: [
        { userId: filterUserId, isPrivate: false },
        { isCompanyWide: true },
      ],
    };
  } else {
    // Admin viewing all: all non-private events (includes company-wide)
    where = {
      startTime: { gte: start, lte: end },
      isPrivate: false,
    };
  }

  const events = await prisma.calendarEvent.findMany({
    where,
    include,
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { title, description, startTime, endTime, isPrivate, isCompanyWide } = await req.json();

  if (!title || !startTime || !endTime) {
    return NextResponse.json(
      { message: "title, startTime, and endTime are required" },
      { status: 400 }
    );
  }

  const companyWide = user.role === "ADMIN" && isCompanyWide === true;

  const event = await prisma.calendarEvent.create({
    data: {
      userId: user.id,
      title,
      description: description ?? null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isPrivate: companyWide ? false : (isPrivate ?? false),
      isCompanyWide: companyWide,
    },
    include,
  });

  return NextResponse.json(event, { status: 201 });
}
