"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type OverrideEntry = {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  actionType: "Attendance Edit" | "Log Submitted" | "Pay Adjustment";
  employeeName: string;
  employeeEmail: string;
  details: string;
  reason: string | null;
};

type Employee = { id: string; name: string | null; email: string | null };

const ACTION_TYPES = ["Attendance Edit", "Log Submitted", "Pay Adjustment"] as const;

const TYPE_STYLE: Record<string, string> = {
  "Attendance Edit": "bg-amber-100 text-amber-800",
  "Log Submitted": "bg-blue-100 text-blue-800",
  "Pay Adjustment": "bg-purple-100 text-purple-800",
};

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export function OverrideLogView({ employees }: { employees: Employee[] }) {
  const [entries, setEntries] = useState<OverrideEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [employeeId, setEmployeeId] = useState("all");
  const [actionType, setActionType] = useState("all");

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (employeeId !== "all") params.set("employeeId", employeeId);
      if (actionType !== "all") params.set("actionType", actionType);

      const res = await fetch(`/api/override-log?${params.toString()}`);
      if (res.ok) setEntries(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [from, to, employeeId, actionType]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 px-4 py-3">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 w-36 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 w-36 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Employee</Label>
          <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "all")}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name ?? e.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Action Type</Label>
          <Select value={actionType} onValueChange={(v) => setActionType(v ?? "all")}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setFrom("");
            setTo("");
            setEmployeeId("all");
            setActionType("all");
          }}
        >
          Clear
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Timestamp</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No override records found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {fmtTs(e.timestamp)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{e.adminName}</p>
                    <p className="text-xs text-muted-foreground">{e.adminEmail}</p>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                      TYPE_STYLE[e.actionType]
                    )}>
                      {e.actionType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{e.employeeName}</p>
                    <p className="text-xs text-muted-foreground">{e.employeeEmail}</p>
                  </TableCell>
                  <TableCell className="max-w-xs text-xs text-muted-foreground">
                    {e.details}
                  </TableCell>
                  <TableCell className="max-w-[160px] text-xs text-muted-foreground italic">
                    {e.reason ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && entries.length > 0 && (
        <p className="text-xs text-muted-foreground">{entries.length} record{entries.length !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}
