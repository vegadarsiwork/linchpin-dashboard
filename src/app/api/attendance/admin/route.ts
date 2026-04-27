import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");

  const date = dateParam ? new Date(dateParam) : new Date();
  date.setHours(0, 0, 0, 0);

  const [users, records] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "INTERN"] } },
      select: { id: true, name: true, email: true, designation: true, avatarUrl: true },
      orderBy: { name: "asc" },
    }),
    prisma.attendance.findMany({
      where: { date },
      include: { overriddenBy: { select: { name: true } } },
    }),
  ]);

  const recordMap = new Map(records.map((r) => [r.userId, r]));

  const rows = users.map((u) => ({
    user: u,
    attendance: recordMap.get(u.id) ?? null,
  }));

  return NextResponse.json(rows);
}
