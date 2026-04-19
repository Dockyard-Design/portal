"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash2, Edit, Lock, Unlock, Key, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { deleteUser, lockUser, unlockUser, resetUserPassword } from "@/app/actions/users";
import type { SimpleUser } from "@/app/actions/users";
import { CreateUserDialog } from "./create-dialog";
import { EditUserDialog } from "./edit-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ITEMS_PER_PAGE = 10;

export function UsersTable({ users }: { users: SimpleUser[] }) {
  const [page, setPage] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<SimpleUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<SimpleUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handlePrevPage = () => setPage(p => Math.max(0, p - 1));
  const handleNextPage = () => setPage(p => Math.min(totalPages - 1, p + 1));

  const openDeleteDialog = (id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget);
      toast.success("User deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleLock = async (userId: string) => {
    setIsLoading(true);
    try {
      await lockUser(userId);
      toast.success("User locked");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to lock user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (userId: string) => {
    setIsLoading(true);
    try {
      await unlockUser(userId);
      toast.success("User unlocked");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unlock user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;
    setIsLoading(true);
    try {
      await resetUserPassword(resetPasswordUser.id, newPassword);
      toast.success("Password reset successful");
      setNewPassword("");
      setResetPasswordUser(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const getUserEmail = (user: SimpleUser) => {
    return user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || 
           user.emailAddresses[0]?.emailAddress || 
           "No email";
  };

  const getUserName = (user: SimpleUser) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name || user.username || "Unnamed User";
  };

  const getInitials = (user: SimpleUser) => {
    const first = user.firstName?.[0] || user.username?.[0] || "U";
    const last = user.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage portal users and their access
          </p>
        </div>
        <CreateUserDialog />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-background overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow>
              <TableHead className="w-[280px]">User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[150px]">Last Sign In</TableHead>
              <TableHead className="w-[150px]">Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarImage src={user.imageUrl ?? undefined} />
                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{getUserName(user)}</span>
                        {user.username && (
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {getUserEmail(user)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={user.locked 
                        ? "bg-red-500/10 text-red-600 border-red-500/20" 
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      }
                    >
                      {user.locked ? "Locked" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.lastSignInAt 
                      ? new Date(user.lastSignInAt).toLocaleDateString() 
                      : "Never"
                    }
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="size-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setEditUser(user)}>
                          <Edit className="size-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetPasswordUser(user)}>
                          <Key className="size-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        {user.locked ? (
                          <DropdownMenuItem onClick={() => handleUnlock(user.id)} disabled={isLoading}>
                            <Unlock className="size-4 mr-2 text-emerald-600" />
                            Unlock Account
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleLock(user.id)} disabled={isLoading}>
                            <Lock className="size-4 mr-2 text-amber-600" />
                            Lock Account
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(user.id)} 
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-secondary/10">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevPage} disabled={page === 0}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextPage} disabled={page >= totalPages - 1}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {editUser && (
        <EditUserDialog 
          user={editUser} 
          open={!!editUser} 
          onOpenChange={(open) => !open && setEditUser(null)} 
        />
      )}

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => {
        if (!open) {
          setResetPasswordUser(null);
          setNewPassword("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPasswordUser?.firstName || resetPasswordUser?.emailAddresses[0]?.emailAddress}.
              They will be signed out of all devices.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setResetPasswordUser(null);
                setNewPassword("");
              }} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={isLoading || newPassword.length < 8}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
