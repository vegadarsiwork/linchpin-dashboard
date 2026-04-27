import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const adjustment = await prisma.payAdjustment.findUnique({ where: { id } });
  if (!adjustment) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await prisma.payAdjustment.delete({ where: { id } });

  const payRecord = await prisma.payRecord.findUnique({
    where: { id: adjustment.payRecordId },
    include: { adjustments: true },
  });
  if (payRecord) {
    const adjTotal = payRecord.adjustments.reduce((s, a) => s + a.amount, 0);
    await prisma.payRecord.update({
      where: { id: payRecord.id },
      data: { calculatedPay: payRecord.basePay + adjTotal },
    });
  }

  return new NextResponse(null, { status: 204 });
}
