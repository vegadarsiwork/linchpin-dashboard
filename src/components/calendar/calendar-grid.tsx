"use client";

import { cn } from "@/lib/utils";

export type CalendarEvent = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  isPrivate: boolean;
  isCompanyWide: boolean;
  user: { name: string | null; email: string | null };
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function eventDayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function buildDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

export function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = eventDayKey(ev.startTime);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return map;
}

function chipColor(event: CalendarEvent, currentUserId: string): string {
  if (event.isCompanyWide) return "bg-purple-100 text-purple-800 border-purple-200";
  if (event.userId === currentUserId) return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-green-100 text-green-800 border-green-200";
}

export function CalendarGrid({
  year,
  month,
  events,
  currentUserId,
  onDayClick,
  onEventClick,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  currentUserId: string;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const days = buildDays(year, month);
  const byDay = groupByDay(events);
  const todayKey = dateKey(new Date());

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`pad-${i}`}
                className={cn("min-h-[90px] border-b bg-muted/20", i % 7 !== 6 && "border-r")}
              />
            );
          }
          const key = dateKey(day);
          const isToday = key === todayKey;
          const dayEvents = byDay.get(key) ?? [];
          const visible = dayEvents.slice(0, 2);
          const overflow = dayEvents.length - 2;

          return (
            <div
              key={key}
              className={cn(
                "min-h-[90px] cursor-pointer border-b p-1 transition-colors hover:bg-accent/30",
                i % 7 !== 6 && "border-r"
              )}
              onClick={() => onDayClick(day)}
            >
              <div
                className={cn(
                  "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {visible.map((ev) => (
                  <button
                    key={ev.id}
                    className={cn(
                      "w-full truncate rounded border px-1 py-0.5 text-left text-[11px] leading-tight",
                      chipColor(ev, currentUserId)
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                  >
                    {ev.title}
                  </button>
                ))}
                {overflow > 0 && (
                  <p className="pl-1 text-[11px] text-muted-foreground">+{overflow} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
