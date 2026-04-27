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
import { ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { CalendarGrid, dateKey, eventDayKey, type CalendarEvent } from "./calendar-grid";

type Employee = { id: string; name: string | null; email: string | null };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const EMPTY_CREATE = {
  title: "", description: "", startTime: "09:00", endTime: "10:00", isCompanyWide: false,
};

type EditForm = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isCompanyWide: boolean;
  isPrivate: boolean;
};

const EMPTY_EDIT: EditForm = {
  title: "", description: "", startTime: "09:00", endTime: "10:00",
  isCompanyWide: false, isPrivate: false,
};

export function AdminCalendarView({ currentUserId }: { currentUserId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterUserId, setFilterUserId] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [addDate, setAddDate] = useState<Date | null>(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/employees").then((r) => r.json()).then(setEmployees).catch(() => {});
  }, []);

  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ month: monthParam });
      if (filterUserId) p.set("userId", filterUserId);
      const res = await fetch(`/api/calendar?${p}`);
      if (res.ok) setEvents(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [monthParam, filterUserId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  function openAdd(date: Date) {
    setAddDate(date);
    setSaveMsg(null);
    setCreateForm(EMPTY_CREATE);
  }

  function openEdit(event: CalendarEvent) {
    setSelected(event);
    setUpdateMsg(null);
    setEditForm({
      title: event.title,
      description: event.description ?? "",
      startTime: toTimeInput(event.startTime),
      endTime: toTimeInput(event.endTime),
      isCompanyWide: event.isCompanyWide,
      isPrivate: event.isPrivate,
    });
  }

  async function handleCreate() {
    if (!addDate || !createForm.title) return;
    setSaving(true); setSaveMsg(null);
    const dateStr = dateKey(addDate);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description || null,
          startTime: `${dateStr}T${createForm.startTime}:00`,
          endTime: `${dateStr}T${createForm.endTime}:00`,
          isCompanyWide: createForm.isCompanyWide,
          isPrivate: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg(data.message ?? "Failed"); return; }
      setEvents((prev) =>
        [...prev, data].sort((a, b) => a.startTime.localeCompare(b.startTime))
      );
      setAddDate(null);
    } catch { setSaveMsg("Network error."); }
    finally { setSaving(false); }
  }

  async function handleUpdate() {
    if (!selected) return;
    setUpdating(true); setUpdateMsg(null);
    const dateStr = eventDayKey(selected.startTime);
    try {
      const res = await fetch(`/api/calendar/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || null,
          startTime: `${dateStr}T${editForm.startTime}:00`,
          endTime: `${dateStr}T${editForm.endTime}:00`,
          isCompanyWide: editForm.isCompanyWide,
          isPrivate: editForm.isPrivate,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setUpdateMsg(data.message ?? "Failed"); return; }
      setEvents((prev) => prev.map((e) => (e.id === selected.id ? data : e)));
      setSelected(null);
    } catch { setUpdateMsg("Network error."); }
    finally { setUpdating(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await fetch(`/api/calendar/${selected.id}`, { method: "DELETE" });
      setEvents((prev) => prev.filter((e) => e.id !== selected.id));
      setSelected(null);
    } catch {}
    finally { setDeleting(false); }
  }

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Filter by employee</Label>
          <Select
            value={filterUserId || "_all"}
            onValueChange={(v) => setFilterUserId(v === "_all" ? "" : (v ?? ""))}
          >
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id} className="text-xs">
                  {e.name ?? e.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-semibold">
            {MONTH_NAMES[month]} {year}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button size="sm" className="ml-auto" onClick={() => openAdd(new Date(year, month, now.getDate()))}>
          Add Event
        </Button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          events={events}
          currentUserId={currentUserId}
          onDayClick={openAdd}
          onEventClick={openEdit}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-blue-200 bg-blue-100" />
          My events
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-green-200 bg-green-100" />
          Employee events
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-purple-200 bg-purple-100" />
          Company-wide
        </span>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={!!addDate} onOpenChange={(o) => !o && setAddDate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Add Event
              {addDate &&
                ` — ${addDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Event title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                rows={2}
                placeholder="Optional details…"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={createForm.startTime}
                  onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={createForm.endTime}
                  onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={createForm.isCompanyWide}
                onChange={(e) =>
                  setCreateForm({ ...createForm, isCompanyWide: e.target.checked })
                }
              />
              <span className="flex items-center gap-1 text-sm">
                <Globe className="h-3 w-3 text-purple-600" />
                Company-wide (visible to all employees)
              </span>
            </label>
            {saveMsg && <p className="text-sm text-destructive">{saveMsg}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDate(null)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !createForm.title}>
              {saving ? "Saving…" : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Delete Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Start</Label>
                  <Input
                    type="time"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>End</Label>
                  <Input
                    type="time"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={editForm.isCompanyWide}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isCompanyWide: e.target.checked })
                  }
                />
                <span className="flex items-center gap-1 text-sm">
                  <Globe className="h-3 w-3 text-purple-600" />
                  Company-wide event
                </span>
              </label>
              <p className="text-xs text-muted-foreground">
                {fmtTime(selected.startTime)} – {fmtTime(selected.endTime)} ·{" "}
                {selected.user.name ?? selected.user.email ?? "—"}
              </p>
              {updateMsg && <p className="text-sm text-destructive">{updateMsg}</p>}
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || updating}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              <Button
                onClick={handleUpdate}
                disabled={updating || deleting || !editForm.title}
              >
                {updating ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
