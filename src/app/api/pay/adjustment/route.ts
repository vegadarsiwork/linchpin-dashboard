import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdjustmentType } from "@prisma/client";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { payRecordId, type, label, amount } = await req.json();
  if (!payRecordId || !type || !label || amount === undefined) {
    return NextResponse.json({ message: "payRecordId, type, label, amount required" }, { status: 400 });
  }

  const payRecord = await prisma.payRecord.findUnique({
    where: { id: payRecordId },
    include: { adjustments: true },
  });
  if (!payRecord) return NextResponse.json({ message: "PayRecord not found" }, { status: 404 });

  const adjustment = await prisma.payAdjustment.create({
    data: {
      payRecordId,
      addedById: user.id,
      type: type as AdjustmentType,
      label,
      amount,
    },
  });

  const newAdjTotal = payRecord.adjustments.reduce((s, a) => s + a.amount, 0) + amount;
  await prisma.payRecord.update({
    where: { id: payRecordId },
    data: { calculatedPay: payRecord.basePay + newAdjTotal },
  });

  return NextResponse.json(adjustment, { status: 201 });
}
