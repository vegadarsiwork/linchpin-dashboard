import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const include = {
  user: { select: { name: true, email: true } },
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (user.role !== "ADMIN" && existing.userId !== user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { title, description, startTime, endTime, isPrivate, isCompanyWide } = await req.json();

  const event = await prisma.calendarEvent.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(startTime !== undefined ? { startTime: new Date(startTime) } : {}),
      ...(endTime !== undefined ? { endTime: new Date(endTime) } : {}),
      ...(isPrivate !== undefined ? { isPrivate } : {}),
      ...(isCompanyWide !== undefined && user.role === "ADMIN" ? { isCompanyWide } : {}),
    },
    include,
  });

  return NextResponse.json(event);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });
  if (user.role !== "ADMIN" && existing.userId !== user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await prisma.calendarEvent.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
