"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Priority, TargetStatus, Timeframe } from "@prisma/client";

type Employee = { id: string; name: string | null; email: string | null };

type Target = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  timeframe: Timeframe;
  dueDate: string | null;
  status: TargetStatus;
  assignedBy: { name: string | null };
  assignedTo: { name: string | null; email: string | null };
};

const priorityStyle: Record<Priority, string> = {
  HIGH: "bg-red-100 text-red-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

const PRIORITIES: Priority[] = ["HIGH", "MEDIUM", "LOW"];
const STATUSES: TargetStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"];
const TIMEFRAMES: Timeframe[] = ["DAILY", "WEEKLY", "MONTHLY"];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(t: Target): boolean {
  return t.status !== "COMPLETED" && !!t.dueDate && new Date(t.dueDate) < new Date();
}

function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

const EMPTY_FORM = {
  assignedToId: "", title: "", description: "",
  priority: "MEDIUM" as Priority, timeframe: "WEEKLY" as Timeframe, dueDate: "",
};

export function AdminTargetsView() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterUser, setFilterUser] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTimeframe, setFilterTimeframe] = useState("");

  const [createDlg, setCreateDlg] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/employees").then((r) => r.json()).then(setEmployees).catch(() => {});
  }, []);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filterUser) p.set("userId", filterUser);
    if (filterPriority) p.set("priority", filterPriority);
    if (filterStatus) p.set("status", filterStatus);
    if (filterTimeframe) p.set("timeframe", filterTimeframe);
    try {
      const res = await fetch(`/api/targets?${p}`);
      if (res.ok) setTargets(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [filterUser, filterPriority, filterStatus, filterTimeframe]);

  useEffect(() => { fetchTargets(); }, [fetchTargets]);

  async function handleCreate() {
    if (!form.assignedToId || !form.title) return;
    setCreating(true); setCreateMsg(null);
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dueDate: form.dueDate || null, description: form.description || null }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateMsg(data.message ?? "Failed"); return; }
      setCreateDlg(false);
      setForm(EMPTY_FORM);
      fetchTargets();
    } catch { setCreateMsg("Network error."); }
    finally { setCreating(false); }
  }

  async function handleStatusChange(id: string, status: TargetStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/targets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTargets((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
    } catch {}
    finally { setUpdatingId(null); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/targets/${deleteId}`, { method: "DELETE" });
      setTargets((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
    } catch {}
    finally { setDeleting(false); }
  }

  function FilterSelect({
    label, value, onChange, options, placeholder,
  }: {
    label: string; value: string; onChange: (v: string) => void;
    options: string[]; placeholder?: string;
  }) {
    return (
      <div className="space-y-1">
        <Label className="text-xs">{label}</Label>
        <Select value={value || "_all"} onValueChange={(v) => onChange((v === "_all" ? "" : (v ?? "")))} >
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder={placeholder ?? "All"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All</SelectItem>
            {options.map((o) => <SelectItem key={o} value={o} className="text-xs">{o.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Employee</Label>
          <Select value={filterUser || "_all"} onValueChange={(v) => setFilterUser(v === "_all" ? "" : (v ?? ""))}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id} className="text-xs">{e.name ?? e.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FilterSelect label="Priority" value={filterPriority} onChange={setFilterPriority} options={PRIORITIES} />
        <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={STATUSES} />
        <FilterSelect label="Timeframe" value={filterTimeframe} onChange={setFilterTimeframe} options={TIMEFRAMES} />

        <Button size="sm" className="ml-auto" onClick={() => { setCreateMsg(null); setForm(EMPTY_FORM); setCreateDlg(true); }}>
          Assign New Target
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Timeframe</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : targets.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No targets found.</TableCell></TableRow>
            ) : targets.map((t) => (
              <TableRow key={t.id} className={isOverdue(t) ? "bg-destructive/5" : ""}>
                <TableCell className="text-sm font-medium whitespace-nowrap">
                  {t.assignedTo.name ?? t.assignedTo.email}
                </TableCell>
                <TableCell className="max-w-[180px]">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  {t.description && <p className="truncate text-xs text-muted-foreground">{t.description}</p>}
                </TableCell>
                <TableCell>
                  <Chip className={priorityStyle[t.priority]}>{t.priority}</Chip>
                </TableCell>
                <TableCell className="text-xs">{t.timeframe}</TableCell>
                <TableCell className={cn("text-xs whitespace-nowrap", isOverdue(t) ? "font-medium text-destructive" : "text-muted-foreground")}>
                  {t.dueDate ? fmtDate(t.dueDate) : "—"}
                </TableCell>
                <TableCell>
                  <Select
                    value={t.status}
                    onValueChange={(v) => handleStatusChange(t.id, (v ?? t.status) as TargetStatus)}
                    disabled={updatingId === t.id}
                  >
                    <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost" size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteId(t.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDlg} onOpenChange={(o) => !o && setCreateDlg(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign New Target</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Employee <span className="text-destructive">*</span></Label>
              <Select value={form.assignedToId} onValueChange={(v) => setForm({ ...form, assignedToId: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="Select employee…" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name ?? e.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Complete onboarding documentation" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={2} placeholder="Optional details…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: (v ?? "MEDIUM") as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Timeframe</Label>
                <Select value={form.timeframe} onValueChange={(v) => setForm({ ...form, timeframe: (v ?? "WEEKLY") as Timeframe })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEFRAMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            {createMsg && <p className="text-sm text-destructive">{createMsg}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDlg(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !form.assignedToId || !form.title}>
              {creating ? "Assigning…" : "Assign Target"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Delete target?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
