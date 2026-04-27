import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSummary } from "@/lib/openrouter";

async function buildAndSaveReport() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });

  const [attendance, logs, targets] = await Promise.all([
    prisma.attendance.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.dailyLog.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.target.findMany({
      where: { dueDate: { gte: today, lt: tomorrow } },
      include: { assignedTo: { select: { name: true, email: true } } },
    }),
  ]);

  const name = (u: { name: string | null; email: string | null }) =>
    u.name ?? u.email ?? "Unknown";

  const present = attendance.filter((a) => a.status === "PRESENT");
  const late = attendance.filter((a) => a.status === "LATE");
  const absent = attendance.filter((a) => a.status === "ABSENT");

  const lines: string[] = [
    `DATE: ${dateLabel}`,
    "",
    "ATTENDANCE:",
    `  Present (${present.length}): ${present.map((a) => name(a.user)).join(", ") || "None"}`,
    `  Late    (${late.length}): ${late.map((a) => name(a.user)).join(", ") || "None"}`,
    `  Absent  (${absent.length}): ${absent.map((a) => name(a.user)).join(", ") || "None"}`,
    "",
    `DAILY LOGS (${logs.length} submitted):`,
  ];

  for (const log of logs) {
    lines.push("", `[${name(log.user)}]:`, log.content);
  }
  if (logs.length === 0) lines.push("  No logs submitted today.");

  lines.push("", `TARGETS DUE TODAY (${targets.length}):`);
  for (const t of targets) {
    lines.push(`  - [${t.status}] "${t.title}" — ${name(t.assignedTo)}`);
  }
  if (targets.length === 0) lines.push("  No targets due today.");

  const dataBlock = lines.join("\n");

  const prompt = `You are a professional team productivity assistant for a company called Linchpin.

Based on the following workplace data for ${dateLabel}, write a concise professional daily team report (4–6 paragraphs). Cover: (1) attendance summary, (2) work accomplished based on daily logs, (3) target progress. Be factual and structured. Begin with a one-sentence executive summary.

WORKPLACE DATA:
${dataBlock}`;

  const content = await generateSummary(prompt);

  const report = await prisma.dailyReport.upsert({
    where: { date: today },
    update: { content, generatedAt: new Date() },
    create: { date: today, content },
  });

  // Send email if enabled
  const setting = await prisma.setting.findUnique({ where: { key: "emailReportsEnabled" } });
  if (setting?.value === "true" && process.env.RESEND_API_KEY) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", email: { not: null } },
        select: { email: true },
      });
      const toList = admins.map((a) => a.email!).filter(Boolean);
      if (toList.length > 0) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const htmlContent = content
          .split("\n\n")
          .map((p) => `<p style="margin:0 0 12px;">${p.replace(/\n/g, "<br />")}</p>`)
          .join("");
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "Linchpin Reports <noreply@linchpin.app>",
          to: toList,
          subject: `Daily Team Report — ${dateLabel}`,
          text: content,
          html: `<div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:24px;">
            <h2 style="margin:0 0 4px;color:#111;">Daily Team Report</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:13px;">${dateLabel}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />
            <div style="line-height:1.7;color:#374151;font-size:14px;">${htmlContent}</div>
          </div>`,
        });
      }
    } catch {
      // Email failure is non-fatal
    }
  }

  return report;
}

// GET — Vercel cron invocation (requires CRON_SECRET)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await buildAndSaveReport();
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}

// POST — admin manual trigger
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await buildAndSaveReport();
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}
