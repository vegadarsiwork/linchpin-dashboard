"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InvoiceForm } from "./invoice-form";
import type { InvoiceStatus } from "@prisma/client";

type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  isQuotation: boolean;
  createdAt: string;
};

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  SENT: "bg-sky-100 text-sky-800",
  PAID: "bg-green-100 text-green-800",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAmount(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<"none" | "invoice" | "quotation">("none");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) setInvoices(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  function handleFormSuccess(id: string, number: string) {
    setFormMode("none");
    setCreatedId(id);
    fetchInvoices();
    toast.success(`${number} created.`, {
      action: {
        label: "Preview PDF",
        onClick: () => window.open(`/api/invoices/${id}/pdf`, "_blank"),
      },
    });
    setTimeout(() => setCreatedId(null), 5000);
  }

  async function handleStatusChange(id: string, status: InvoiceStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
        );
        toast.success(`Status updated to ${status}.`);
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("Network error.");
    } finally { setUpdatingId(null); }
  }

  return (
    <div className="space-y-5">
      {/* Action bar */}
      {formMode === "none" && (
        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-2"
            onClick={() => setFormMode("invoice")}
          >
            <FileText className="h-4 w-4" />
            New Invoice
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setFormMode("quotation")}
          >
            <FileText className="h-4 w-4" />
            New Quotation
          </Button>
        </div>
      )}

      {createdId && (
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-4 py-2">
          <p className="text-sm text-green-700">Invoice created successfully.</p>
          <div className="flex gap-2">
            <a href={`/api/invoices/${createdId}/pdf`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Preview PDF
              </Button>
            </a>
            <a href={`/api/invoices/${createdId}/pdf`} download>
              <Button size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Form */}
      {formMode !== "none" && (
        <InvoiceForm
          isQuotation={formMode === "quotation"}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormMode("none")}
        />
      )}

      {/* Invoices table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No invoices yet.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        inv.isQuotation
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      )}
                    >
                      {inv.isQuotation ? "Quotation" : "Invoice"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <p className="truncate text-sm">{inv.clientName}</p>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">
                    {fmtAmount(inv.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={inv.status}
                      onValueChange={(v) => handleStatusChange(inv.id, (v ?? inv.status) as InvoiceStatus)}
                      disabled={updatingId === inv.id}
                    >
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["DRAFT", "SENT", "PAID"] as InvoiceStatus[]).map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            <span className={cn("rounded-full px-1.5 py-0.5 text-xs", STATUS_STYLE[s])}>
                              {s}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(inv.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/api/invoices/${inv.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
