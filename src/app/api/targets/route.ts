import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Priority, TargetStatus, Timeframe } from "@prisma/client";

const include = {
  assignedBy: { select: { name: true, email: true } },
  assignedTo: { select: { name: true, email: true } },
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  if (user.role !== "ADMIN") {
    const targets = await prisma.target.findMany({
      where: { assignedToId: user.id },
      include,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(targets);
  }

  // Admin — with optional filters
  const userId = searchParams.get("userId") ?? undefined;
  const priority = (searchParams.get("priority") as Priority) ?? undefined;
  const status = (searchParams.get("status") as TargetStatus) ?? undefined;
  const timeframe = (searchParams.get("timeframe") as Timeframe) ?? undefined;

  const targets = await prisma.target.findMany({
    where: {
      ...(userId ? { assignedToId: userId } : {}),
      ...(priority ? { priority } : {}),
      ...(status ? { status } : {}),
      ...(timeframe ? { timeframe } : {}),
    },
    include,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(targets);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { assignedToId, title, description, priority, timeframe, dueDate } = await req.json();

  if (!assignedToId || !title || !priority || !timeframe) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const target = await prisma.target.create({
    data: {
      assignedById: user.id,
      assignedToId,
      title,
      description: description ?? null,
      priority,
      timeframe,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "PENDING",
    },
    include,
  });

  return NextResponse.json(target, { status: 201 });
}
