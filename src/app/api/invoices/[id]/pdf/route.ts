import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoicePDF } from "@/lib/invoice-pdf";
import type { InvoiceData, LineItem } from "@/lib/invoice-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const lineItems = invoice.lineItems as LineItem[];

  const data: InvoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.createdAt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    isQuotation: invoice.isQuotation,
    companyName: process.env.COMPANY_NAME ?? "Linchpin",
    companyAddress: process.env.COMPANY_ADDRESS ?? "",
    companyGSTIN: process.env.COMPANY_GSTIN ?? undefined,
    clientName: invoice.clientName,
    clientAddress: invoice.clientAddress ?? undefined,
    clientGSTIN: invoice.clientGSTIN ?? undefined,
    lineItems,
    subtotal: invoice.subtotal,
    gstRate: invoice.gstRate,
    gstAmount: invoice.gstAmount,
    totalAmount: invoice.totalAmount,
  };

  const element = React.createElement(InvoicePDF, { data }) as unknown as React.ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
