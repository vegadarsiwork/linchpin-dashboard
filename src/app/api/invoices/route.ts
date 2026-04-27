import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { InvoiceStatus } from "@prisma/client";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as InvoiceStatus | null;
  const isQuotation = searchParams.get("isQuotation");

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(isQuotation !== null ? { isQuotation: isQuotation === "true" } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      invoiceNumber: true,
      clientName: true,
      subtotal: true,
      gstRate: true,
      gstAmount: true,
      totalAmount: true,
      status: true,
      isQuotation: true,
      createdAt: true,
    },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const {
    isQuotation,
    clientName,
    clientAddress,
    clientGSTIN,
    lineItems,
    gstRate,
    paymentTerms,
  } = await req.json();

  if (!clientName || !Array.isArray(lineItems) || lineItems.length === 0) {
    return NextResponse.json({ message: "clientName and lineItems are required" }, { status: 400 });
  }

  // Compute totals
  const subtotal = lineItems.reduce(
    (sum: number, i: { quantity: number; rate: number }) => sum + i.quantity * i.rate,
    0
  );
  const rate = gstRate ?? 18;
  const gstAmount = (subtotal * rate) / 100;
  const totalAmount = subtotal + gstAmount;

  // Enrich lineItems with amount
  const enriched = lineItems.map((i: { description: string; quantity: number; rate: number }) => ({
    ...i,
    amount: i.quantity * i.rate,
  }));

  // Generate invoice number
  const prefix = isQuotation ? "QUO" : "INV";
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({ where: { isQuotation: !!isQuotation } });
  const invoiceNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      createdById: user.id,
      invoiceNumber,
      clientName,
      clientAddress: clientAddress ?? null,
      clientGSTIN: clientGSTIN ?? null,
      lineItems: enriched,
      subtotal,
      gstRate: rate,
      gstAmount,
      totalAmount,
      isQuotation: !!isQuotation,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
