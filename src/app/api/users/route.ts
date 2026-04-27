import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import type { Role } from "@prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      role: true,
      baseMonthlySalary: true,
      joinDate: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ message: "email required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "A user with this email already exists." }, { status: 409 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const registrationLink = `${appUrl}/register?email=${encodeURIComponent(email)}`;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ message: "RESEND_API_KEY not configured." }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const companyName = process.env.COMPANY_NAME ?? "Linchpin";

  const { error } = await resend.emails.send({
    from: `${companyName} <${process.env.RESEND_FROM_EMAIL ?? "noreply@linchpinsoftsolution.com"}>`,
    to: [email],
    subject: `You're invited to ${companyName} Dashboard`,
    html: `
      <p>Hi,</p>
      <p>You've been invited to join the ${companyName} team dashboard.</p>
      <p>Click the link below to create your account:</p>
      <p><a href="${registrationLink}" style="color:#2563eb">${registrationLink}</a></p>
      <p>If you have any questions, contact your admin.</p>
    `,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Invitation sent." }, { status: 200 });
}
