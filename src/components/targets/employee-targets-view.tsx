"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Priority, TargetStatus, Timeframe } from "@prisma/client";

type Target = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  timeframe: Timeframe;
  dueDate: string | null;
  status: TargetStatus;
  assignedBy: { name: string | null; email: string | null };
};

const priorityStyle: Record<Priority, string> = {
  HIGH: "bg-red-100 text-red-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

const timeframeStyle: Record<Timeframe, string> = {
  DAILY: "bg-blue-100 text-blue-800",
  WEEKLY: "bg-purple-100 text-purple-800",
  MONTHLY: "bg-indigo-100 text-indigo-800",
};

const statusStyle: Record<TargetStatus, string> = {
  PENDING: "bg-zinc-100 text-zinc-700",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
};

function isOverdue(t: Target): boolean {
  return t.status !== "COMPLETED" && !!t.dueDate && new Date(t.dueDate) < new Date();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

function TargetCard({ target, onClick }: { target: Target; onClick?: () => void }) {
  const overdue = isOverdue(target);
  const done = target.status === "COMPLETED";

  return (
    <Card
      className={cn(
        "transition-shadow",
        !done && "cursor-pointer hover:shadow-md",
        overdue && "border-destructive"
      )}
      onClick={!done ? onClick : undefined}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium leading-snug">{target.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {target.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{target.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Chip className={priorityStyle[target.priority]}>{target.priority}</Chip>
          <Chip className={timeframeStyle[target.timeframe]}>{target.timeframe}</Chip>
          <Chip className={statusStyle[target.status]}>{target.status.replace("_", " ")}</Chip>
        </div>
        {target.dueDate && (
          <p className={cn("text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
            Due {fmtDate(target.dueDate)}{overdue ? " — Overdue" : ""}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          From {target.assignedBy.name ?? target.assignedBy.email ?? "Admin"}
        </p>
      </CardContent>
    </Card>
  );
}

function TabGrid({
  items,
  loading,
  onSelect,
  emptyMsg,
}: {
  items: Target[];
  loading: boolean;
  onSelect: (t: Target) => void;
  emptyMsg: string;
}) {
  if (loading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  if (items.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">{emptyMsg}</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <TargetCard key={t.id} target={t} onClick={() => onSelect(t)} />
      ))}
    </div>
  );
}

export function EmployeeTargetsView() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Target | null>(null);
  const [newStatus, setNewStatus] = useState<"IN_PROGRESS" | "COMPLETED">("IN_PROGRESS");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/targets");
      if (res.ok) setTargets(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTargets(); }, [fetchTargets]);

  function openDialog(target: Target) {
    setSelected(target);
    setUpdateMsg(null);
    const defaultStatus =
      target.status === "IN_PROGRESS" ? "COMPLETED" : "IN_PROGRESS";
    setNewStatus(defaultStatus);
  }

  async function handleUpdate() {
    if (!selected) return;
    setUpdating(true);
    setUpdateMsg(null);
    try {
      const res = await fetch(`/api/targets/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { setUpdateMsg("Update failed."); return; }
      const updated = await res.json();
      setTargets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelected(null);
    } catch { setUpdateMsg("Network error."); }
    finally { setUpdating(false); }
  }

  const pending = targets.filter((t) => t.status === "PENDING" || t.status === "OVERDUE");
  const inProgress = targets.filter((t) => t.status === "IN_PROGRESS");
  const completed = targets.filter((t) => t.status === "COMPLETED");

  function count(n: number) {
    return n > 0 ? (
      <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs tabular-nums">{n}</span>
    ) : null;
  }

  return (
    <>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending{count(pending.length)}</TabsTrigger>
          <TabsTrigger value="inprogress">In Progress{count(inProgress.length)}</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="pt-4">
          <TabGrid items={pending} loading={loading} onSelect={openDialog} emptyMsg="No pending targets." />
        </TabsContent>
        <TabsContent value="inprogress" className="pt-4">
          <TabGrid items={inProgress} loading={loading} onSelect={openDialog} emptyMsg="Nothing in progress." />
        </TabsContent>
        <TabsContent value="completed" className="pt-4">
          <TabGrid items={completed} loading={loading} onSelect={() => {}} emptyMsg="No completed targets yet." />
        </TabsContent>
      </Tabs>

      {/* Status Update Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Target Status</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-2">
              <p className="font-medium text-sm">{selected.title}</p>
              <p className="text-xs text-muted-foreground">
                Current status: <span className="font-medium">{selected.status.replace("_", " ")}</span>
              </p>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus((v ?? newStatus) as typeof newStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(selected.status === "PENDING" || selected.status === "OVERDUE") && (
                    <SelectItem value="IN_PROGRESS">Mark In Progress</SelectItem>
                  )}
                  <SelectItem value="COMPLETED">Mark Completed</SelectItem>
                </SelectContent>
              </Select>
              {updateMsg && <p className="text-sm text-destructive">{updateMsg}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? "Updating…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
