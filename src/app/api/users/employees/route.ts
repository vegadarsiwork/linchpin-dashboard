import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const employees = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "INTERN"] }, isActive: true },
    select: { id: true, name: true, email: true, designation: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(employees);
}
