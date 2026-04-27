"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Employee = { id: string; name: string | null; email: string | null; designation: string | null };

type HistoryEntry = {
  id: string;
  date: string;
  content: string;
  submittedAt: string;
  overrideReason: string | null;
  user: { name: string | null; email: string | null };
  submittedBy: { name: string | null } | null;
};

export function AdminLogsView() {
  const todayStr = new Date().toISOString().split("T")[0];

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [existingLog, setExistingLog] = useState<string>("");
  const [content, setContent] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch employees on mount
  useEffect(() => {
    fetch("/api/users/employees")
      .then((r) => r.json())
      .then(setEmployees)
      .catch(() => {});
  }, []);

  // Fetch admin-submitted log history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/logs/daily/admin-override");
      if (res.ok) setHistory(await res.json());
    } catch {}
    finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Fetch log for selected user + date
  useEffect(() => {
    if (!selectedUserId || !selectedDate) { setContent(""); setExistingLog(""); return; }
    fetch(`/api/logs/daily?date=${selectedDate}&userId=${selectedUserId}`)
      .then((r) => r.json())
      .then((data) => {
        const c = data?.content ?? "";
        setExistingLog(c);
        setContent(c);
      })
      .catch(() => { setContent(""); setExistingLog(""); });
  }, [selectedUserId, selectedDate]);

  async function handleSubmit() {
    if (!selectedUserId || !content.trim() || !overrideReason.trim()) return;
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/logs/daily/admin-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          date: selectedDate,
          content: content.trim(),
          overrideReason: overrideReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ ok: false, text: data.message ?? "Failed" }); return; }
      setMsg({ ok: true, text: "Log submitted successfully." });
      setOverrideReason("");
      fetchHistory();
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedEmployee = employees.find((e) => e.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit Log on Behalf of Employee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Employee</Label>
              <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee…" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name ?? e.email}
                      {e.designation ? ` — ${e.designation}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="admin-log-date">Date</Label>
              <Input
                id="admin-log-date"
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {existingLog && (
            <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
              A log already exists for this date — editing it will overwrite the current entry.
            </div>
          )}

          <div className="space-y-1">
            <Label>
              Log content
              {selectedEmployee && selectedDate && (
                <span className="ml-2 font-normal text-muted-foreground">
                  for {selectedEmployee.name ?? selectedEmployee.email} on {selectedDate}
                </span>
              )}
            </Label>
            <Textarea
              className="min-h-[140px] font-mono text-sm"
              placeholder="Enter the employee's work log…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!selectedUserId}
            />
          </div>

          <div className="space-y-1">
            <Label>
              Override reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              rows={2}
              placeholder="Required — explain why you are submitting on behalf of this employee"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </div>

          {msg && (
            <p className={`text-sm ${msg.ok ? "text-green-700" : "text-destructive"}`}>
              {msg.text}
            </p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedUserId || !content.trim() || !overrideReason.trim()}
          >
            {submitting ? "Submitting…" : "Submit on Behalf"}
          </Button>
        </CardContent>
      </Card>

      {/* Admin submission history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin Submission History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingHistory ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No admin-submitted logs yet.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.user.name ?? entry.user.email}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">{entry.submittedBy?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {entry.overrideReason ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(entry.submittedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
