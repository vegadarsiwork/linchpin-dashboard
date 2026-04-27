"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdjustmentType } from "@prisma/client";

type Adjustment = {
  id: string;
  type: AdjustmentType;
  label: string;
  amount: number;
};

type PayRecord = {
  id: string;
  month: string;
  baseSalary: number;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  basePay: number;
  calculatedPay: number;
  notes: string | null;
  hasAttendanceOverrides: boolean;
  adjustments: Adjustment[];
};

function fmtINR(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
}

function RecordRow({ record }: { record: PayRecord }) {
  const [open, setOpen] = useState(false);
  const adjTotal = record.adjustments.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="rounded-md border">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">{fmtMonth(record.month)}</p>
            <p className="text-xs text-muted-foreground">
              {record.presentDays}P / {record.lateDays}L / {record.absentDays}A · {record.workingDays} logged
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {record.hasAttendanceOverrides && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-sm font-semibold tabular-nums">{fmtINR(record.calculatedPay)}</span>
        </div>
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Base Salary</p>
              <p className="font-medium">{fmtINR(record.baseSalary)}</p>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Present Days</p>
              <p className="font-medium">{record.presentDays}</p>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Late Days (×0.5)</p>
              <p className="font-medium">{record.lateDays}</p>
            </div>
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Absent Days</p>
              <p className="font-medium">{record.absentDays}</p>
            </div>
          </div>

          <div className="rounded-md bg-muted/30 px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Attendance-weighted pay</span>
              <span className="tabular-nums">{fmtINR(record.basePay)}</span>
            </div>
            {record.adjustments.map((adj) => (
              <div key={adj.id} className="flex justify-between">
                <span className={cn(
                  "text-muted-foreground",
                  adj.amount < 0 && "text-red-600",
                  adj.amount > 0 && "text-green-700"
                )}>
                  {adj.label}
                  <span className="ml-1 text-xs opacity-60">({adj.type})</span>
                </span>
                <span className={cn(
                  "tabular-nums font-medium",
                  adj.amount < 0 ? "text-red-600" : "text-green-700"
                )}>
                  {adj.amount < 0 ? "-" : "+"}{fmtINR(Math.abs(adj.amount))}
                </span>
              </div>
            ))}
            {record.adjustments.length > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                <span>Adjustments total</span>
                <span className={cn("tabular-nums", adjTotal < 0 ? "text-red-600" : adjTotal > 0 ? "text-green-700" : "")}>
                  {adjTotal >= 0 ? "+" : ""}{fmtINR(adjTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total Pay</span>
              <span className="tabular-nums">{fmtINR(record.calculatedPay)}</span>
            </div>
          </div>

          {record.hasAttendanceOverrides && (
            <p className="flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              One or more attendance records this month were overridden by an admin.
            </p>
          )}
          {record.notes && (
            <p className="text-xs text-muted-foreground">{record.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function EmployeePayView({ userId }: { userId: string }) {
  const [records, setRecords] = useState<PayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pay/${userId}`)
      .then((r) => r.json())
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading pay history…</p>;
  }

  if (records.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pay records yet. Your admin will generate them at the end of each month.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((r) => <RecordRow key={r.id} record={r} />)}
    </div>
  );
}
