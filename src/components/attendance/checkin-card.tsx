"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@prisma/client";

export type AttendanceRecord = {
  id: string;
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  payMultiplier: number;
  dailyLogSubmitted: boolean;
  overrideReason: string | null;
  overriddenByAdminId: string | null;
};

const statusStyle: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-100 text-green-800",
  LATE: "bg-yellow-100 text-yellow-800",
  ABSENT: "bg-red-100 text-red-800",
  HOLIDAY: "bg-blue-100 text-blue-800",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CheckinCard({ initialRecord }: { initialRecord: AttendanceRecord | null }) {
  const [record, setRecord] = useState<AttendanceRecord | null>(initialRecord);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callApi(url: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Something went wrong.");
        return;
      }
      setRecord(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canCheckIn = !record;
  const canCheckOut = !!record && !record.checkOutTime;
  const done = !!record?.checkOutTime;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {record ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusStyle[record.status]
                )}
              >
                {record.status}
              </span>
              {record.overriddenByAdminId && (
                <span
                  className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 cursor-help"
                  title={`Admin override: ${record.overrideReason}`}
                >
                  Edited by Admin
                </span>
              )}
            </div>
            {record.checkInTime && (
              <p className="text-sm text-muted-foreground">
                Checked in at {fmt(record.checkInTime)}
              </p>
            )}
            {record.checkOutTime && (
              <p className="text-sm text-muted-foreground">
                Checked out at {fmt(record.checkOutTime)}
              </p>
            )}
            {record.payMultiplier !== 1.0 && (
              <p className="text-sm text-muted-foreground">
                Pay multiplier: {record.payMultiplier}×
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You haven&apos;t checked in yet.</p>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {canCheckIn && (
            <Button onClick={() => callApi("/api/attendance/checkin")} disabled={loading}>
              {loading ? "Checking in…" : "Check In"}
            </Button>
          )}
          {canCheckOut && (
            <Button
              variant="outline"
              onClick={() => callApi("/api/attendance/checkout")}
              disabled={loading}
            >
              {loading ? "Checking out…" : "Check Out"}
            </Button>
          )}
          {done && (
            <p className="text-sm text-muted-foreground self-center">
              Day complete. See you tomorrow!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
