"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FormItem = { description: string; quantity: number; rate: number };

type FormState = {
  clientName: string;
  clientAddress: string;
  clientGSTIN: string;
  lineItems: FormItem[];
  gstRate: number;
  paymentTerms: string;
};

const EMPTY_FORM: FormState = {
  clientName: "",
  clientAddress: "",
  clientGSTIN: "",
  lineItems: [{ description: "", quantity: 1, rate: 0 }],
  gstRate: 18,
  paymentTerms: "Due within 30 days of invoice date.",
};

const GST_RATES = [0, 5, 12, 18, 28];

export function InvoiceForm({
  isQuotation,
  onSuccess,
  onCancel,
}: {
  isQuotation: boolean;
  onSuccess: (id: string, number: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = form.lineItems.reduce((s, i) => s + i.quantity * i.rate, 0);
  const gstAmount = (subtotal * form.gstRate) / 100;
  const totalAmount = subtotal + gstAmount;

  function updateItem(idx: number, field: keyof FormItem, value: string | number) {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: "", quantity: 1, rate: 0 }],
    }));
  }

  function removeItem(idx: number) {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== idx),
    }));
  }

  async function handleSubmit() {
    if (!form.clientName) { setError("Client name is required."); return; }
    if (form.lineItems.some((i) => !i.description)) { setError("All line items need a description."); return; }

    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isQuotation }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to save."); return; }
      onSuccess(data.id, data.invoiceNumber);
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6 rounded-md border p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          New {isQuotation ? "Quotation" : "Invoice"}
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>

      {/* Client details */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Client Name <span className="text-destructive">*</span></Label>
          <Input
            placeholder="Acme Pvt. Ltd."
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Client GSTIN</Label>
          <Input
            placeholder="22AAAAA0000A1Z5"
            value={form.clientGSTIN}
            onChange={(e) => setForm({ ...form, clientGSTIN: e.target.value })}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Client Address</Label>
          <Textarea
            rows={2}
            placeholder="Street, City, State - PIN"
            value={form.clientAddress}
            onChange={(e) => setForm({ ...form, clientAddress: e.target.value })}
          />
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_70px_100px_90px_32px] gap-2">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Label className="text-xs text-muted-foreground">Qty</Label>
          <Label className="text-xs text-muted-foreground">Rate (₹)</Label>
          <Label className="text-right text-xs text-muted-foreground">Amount</Label>
          <span />
        </div>
        {form.lineItems.map((item, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_70px_100px_90px_32px] gap-2 items-center">
            <Input
              placeholder="Description of service"
              value={item.description}
              onChange={(e) => updateItem(idx, "description", e.target.value)}
            />
            <Input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(idx, "quantity", Number(e.target.value) || 1)}
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={item.rate}
              onChange={(e) => updateItem(idx, "rate", Number(e.target.value) || 0)}
            />
            <p className="text-right text-sm font-medium tabular-nums">
              ₹{(item.quantity * item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(idx)}
              disabled={form.lineItems.length === 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Line Item
        </Button>
      </div>

      {/* GST + Totals */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label>GST Rate</Label>
          <Select
            value={String(form.gstRate)}
            onValueChange={(v) => setForm({ ...form, gstRate: Number(v ?? 18) })}
          >
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GST_RATES.map((r) => (
                <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[200px] space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST ({form.gstRate}%)</span>
            <span>₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className={cn("flex justify-between rounded px-2 py-1.5 font-semibold", "bg-primary text-primary-foreground")}>
            <span>Total</span>
            <span>₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Payment terms */}
      <div className="space-y-1">
        <Label>Payment Terms</Label>
        <Input
          value={form.paymentTerms}
          onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving…" : `Create ${isQuotation ? "Quotation" : "Invoice"}`}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
