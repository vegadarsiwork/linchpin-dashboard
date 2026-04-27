"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@prisma/client";

type AttRow = {
  user: { id: string; name: string | null; email: string | null; designation: string | null };
  attendance: {
    id: string;
    status: AttendanceStatus;
    checkInTime: string | null;
    checkOutTime: string | null;
    payMultiplier: number;
    dailyLogSubmitted: boolean;
    overrideReason: string | null;
    overriddenBy: { name: string | null } | null;
    markedAt: string;
  } | null;
};

const statusColors: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-100 text-green-800",
  LATE: "bg-yellow-100 text-yellow-800",
  ABSENT: "bg-red-100 text-red-800",
  HOLIDAY: "bg-blue-100 text-blue-800",
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function toDateTimeLocal(date: string, time: string): string {
  return `${date}T${time}:00`;
}

type MarkDialog = { userId: string; userName: string };
type PayDialog = { attendanceId: string; current: number };
type LogDialog = { attendanceId: string; userName: string };

export function AttendanceAdminView({ adminName }: { adminName: string }) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [rows, setRows] = useState<AttRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [markDlg, setMarkDlg] = useState<MarkDialog | null>(null);
  const [payDlg, setPayDlg] = useState<PayDialog | null>(null);
  const [logDlg, setLogDlg] = useState<LogDialog | null>(null);
  const [holidayDlg, setHolidayDlg] = useState(false);

  // Form fields — mark attendance
  const [markStatus, setMarkStatus] = useState<AttendanceStatus>("PRESENT");
  const [markCheckIn, setMarkCheckIn] = useState("09:00");
  const [markCheckOut, setMarkCheckOut] = useState("");
  const [markMultiplier, setMarkMultiplier] = useState("1");
  const [markReason, setMarkReason] = useState("");

  // Form fields — pay override
  const [payMultiplier, setPayMultiplier] = useState("1");
  const [payReason, setPayReason] = useState("");

  // Form fields — log override
  const [logReason, setLogReason] = useState("");

  // Form fields — holiday
  const [holidayReason, setHolidayReason] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendance/admin?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      setRows(await res.json());
    } catch {
      setError("Could not load attendance data.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  async function post(url: string, body: object) {
    setSubmitting(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error");
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function patch(url: string, body: object) {
    setSubmitting(true);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error");
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkAttendance() {
    if (!markDlg || !markReason.trim()) return;
    const ok = await post("/api/attendance/admin-override", {
      userId: markDlg.userId,
      date: selectedDate,
      status: markStatus,
      checkInTime: markCheckIn ? toDateTimeLocal(selectedDate, markCheckIn) : null,
      checkOutTime: markCheckOut ? toDateTimeLocal(selectedDate, markCheckOut) : null,
      payMultiplier: parseFloat(markMultiplier),
      overrideReason: markReason.trim(),
    });
    if (ok) { setMarkDlg(null); setMarkReason(""); fetchRows(); }
  }

  async function handlePayOverride() {
    if (!payDlg || !payReason.trim()) return;
    const ok = await patch(`/api/attendance/${payDlg.attendanceId}/pay-override`, {
      payMultiplier: parseFloat(payMultiplier),
      overrideReason: payReason.trim(),
    });
    if (ok) { setPayDlg(null); setPayReason(""); fetchRows(); }
  }

  async function handleLogOverride() {
    if (!logDlg || !logReason.trim()) return;
    const ok = await patch(`/api/attendance/${logDlg.attendanceId}/log-override`, {
      overrideReason: logReason.trim(),
    });
    if (ok) { setLogDlg(null); setLogReason(""); fetchRows(); }
  }

  async function handleHoliday() {
    if (!holidayReason.trim()) return;
    const ok = await post("/api/attendance/mark-holiday", {
      date: selectedDate,
      overrideReason: holidayReason.trim(),
    });
    if (ok) { setHolidayDlg(false); setHolidayReason(""); fetchRows(); }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="date-filter" className="shrink-0 text-sm">Date</Label>
          <Input
            id="date-filter"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setHolidayReason(""); setHolidayDlg(true); }}
        >
          Mark as Holiday
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {rows.length} employee{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Pay</TableHead>
              <TableHead>Log</TableHead>
              <TableHead>Override Info</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({ user, attendance: att }) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name ?? "—"}</p>
                      {user.designation && (
                        <p className="text-xs text-muted-foreground">{user.designation}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {att ? (
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        statusColors[att.status]
                      )}>
                        {att.status}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not marked</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{fmtTime(att?.checkInTime ?? null)}</TableCell>
                  <TableCell className="text-sm">{fmtTime(att?.checkOutTime ?? null)}</TableCell>
                  <TableCell className="text-sm">{att ? `${att.payMultiplier}×` : "—"}</TableCell>
                  <TableCell>
                    {att?.dailyLogSubmitted ? (
                      <Badge variant="secondary" className="text-xs">Submitted</Badge>
                    ) : att ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => { setLogReason(""); setLogDlg({ attendanceId: att.id, userName: user.name ?? user.email ?? "" }); }}
                      >
                        Mark Done
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[140px]">
                    {att?.overriddenBy?.name && (
                      <span title={att.overrideReason ?? ""} className="cursor-help">
                        By {att.overriddenBy.name}
                        <br />
                        {new Date(att.markedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setMarkStatus(att?.status ?? "PRESENT");
                          setMarkCheckIn("09:00");
                          setMarkCheckOut("");
                          setMarkMultiplier(String(att?.payMultiplier ?? 1));
                          setMarkReason("");
                          setMarkDlg({ userId: user.id, userName: user.name ?? user.email ?? "" });
                        }}
                      >
                        Mark
                      </Button>
                      {att && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setPayMultiplier(String(att.payMultiplier));
                            setPayReason("");
                            setPayDlg({ attendanceId: att.id, current: att.payMultiplier });
                          }}
                        >
                          Pay
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mark Attendance Dialog */}
      <Dialog open={!!markDlg} onOpenChange={(o) => !o && setMarkDlg(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark Attendance — {markDlg?.userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={markStatus} onValueChange={(v) => setMarkStatus(v as AttendanceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["PRESENT","LATE","ABSENT","HOLIDAY"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Check-in time</Label>
                <Input type="time" value={markCheckIn} onChange={(e) => setMarkCheckIn(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Check-out time</Label>
                <Input type="time" value={markCheckOut} onChange={(e) => setMarkCheckOut(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Pay multiplier</Label>
              <Input type="number" step="0.1" min="0" max="2" value={markMultiplier} onChange={(e) => setMarkMultiplier(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Override reason <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Required — explain why this override is needed"
                value={markReason}
                onChange={(e) => setMarkReason(e.target.value)}
                rows={2}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Overriding as {adminName} · {new Date().toLocaleString()}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkDlg(null)}>Cancel</Button>
            <Button onClick={handleMarkAttendance} disabled={submitting || !markReason.trim()}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Override Dialog */}
      <Dialog open={!!payDlg} onOpenChange={(o) => !o && setPayDlg(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Edit Pay Multiplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Pay multiplier</Label>
              <Input type="number" step="0.1" min="0" max="2" value={payMultiplier} onChange={(e) => setPayMultiplier(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea rows={2} value={payReason} onChange={(e) => setPayReason(e.target.value)} placeholder="e.g. Offsite work approved" />
            </div>
            <p className="text-xs text-muted-foreground">Overriding as {adminName}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDlg(null)}>Cancel</Button>
            <Button onClick={handlePayOverride} disabled={submitting || !payReason.trim()}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Override Dialog */}
      <Dialog open={!!logDlg} onOpenChange={(o) => !o && setLogDlg(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Mark Log Submitted — {logDlg?.userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">This will mark the daily log as submitted on behalf of this employee.</p>
            <div className="space-y-1">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea rows={2} value={logReason} onChange={(e) => setLogReason(e.target.value)} placeholder="e.g. Employee submitted via WhatsApp" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDlg(null)}>Cancel</Button>
            <Button onClick={handleLogOverride} disabled={submitting || !logReason.trim()}>
              {submitting ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Holiday Dialog */}
      <Dialog open={holidayDlg} onOpenChange={setHolidayDlg}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Mark {selectedDate} as Holiday</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              This will set HOLIDAY status for <strong>all employees</strong> on this date, overwriting existing records.
            </p>
            <div className="space-y-1">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea rows={2} value={holidayReason} onChange={(e) => setHolidayReason(e.target.value)} placeholder="e.g. Republic Day" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHolidayDlg(false)}>Cancel</Button>
            <Button onClick={handleHoliday} disabled={submitting || !holidayReason.trim()}>
              {submitting ? "Marking…" : "Mark Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
