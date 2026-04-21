"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReverification, useSession, useUser } from "@clerk/nextjs";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { completeInitialPasswordChange } from "@/app/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/types/auth";

interface SettingsClientProps {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  initialPasswordChangeRequired: boolean;
  firstLoginAt: string | null;
}

function getClerkErrorMessage(error: unknown): string {
  const clerkError = error as {
    errors?: Array<{ longMessage?: string; message?: string; code?: string }>;
    code?: string;
    message?: string;
  };
  const firstError = clerkError.errors?.[0];

  if (firstError?.code === "session_reverification_required") {
    return "Confirm your current password to continue.";
  }
  if (clerkError.code === "reverification_cancelled") {
    return "Current password verification was not completed.";
  }

  return (
    firstError?.longMessage ||
    firstError?.message ||
    clerkError.message ||
    "Failed to update account settings"
  );
}

function getPasswordScore(password: string): number {
  const checks = [
    password.length >= 12,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  return checks.filter(Boolean).length;
}

function getPasswordStrengthLabel(score: number): string {
  if (score >= 5) return "Strong";
  if (score >= 4) return "Good";
  if (score >= 3) return "Fair";
  return "Weak";
}

function VisibilityButton({
  visible,
  onClick,
  label,
}: {
  visible: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      tabIndex={-1}
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

export function SettingsClient({
  email,
  firstName: initialFirstName,
  lastName: initialLastName,
  role,
  initialPasswordChangeRequired,
}: SettingsClientProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const verificationErrorMessageRef = useRef<string | null>(null);

  const passwordScore = useMemo(() => getPasswordScore(newPassword), [newPassword]);
  const passwordStrengthLabel = getPasswordStrengthLabel(passwordScore);
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || email;
  const profileChanged =
    firstName.trim() !== initialFirstName || lastName.trim() !== initialLastName;

  const updatePasswordWithCustomVerification = useReverification(
    async () => {
      if (!user) throw new Error("User not loaded");
      return user.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: true,
      });
    },
    {
      onNeedsReverification: ({ complete, cancel, level }) => {
        void (async () => {
          if (!session) {
            verificationErrorMessageRef.current =
              "Session not loaded. Refresh the page and try again.";
            cancel();
            return;
          }

          try {
            await session.startVerification({ level: level ?? "first_factor" });
            const verification = await session.attemptFirstFactorVerification({
              strategy: "password",
              password: currentPassword,
            });

            if (verification.status !== "complete") {
              verificationErrorMessageRef.current =
                "Current password verified, but this account needs another factor.";
              cancel();
              return;
            }

            complete();
          } catch (error) {
            verificationErrorMessageRef.current = getClerkErrorMessage(error);
            cancel();
          }
        })();
      },
    }
  );

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (newPassword.length < 12) {
      toast.error("Use at least 12 characters for the new password.");
      return;
    }
    if (passwordScore < 4) {
      toast.error("Use a stronger password with mixed character types.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPasswordSaving(true);
    verificationErrorMessageRef.current = null;
    try {
      await updatePasswordWithCustomVerification();
      await completeInitialPasswordChange();
      await user.reload();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
      router.refresh();
    } catch (error) {
      toast.error(verificationErrorMessageRef.current || getClerkErrorMessage(error));
    } finally {
      setPasswordSaving(false);
    }
  };

  const passwordCanSubmit = useMemo(
    () =>
      currentPassword.length > 0 &&
      newPassword.length > 0 &&
      confirmPassword.length > 0,
    [confirmPassword, currentPassword, newPassword]
  );

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setProfileSaving(true);
    try {
      await user.update({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      });
      await user.reload();
      toast.success("Profile updated");
      router.refresh();
    } catch (error) {
      toast.error(getClerkErrorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-7">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={initialPasswordChangeRequired ? "default" : "outline"}>
                {initialPasswordChangeRequired ? "Action required" : "Secured"}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {role}
              </Badge>
            </div>
            <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
              Account Settings
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage profile details and secure your Dockyard portal sign-in.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:min-w-72">
            <div className="rounded-lg border border-border/70 bg-background/45 p-3">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="mt-1 truncate font-medium">{displayName}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/45 p-3">
              <p className="text-xs text-muted-foreground">Onboarding</p>
              <p className="mt-1 truncate font-medium">
                {initialPasswordChangeRequired ? "Needs update" : "Complete"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <UserRound className="size-4" />
              </span>
              Profile details
            </CardTitle>
            <CardDescription>
              Keep your visible account name accurate for messages and documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    disabled={!isLoaded || profileSaving}
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    disabled={!isLoaded || profileSaving}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled className="h-10 bg-muted/70" />
              </div>
              <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Email is managed by portal administration.
                </p>
                <Button type="submit" disabled={!isLoaded || profileSaving || !profileChanged}>
                  {profileSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {profileSaving ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <KeyRound className="size-4" />
              </span>
              Custom password reset
            </CardTitle>
            <CardDescription>
              Confirm with your current password, then set a stronger replacement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    disabled={!isLoaded || passwordSaving}
                    className="h-10 pr-10"
                  />
                  <VisibilityButton
                    visible={showCurrentPassword}
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      disabled={!isLoaded || passwordSaving}
                      className="h-10 pr-10"
                    />
                    <VisibilityButton
                      visible={showNewPassword}
                      onClick={() => setShowNewPassword((value) => !value)}
                      label={showNewPassword ? "Hide new password" : "Show new password"}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={!isLoaded || passwordSaving}
                      className="h-10 pr-10"
                    />
                    <VisibilityButton
                      visible={showConfirmPassword}
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-3 rounded-lg border border-border/70 bg-background/45 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Password strength</p>
                    <Badge
                      variant={passwordScore >= 4 ? "default" : "outline"}
                      className={passwordScore >= 4 ? "" : "text-muted-foreground"}
                    >
                      {passwordStrengthLabel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={`h-1.5 rounded-full ${
                          index < passwordScore ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Use 12+ characters with upper, lower, number and symbol coverage.
                  </p>
                </div>
                <Button type="submit" disabled={!isLoaded || passwordSaving || !passwordCanSubmit}>
                  {passwordSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {passwordSaving ? "Updating..." : "Update password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
