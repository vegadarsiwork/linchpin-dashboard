"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { UserPlus, Pencil, UserX, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  designation: string | null;
  role: Role;
  baseMonthlySalary: number | null;
  isActive: boolean;
  createdAt: string;
};

const ROLES: Role[] = ["ADMIN", "EMPLOYEE", "INTERN"];

function fmtINR(n: number | null) {
  if (n == null) return "—";
  return "₹" + n.toLocaleString("en-IN");
}

export function AdminUsersView() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editRole, setEditRole] = useState<Role>("EMPLOYEE");
  const [saving, setSaving] = useState(false);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function openEdit(u: UserRow) {
    setEditUser(u);
    setEditName(u.name ?? "");
    setEditDesignation(u.designation ?? "");
    setEditSalary(u.baseMonthlySalary != null ? String(u.baseMonthlySalary) : "");
    setEditRole(u.role);
  }

  async function handleSave() {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName || null,
          designation: editDesignation || null,
          baseMonthlySalary: editSalary ? Number(editSalary) : null,
          role: editRole,
        }),
      });
      if (res.ok) {
        const updated: UserRow = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
        setEditUser(null);
        toast.success(`${updated.name ?? updated.email} updated.`);
      } else {
        const err = await res.json();
        toast.error(err.message ?? "Save failed.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(u: UserRow) {
    const next = !u.isActive;
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((row) => (row.id === u.id ? { ...row, isActive: next } : row)));
        toast.success(`${u.name ?? u.email} ${next ? "reactivated" : "deactivated"}.`);
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("Network error.");
    }
  }

  async function handleInvite() {
    if (!inviteEmail) return;
    setSendingInvite(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Invitation sent to ${inviteEmail}.`);
        setInviteOpen(false);
        setInviteEmail("");
      } else {
        toast.error(data.message ?? "Failed to send invite.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSendingInvite(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Base Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className={cn(!u.isActive && "opacity-50")}>
                  <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-sm">{u.designation ?? "—"}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      u.role === "ADMIN" ? "bg-purple-100 text-purple-800" :
                      u.role === "INTERN" ? "bg-amber-100 text-amber-800" :
                      "bg-blue-100 text-blue-800"
                    )}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {fmtINR(u.baseMonthlySalary)}/mo
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      u.isActive ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"
                    )}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => openEdit(u)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 gap-1 px-2 text-xs",
                          u.isActive
                            ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                            : "text-green-700 hover:text-green-700 hover:bg-green-50"
                        )}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.isActive ? (
                          <><UserX className="h-3.5 w-3.5" /> Deactivate</>
                        ) : (
                          <><UserCheck className="h-3.5 w-3.5" /> Reactivate</>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Input value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)} placeholder="e.g. Software Engineer" />
            </div>
            <div className="space-y-1.5">
              <Label>Base Monthly Salary (₹)</Label>
              <Input
                type="number"
                min="0"
                value={editSalary}
                onChange={(e) => setEditSalary(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole((v ?? editRole) as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
              />
              <p className="text-xs text-muted-foreground">
                They'll receive an email with a registration link pre-filled with this address.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={sendingInvite || !inviteEmail}>
              {sendingInvite ? "Sending…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
