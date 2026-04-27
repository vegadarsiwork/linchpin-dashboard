import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");

  let monthFilter: { gte: Date; lt: Date } | undefined;
  if (monthParam) {
    const [year, mon] = monthParam.split("-").map(Number);
    monthFilter = {
      gte: new Date(Date.UTC(year, mon - 1, 1)),
      lt: new Date(Date.UTC(year, mon, 1)),
    };
  }

  const records = await prisma.payRecord.findMany({
    where: monthFilter ? { month: monthFilter } : undefined,
    orderBy: [{ month: "desc" }, { userId: "asc" }],
    include: {
      user: { select: { id: true, name: true, email: true, designation: true } },
      adjustments: true,
    },
  });

  return NextResponse.json(records);
}
