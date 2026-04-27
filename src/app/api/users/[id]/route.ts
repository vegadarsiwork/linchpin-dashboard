import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const { name, designation, baseMonthlySalary, role, isActive } = await req.json();

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(designation !== undefined && { designation }),
      ...(baseMonthlySalary !== undefined && { baseMonthlySalary }),
      ...(role !== undefined && { role: role as Role }),
      ...(isActive !== undefined && { isActive }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      role: true,
      baseMonthlySalary: true,
      isActive: true,
    },
  });

  return NextResponse.json(updated);
}
