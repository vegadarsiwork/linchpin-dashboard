"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Globe, Lock } from "lucide-react";
import { CalendarGrid, dateKey, eventDayKey, type CalendarEvent } from "./calendar-grid";

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

const EMPTY_FORM = {
  title: "", description: "", startTime: "09:00", endTime: "10:00", isPrivate: false,
};

export function EmployeeCalendarView({ currentUserId }: { currentUserId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [addDate, setAddDate] = useState<Date | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?month=${monthParam}`);
      if (res.ok) setEvents(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [monthParam]);

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
    setForm(EMPTY_FORM);
  }

  function openEdit(event: CalendarEvent) {
    setSelected(event);
    setUpdateMsg(null);
    setEditForm({
      title: event.title,
      description: event.description ?? "",
      startTime: toTimeInput(event.startTime),
      endTime: toTimeInput(event.endTime),
      isPrivate: event.isPrivate,
    });
  }

  async function handleCreate() {
    if (!addDate || !form.title) return;
    setSaving(true); setSaveMsg(null);
    const dateStr = dateKey(addDate);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          startTime: `${dateStr}T${form.startTime}:00`,
          endTime: `${dateStr}T${form.endTime}:00`,
          isPrivate: form.isPrivate,
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

  const isOwnEvent = selected?.userId === currentUserId;

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
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
        <Button size="sm" onClick={() => openAdd(new Date(year, month, now.getDate()))}>
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
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                rows={2}
                placeholder="Optional details…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={form.isPrivate}
                onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
              />
              <span className="flex items-center gap-1 text-sm">
                {form.isPrivate ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Globe className="h-3 w-3" />
                )}
                {form.isPrivate ? "Private (only you)" : "Visible to admin"}
              </span>
            </label>
            {saveMsg && <p className="text-sm text-destructive">{saveMsg}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDate(null)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title}>
              {saving ? "Saving…" : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / View Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isOwnEvent ? "Edit Event" : "Event Details"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-2">
              {selected.isCompanyWide && (
                <p className="rounded bg-purple-50 px-2 py-1 text-xs text-purple-700">
                  Company-wide event
                </p>
              )}
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  disabled={!isOwnEvent}
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  disabled={!isOwnEvent}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Start</Label>
                  <Input
                    type="time"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    disabled={!isOwnEvent}
                  />
                </div>
                <div className="space-y-1">
                  <Label>End</Label>
                  <Input
                    type="time"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    disabled={!isOwnEvent}
                  />
                </div>
              </div>
              {isOwnEvent && (
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={editForm.isPrivate}
                    onChange={(e) => setEditForm({ ...editForm, isPrivate: e.target.checked })}
                  />
                  <span className="flex items-center gap-1 text-sm">
                    {editForm.isPrivate ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Globe className="h-3 w-3" />
                    )}
                    {editForm.isPrivate ? "Private (only you)" : "Visible to admin"}
                  </span>
                </label>
              )}
              <p className="text-xs text-muted-foreground">
                {fmtTime(selected.startTime)} – {fmtTime(selected.endTime)}
                {!isOwnEvent &&
                  ` · ${selected.user.name ?? selected.user.email ?? "Admin"}`}
              </p>
              {updateMsg && <p className="text-sm text-destructive">{updateMsg}</p>}
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            {isOwnEvent && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || updating}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              {isOwnEvent && (
                <Button
                  onClick={handleUpdate}
                  disabled={updating || deleting || !editForm.title}
                >
                  {updating ? "Saving…" : "Save"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
