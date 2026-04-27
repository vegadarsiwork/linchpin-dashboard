import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSummary } from "@/lib/openrouter";

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const logs = await prisma.dailyLog.findMany({
    where: { userId: user.id, date: { gte: weekStart, lte: weekEnd } },
    orderBy: { date: "asc" },
  });

  if (logs.length === 0) {
    return NextResponse.json(
      { message: "No daily logs found for the current week." },
      { status: 400 }
    );
  }

  const rawSummary = logs
    .map((l) => {
      const label = new Date(l.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      return `[${label}]\n${l.content}`;
    })
    .join("\n\n");

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const prompt = `The following are daily work logs for the week of ${weekLabel}.\n\nPlease write a 3-5 sentence professional weekly work summary. Be concise and highlight key accomplishments and ongoing tasks.\n\n${rawSummary}`;

  const aiSummary = await generateSummary(prompt);

  const weekLog = await prisma.weeklyLog.upsert({
    where: { userId_weekStart: { userId: user.id, weekStart } },
    create: { userId: user.id, weekStart, rawSummary, aiSummary, generatedAt: new Date() },
    update: { rawSummary, aiSummary, generatedAt: new Date() },
  });

  return NextResponse.json(weekLog);
}
