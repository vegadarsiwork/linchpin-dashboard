"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

type LogEntry = {
  id: string;
  date: string;
  content: string;
  submittedAt: string;
  submittedByAdminId: string | null;
  overrideReason: string | null;
  submittedBy?: { name: string | null } | null;
};

type PeriodLog = {
  id: string;
  rawSummary: string;
  aiSummary: string | null;
  generatedAt: string;
};

interface Props {
  todayLog: LogEntry | null;
  weeklyLog: PeriodLog | null;
  monthlyLog: PeriodLog | null;
  todayStr: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MyLogsView({ todayLog: init, weeklyLog: initW, monthlyLog: initM, todayStr }: Props) {
  // Daily state
  const [todayLog, setTodayLog] = useState<LogEntry | null>(init);
  const [content, setContent] = useState(init?.content ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Past-log viewer
  const [viewDate, setViewDate] = useState("");
  const [pastLog, setPastLog] = useState<LogEntry | null>(null);
  const [fetching, setFetching] = useState(false);

  // Weekly / Monthly state
  const [weeklyLog, setWeeklyLog] = useState<PeriodLog | null>(initW);
  const [monthlyLog, setMonthlyLog] = useState<PeriodLog | null>(initM);
  const [generating, setGenerating] = useState<"weekly" | "monthly" | null>(null);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/logs/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ ok: false, text: data.message ?? "Failed to save" }); return; }
      setTodayLog(data);
      setMsg({ ok: true, text: "Log saved successfully." });
    } catch {
      setMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleViewDate(date: string) {
    setViewDate(date);
    if (!date || date === todayStr) { setPastLog(null); return; }
    setFetching(true);
    try {
      const res = await fetch(`/api/logs/daily?date=${date}`);
      setPastLog(res.ok ? await res.json() : null);
    } catch { setPastLog(null); }
    finally { setFetching(false); }
  }

  async function handleGenerate(period: "weekly" | "monthly") {
    setGenerating(period);
    setGenMsg(null);
    try {
      const res = await fetch(`/api/logs/generate-${period}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setGenMsg(data.message ?? "Failed to generate"); return; }
      if (period === "weekly") setWeeklyLog(data);
      else setMonthlyLog(data);
    } catch {
      setGenMsg("Network error. Please try again.");
    } finally {
      setGenerating(null);
    }
  }

  const showingPast = viewDate && viewDate !== todayStr;

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      {!todayLog && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          You haven&apos;t submitted your daily log yet today. Don&apos;t forget before end of day!
        </div>
      )}

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        {/* ── Daily Tab ───────────────────────────────────────────────────────── */}
        <TabsContent value="daily" className="space-y-6 pt-4">
          {/* Today's editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayLog?.submittedByAdminId && (
                <div className="rounded-md bg-purple-50 border border-purple-200 px-3 py-2 text-sm text-purple-800">
                  Submitted on your behalf by {todayLog.submittedBy?.name ?? "an admin"}
                  {todayLog.overrideReason && ` — "${todayLog.overrideReason}"`}
                </div>
              )}
              <Textarea
                placeholder="What did you work on today? Be specific — this feeds your weekly and monthly summaries."
                className="min-h-[160px] resize-none font-mono text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              {msg && (
                <p className={`text-sm ${msg.ok ? "text-green-700" : "text-destructive"}`}>
                  {msg.text}
                </p>
              )}
              <Button onClick={handleSubmit} disabled={submitting || !content.trim()}>
                {submitting ? "Saving…" : todayLog ? "Update Log" : "Submit Log"}
              </Button>
            </CardContent>
          </Card>

          {/* Past log viewer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">View Past Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="log-date" className="shrink-0 text-sm">Date</Label>
                <Input
                  id="log-date"
                  type="date"
                  max={todayStr}
                  value={viewDate}
                  onChange={(e) => handleViewDate(e.target.value)}
                  className="w-44"
                />
              </div>
              {showingPast && (
                fetching ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : pastLog ? (
                  <div className="space-y-2">
                    {pastLog.submittedByAdminId && (
                      <p className="text-xs text-purple-700">
                        Submitted by admin{pastLog.submittedBy?.name ? ` (${pastLog.submittedBy.name})` : ""}
                        {pastLog.overrideReason ? ` — "${pastLog.overrideReason}"` : ""}
                      </p>
                    )}
                    <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap font-mono">
                      {pastLog.content}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(pastLog.submittedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No log found for this date.</p>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Weekly Tab ──────────────────────────────────────────────────────── */}
        <TabsContent value="weekly" className="pt-4">
          <PeriodSummaryTab
            label="Weekly"
            periodLog={weeklyLog}
            generating={generating === "weekly"}
            genMsg={genMsg}
            onGenerate={() => handleGenerate("weekly")}
          />
        </TabsContent>

        {/* ── Monthly Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="monthly" className="pt-4">
          <PeriodSummaryTab
            label="Monthly"
            periodLog={monthlyLog}
            generating={generating === "monthly"}
            genMsg={genMsg}
            onGenerate={() => handleGenerate("monthly")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PeriodSummaryTab({
  label,
  periodLog,
  generating,
  genMsg,
  onGenerate,
}: {
  label: string;
  periodLog: PeriodLog | null;
  generating: boolean;
  genMsg: string | null;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {periodLog
            ? `Last generated ${new Date(periodLog.generatedAt).toLocaleString()}`
            : `No ${label.toLowerCase()} summary generated yet.`}
        </p>
        <Button size="sm" onClick={onGenerate} disabled={generating}>
          {generating ? "Generating…" : `Generate ${label} Summary`}
        </Button>
      </div>
      {genMsg && <p className="text-sm text-destructive">{genMsg}</p>}

      {periodLog && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Raw Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto rounded-md border bg-muted/40 p-3 text-xs font-mono whitespace-pre-wrap">
                {periodLog.rawSummary}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {periodLog.aiSummary ? (
                <p className="text-sm leading-relaxed">{periodLog.aiSummary}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No AI summary yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
