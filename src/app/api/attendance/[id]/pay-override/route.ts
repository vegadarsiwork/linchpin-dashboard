import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { payMultiplier, overrideReason } = await req.json();

  if (payMultiplier === undefined || !overrideReason) {
    return NextResponse.json(
      { message: "payMultiplier and overrideReason are required" },
      { status: 400 }
    );
  }

  const record = await prisma.attendance.update({
    where: { id },
    data: { payMultiplier, overrideReason, overriddenByAdminId: admin.id, markedAt: new Date() },
  });

  return NextResponse.json(record);
}
