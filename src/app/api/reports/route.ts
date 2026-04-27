import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const reports = await prisma.dailyReport.findMany({
    orderBy: { date: "desc" },
    select: { id: true, date: true, content: true, generatedAt: true },
  });

  return NextResponse.json(reports);
}
