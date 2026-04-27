import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, InvoiceStatus } from "@prisma/client";

type Item = { description: string; quantity: number; rate: number };

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const { status, clientName, clientAddress, clientGSTIN, lineItems, gstRate } = await req.json();

  const data: Prisma.InvoiceUpdateInput = {};

  if (status !== undefined) data.status = status as InvoiceStatus;
  if (clientName !== undefined) data.clientName = clientName;
  if (clientAddress !== undefined) data.clientAddress = clientAddress;
  if (clientGSTIN !== undefined) data.clientGSTIN = clientGSTIN;

  if (lineItems !== undefined) {
    const subtotal = (lineItems as Item[]).reduce((s, i) => s + i.quantity * i.rate, 0);
    const rate = gstRate ?? existing.gstRate;
    const gstAmount = (subtotal * rate) / 100;
    data.lineItems = (lineItems as Item[]).map((i) => ({ ...i, amount: i.quantity * i.rate }));
    data.subtotal = subtotal;
    data.gstRate = rate;
    data.gstAmount = gstAmount;
    data.totalAmount = subtotal + gstAmount;
  } else if (gstRate !== undefined) {
    const gstAmount = (existing.subtotal * gstRate) / 100;
    data.gstRate = gstRate;
    data.gstAmount = gstAmount;
    data.totalAmount = existing.subtotal + gstAmount;
  }

  const invoice = await prisma.invoice.update({ where: { id }, data });
  return NextResponse.json(invoice);
}
