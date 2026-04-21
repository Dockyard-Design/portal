"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateUser } from "@/app/actions/users";
import type { SimpleUser } from "@/app/actions/users";
import type { UserRole } from "@/types/auth";
import type { Customer } from "@/types/kanban";

interface EditUserDialogProps {
  user: SimpleUser;
  customers: Customer[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, customers, open, onOpenChange }: EditUserDialogProps) {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [customerId, setCustomerId] = useState(user.customerId || "");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset form when user changes
  useEffect(() => {
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setRole(user.role);
    setCustomerId(user.customerId || "");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "customer" && !customerId) {
      toast.error("Select a company for customer users");
      return;
    }

    setIsLoading(true);
    try {
      await updateUser(user.id, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role,
        customerId: role === "customer" ? customerId : null,
      });
      toast.success("User updated successfully");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || 
                user.emailAddresses[0]?.emailAddress || 
                "No email";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user profile information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger id="editRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === "customer" && (
              <div className="grid gap-2">
                <Label htmlFor="editCustomer">Company</Label>
                <Select value={customerId} onValueChange={(value) => setCustomerId(value ?? "")}>
                  <SelectTrigger id="editCustomer">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company || customer.name || customer.email || "Unnamed customer"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (role === "customer" && !customerId)}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
