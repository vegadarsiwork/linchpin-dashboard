"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Clock,
  Target,
  Calendar,
  Users,
  BarChart3,
  Receipt,
  Wallet,
  DollarSign,
  UserCog,
  LogOut,
  Shield,
} from "lucide-react";

interface ShellUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
}

const commonLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/my-logs", label: "My Logs", icon: FileText },
  { href: "/dashboard/attendance", label: "Attendance", icon: Clock },
  { href: "/dashboard/targets", label: "Targets", icon: Target },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/pay", label: "My Pay", icon: Wallet },
];

const adminLinks = [
  { href: "/dashboard/admin/calendar", label: "Team Calendar", icon: Calendar },
  { href: "/dashboard/team", label: "Team Overview", icon: Users },
  { href: "/dashboard/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/admin/pay", label: "Pay Records", icon: DollarSign },
  { href: "/dashboard/admin/users", label: "Manage Users", icon: UserCog },
  { href: "/dashboard/admin/override-log", label: "Override Log", icon: Shield },
];

const employeeMobileNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/attendance", icon: Clock, label: "Attendance" },
  { href: "/dashboard/my-logs", icon: FileText, label: "Logs" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
  { href: "/dashboard/pay", icon: Wallet, label: "Pay" },
];

const adminMobileNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/team", icon: Users, label: "Team" },
  { href: "/dashboard/admin/pay", icon: DollarSign, label: "Pay" },
  { href: "/dashboard/admin/invoices", icon: Receipt, label: "Invoices" },
  { href: "/dashboard/admin/reports", icon: BarChart3, label: "Reports" },
];

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
}) {
  const isActive =
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-5">
        <span className="text-lg font-bold tracking-tight">Linchpin</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {commonLinks.map((link) => (
          <NavLink key={link.href} {...link} pathname={pathname} />
        ))}

        {isAdmin && (
          <>
            <div className="px-3 pb-1 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Admin
              </p>
            </div>
            {adminLinks.map((link) => (
              <NavLink key={link.href} {...link} pathname={pathname} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback className="text-xs">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-none">
              {user.name ?? "User"}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

function BottomNav({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";
  const links = isAdmin ? adminMobileNav : employeeMobileNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-background md:hidden">
      {links.map(({ href, icon: Icon, label }) => {
        const isActive =
          href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [_sidebarOpen, _setSidebarOpen] = useState(false);

  useEffect(() => {
    _setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col">
        <Sidebar user={user} />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar (brand only, no hamburger) */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-background px-4 md:hidden">
          <span className="text-base font-bold">Linchpin</span>
        </header>

        {/* Scrollable content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 pb-20 md:p-6 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav user={user} />
    </div>
  );
}
