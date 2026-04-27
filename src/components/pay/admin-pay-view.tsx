"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Calculator, Plus, Trash2, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AdjustmentType } from "@prisma/client";

type User = { id: string; name: string | null; email: string | null; designation: string | null };

type Adjustment = {
  id: string;
  type: AdjustmentType;
  label: string;
  amount: number;
  createdAt: string;
};

type PayRecord = {
  id: string;
  userId: string;
  month: string;
  baseSalary: number;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  basePay: number;
  calculatedPay: number;
  notes: string | null;
  hasAttendanceOverrides?: boolean;
  adjustments: Adjustment[];
  user?: { id: string; name: string | null; email: string | null; designation: string | null };
};

function fmtINR(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const ADJ_TYPES: AdjustmentType[] = ["BONUS", "DEDUCTION", "REIMBURSEMENT"];

export function AdminPayView({ users }: { users: User[] }) {
  const [month, setMonth] = useState(currentMonth());
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id ?? "");
  const [record, setRecord] = useState<PayRecord | null>(null);
  const [teamRecords, setTeamRecords] = useState<PayRecord[]>([]);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjType, setAdjType] = useState<AdjustmentType>("BONUS");
  const [adjLabel, setAdjLabel] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [savingAdj, setSavingAdj] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUserRecord = useCallback(async () => {
    if (!selectedUserId) return;
    try {
      const res = await fetch(`/api/pay/${selectedUserId}`);
      if (!res.ok) return;
      const records: PayRecord[] = await res.json();
      const [year, mon] = month.split("-").map(Number);
      const found = records.find((r) => {
        const d = new Date(r.month);
        return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === mon;
      });
      setRecord(found ?? null);
    } catch {}
  }, [selectedUserId, month]);

  const fetchTeam = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch(`/api/pay?month=${month}`);
      if (res.ok) setTeamRecords(await res.json());
    } catch {}
    finally { setLoadingTeam(false); }
  }, [month]);

  useEffect(() => { fetchUserRecord(); }, [fetchUserRecord]);
  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  async function handleCalculate() {
    setLoadingCalc(true);
    try {
      const res = await fetch("/api/pay/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, month }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecord(data);
        fetchTeam();
        toast.success("Pay calculated successfully.");
      } else {
        const err = await res.json();
        toast.error(err.message ?? "Failed to calculate pay.");
      }
    } catch {
      toast.error("Network error.");
    } finally { setLoadingCalc(false); }
  }

  async function handleAddAdjustment() {
    if (!record || !adjLabel || !adjAmount) return;
    setSavingAdj(true);
    try {
      const amount = adjType === "DEDUCTION" ? -Math.abs(Number(adjAmount)) : Math.abs(Number(adjAmount));
      const res = await fetch("/api/pay/adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payRecordId: record.id, type: adjType, label: adjLabel, amount }),
      });
      if (res.ok) {
        setAdjOpen(false);
        setAdjLabel("");
        setAdjAmount("");
        await fetchUserRecord();
        await fetchTeam();
        toast.success("Adjustment added.");
      } else {
        toast.error("Failed to add adjustment.");
      }
    } catch {
      toast.error("Network error.");
    } finally { setSavingAdj(false); }
  }

  async function handleDeleteAdj(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/pay/adjustment/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchUserRecord();
        await fetchTeam();
        toast.success("Adjustment removed.");
      } else {
        toast.error("Failed to remove adjustment.");
      }
    } catch {
      toast.error("Network error.");
    } finally { setDeletingId(null); }
  }

  function exportCSV() {
    const header = "Name,Email,Designation,Base Salary,Working Days,Present,Late,Absent,Base Pay,Adjustments,Calculated Pay";
    const rows = teamRecords.map((r) => {
      const adjTotal = r.adjustments.reduce((s, a) => s + a.amount, 0);
      return [
        r.user?.name ?? "",
        r.user?.email ?? "",
        r.user?.designation ?? "",
        r.baseSalary,
        r.workingDays,
        r.presentDays,
        r.lateDays,
        r.absentDays,
        r.basePay.toFixed(2),
        adjTotal.toFixed(2),
        r.calculatedPay.toFixed(2),
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pay-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Month</Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Employee</Label>
          <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? selectedUserId)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCalculate} disabled={loadingCalc || !selectedUserId} className="gap-2">
          <Calculator className="h-4 w-4" />
          {loadingCalc ? "Calculating…" : "Calculate Pay"}
        </Button>
      </div>

      {/* Pay Breakdown */}
      {record && (
        <div className="rounded-lg border p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold">{selectedUser?.name ?? selectedUser?.email}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(record.month).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })}
              </p>
            </div>
            {record.hasAttendanceOverrides && (
              <span className="flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                Attendance overrides present
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Base Salary", value: fmtINR(record.baseSalary) },
              { label: "Working Days", value: record.workingDays },
              { label: "Present", value: record.presentDays },
              { label: "Late (×0.5)", value: record.lateDays },
            ].map((item) => (
              <div key={item.label} className="rounded-md border px-3 py-2">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-md bg-muted/40 px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Pay (attendance-weighted)</span>
              <span className="font-medium">{fmtINR(record.basePay)}</span>
            </div>
            {record.adjustments.map((adj) => (
              <div key={adj.id} className="flex items-center justify-between">
                <span className={cn(
                  "flex-1 text-muted-foreground",
                  adj.amount < 0 && "text-red-600",
                  adj.amount > 0 && adj.type !== "DEDUCTION" && "text-green-700"
                )}>
                  {adj.label}
                  <span className="ml-1.5 text-xs opacity-70">({adj.type})</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium tabular-nums",
                    adj.amount < 0 ? "text-red-600" : "text-green-700"
                  )}>
                    {adj.amount < 0 ? "-" : "+"}{fmtINR(Math.abs(adj.amount))}
                  </span>
                  <button
                    onClick={() => handleDeleteAdj(adj.id)}
                    disabled={deletingId === adj.id}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between text-base font-semibold">
              <span>Total Pay</span>
              <span>{fmtINR(record.calculatedPay)}</span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="gap-2" onClick={() => setAdjOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Adjustment
          </Button>
        </div>
      )}

      {/* Team Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Team Summary — {month}
          </h2>
          {teamRecords.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          )}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Base Pay</TableHead>
                <TableHead className="text-right">Adjustments</TableHead>
                <TableHead className="text-right">Total Pay</TableHead>
                <TableHead className="text-center">Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTeam ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : teamRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No records for this month. Calculate pay for employees above.
                  </TableCell>
                </TableRow>
              ) : (
                teamRecords.map((r) => {
                  const adjTotal = r.adjustments.reduce((s, a) => s + a.amount, 0);
                  return (
                    <TableRow
                      key={r.id}
                      className={cn(r.userId === selectedUserId && "bg-muted/40")}
                    >
                      <TableCell>
                        <p className="text-sm font-medium">{r.user?.name ?? r.user?.email}</p>
                        <p className="text-xs text-muted-foreground">{r.user?.designation ?? ""}</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtINR(r.basePay)}</TableCell>
                      <TableCell className={cn(
                        "text-right tabular-nums text-sm",
                        adjTotal < 0 && "text-red-600",
                        adjTotal > 0 && "text-green-700"
                      )}>
                        {adjTotal !== 0 ? (adjTotal > 0 ? "+" : "") + fmtINR(adjTotal) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmtINR(r.calculatedPay)}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {r.presentDays}P / {r.lateDays}L / {r.absentDays}A
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Adjustment Dialog */}
      <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={adjType} onValueChange={(v) => setAdjType((v ?? adjType) as AdjustmentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJ_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input
                placeholder="e.g. Performance Bonus"
                value={adjLabel}
                onChange={(e) => setAdjLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
              />
              {adjType === "DEDUCTION" && (
                <p className="text-xs text-muted-foreground">Will be subtracted from total pay.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAdjustment} disabled={savingAdj || !adjLabel || !adjAmount}>
              {savingAdj ? "Saving…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
