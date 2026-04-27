import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSummary } from "@/lib/openrouter";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const logs = await prisma.dailyLog.findMany({
    where: { userId: user.id, date: { gte: monthStart, lte: monthEnd } },
    orderBy: { date: "asc" },
  });

  if (logs.length === 0) {
    return NextResponse.json(
      { message: "No daily logs found for the current month." },
      { status: 400 }
    );
  }

  const rawSummary = logs
    .map((l) => {
      const label = new Date(l.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      return `[${label}]\n${l.content}`;
    })
    .join("\n\n");

  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prompt = `The following are daily work logs for ${monthLabel}.\n\nPlease write a 3-5 sentence professional monthly work summary. Highlight major accomplishments, themes, and progress made during the month.\n\n${rawSummary}`;

  const aiSummary = await generateSummary(prompt);

  const monthLog = await prisma.monthlyLog.upsert({
    where: { userId_month: { userId: user.id, month: monthStart } },
    create: { userId: user.id, month: monthStart, rawSummary, aiSummary, generatedAt: new Date() },
    update: { rawSummary, aiSummary, generatedAt: new Date() },
  });

  return NextResponse.json(monthLog);
}
