import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TargetStatus } from "@prisma/client";

const include = {
  assignedBy: { select: { name: true, email: true } },
  assignedTo: { select: { name: true, email: true } },
};

const EMPLOYEE_STATUSES: TargetStatus[] = ["IN_PROGRESS", "COMPLETED"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.target.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "Target not found" }, { status: 404 });

  if (user.role !== "ADMIN") {
    if (existing.assignedToId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (!body.status || !EMPLOYEE_STATUSES.includes(body.status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }
    const target = await prisma.target.update({
      where: { id },
      data: { status: body.status },
      include,
    });
    return NextResponse.json(target);
  }

  // Admin — update any provided fields
  const { title, description, priority, timeframe, dueDate, status, assignedToId } = body;

  const target = await prisma.target.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(timeframe !== undefined ? { timeframe } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(assignedToId !== undefined ? { assignedToId } : {}),
    },
    include,
  });

  return NextResponse.json(target);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await prisma.target.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
