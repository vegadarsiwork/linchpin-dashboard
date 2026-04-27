"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FileText, Mail, ChevronDown, ChevronUp } from "lucide-react";

type Report = {
  id: string;
  date: string;
  content: string;
  generatedAt: string;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function contentToHtml(text: string): string {
  return text
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function AdminReportsView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [togglingEmail, setTogglingEmail] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchEmailSetting();
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) setReports(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

  async function fetchEmailSetting() {
    try {
      const res = await fetch("/api/settings?key=emailReportsEnabled");
      if (res.ok) {
        const data = await res.json();
        setEmailEnabled(data.value === "true");
      }
    } catch {}
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate-daily", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Report generation failed.");
        return;
      }
      toast.success("Report generated successfully.");
      await fetchReports();
      setExpandedId(data.id);
    } catch {
      toast.error("Network error.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleEmail(checked: boolean) {
    setTogglingEmail(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "emailReportsEnabled", value: checked ? "true" : "false" }),
      });
      setEmailEnabled(checked);
      toast.success(`Email reports ${checked ? "enabled" : "disabled"}.`);
    } catch {
      toast.error("Failed to update setting.");
    } finally { setTogglingEmail(false); }
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-md border bg-muted/30 px-4 py-3">
        <Button onClick={handleGenerate} disabled={generating} className="gap-2">
          <FileText className="h-4 w-4" />
          {generating ? "Generating…" : "Generate Today's Report"}
        </Button>

        <label
          className={cn(
            "flex cursor-pointer items-center gap-2 text-sm",
            togglingEmail && "opacity-60"
          )}
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={emailEnabled}
            disabled={togglingEmail}
            onChange={(e) => handleToggleEmail(e.target.checked)}
          />
          <Mail className="h-4 w-4 text-muted-foreground" />
          Auto-email report to admins
        </label>

        {emailEnabled && (
          <p className="text-xs text-muted-foreground">
            Requires <code className="rounded bg-muted px-1">RESEND_API_KEY</code> and{" "}
            <code className="rounded bg-muted px-1">RESEND_FROM_EMAIL</code> env vars.
          </p>
        )}
      </div>

      {/* Reports accordion */}
      <div className="space-y-2">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No reports yet. Generate the first one above.
          </p>
        ) : (
          reports.map((report) => {
            const isOpen = expandedId === report.id;
            return (
              <div key={report.id} className="overflow-hidden rounded-md border">
                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/30"
                  onClick={() => setExpandedId(isOpen ? null : report.id)}
                >
                  <div>
                    <p className="text-sm font-medium">{fmtDate(report.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      Generated {fmtDateTime(report.generatedAt)}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t px-6 py-5">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: contentToHtml(report.content) }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
