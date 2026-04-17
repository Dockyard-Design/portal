"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Schemas ────────────────────────────────────────────────────────────────

const credentialsSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const codeSchema = z.object({
  code: z
    .string()
    .min(6, "Code must be at least 6 digits.")
    .max(8, "Code must be at most 8 digits.")
    .regex(/^\d+$/, "Code must contain digits only."),
});

type VerificationStrategy = "email_code" | "phone_code" | "totp" | "backup_code";
type Step = "credentials" | "verification";

interface FieldErrors {
  email?: string;
  password?: string;
  code?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CustomSignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  // Form state
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [verificationStrategy, setVerificationStrategy] =
    useState<VerificationStrategy>("totp");

  // UI state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const isSubmitting = fetchStatus === "fetching";

  // ── Helpers ────────────────────────────────────────────────────────────────

  function clearErrors() {
    setFieldErrors({});
    setServerError("");
  }

  /** Activate the completed session and navigate to the dashboard. */
  async function finalizeAndNavigate() {
    const { error } = await signIn!.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.log("Session task:", session.currentTask);
          return;
        }
        const url = decorateUrl("/dashboard");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });

    if (error) {
      setServerError(error.longMessage || error.message);
    }
  }

  /** Pick the best available second-factor strategy & prepare it if needed. */
  function pickSecondFactorStrategy(): VerificationStrategy | null {
    const factors = signIn!.supportedSecondFactors;
    if (!factors || factors.length === 0) return null;

    const factor = factors[0];
    const strategy = factor?.strategy as VerificationStrategy;

    if (
      strategy === "email_code" ||
      strategy === "phone_code" ||
      strategy === "totp" ||
      strategy === "backup_code"
    ) {
      return strategy;
    }

    // Fallback: scan for a known strategy
    const emailCode = factors.find((f) => f.strategy === "email_code");
    if (emailCode) return "email_code";

    const phoneCode = factors.find((f) => f.strategy === "phone_code");
    if (phoneCode) return "phone_code";

    const totp = factors.find((f) => f.strategy === "totp");
    if (totp) return "totp";

    const backup = factors.find((f) => f.strategy === "backup_code");
    if (backup) return "backup_code";

    return null;
  }

  /** Prepare (send) a second-factor code when required. */
  async function prepareSecondFactor(
    strategy: VerificationStrategy
  ): Promise<string | null> {
    if (strategy === "email_code") {
      const { error } = await signIn!.mfa.sendEmailCode();
      return error ? error.longMessage || error.message : null;
    }
    if (strategy === "phone_code") {
      const { error } = await signIn!.mfa.sendPhoneCode();
      return error ? error.longMessage || error.message : null;
    }
    // TOTP & backup codes don't need preparation
    return null;
  }

  // ── Step 1: Submit email + password ────────────────────────────────────────

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;
    clearErrors();

    // Zod validation
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    // Initiate sign-in with identifier + password
    const { error } = await signIn.create({
      identifier: email,
      password,
    });

    if (error) {
      setServerError(error.longMessage || error.message);
      return;
    }

    const status = signIn.status;

    // ── Complete: no further verification needed ──
    if (status === "complete") {
      await finalizeAndNavigate();
      return;
    }

    // ── Client trust verification (new device / browser) ──
    // Clerk verifies this internally; treat it as a successful sign-in.
    if (status === "needs_client_trust") {
      await finalizeAndNavigate();
      return;
    }

    // ── Second factor (MFA) required ──
    if (status === "needs_second_factor") {
      const strategy = pickSecondFactorStrategy();
      if (!strategy) {
        setServerError(
          "No supported verification method available. Please try again."
        );
        return;
      }

      const prepareError = await prepareSecondFactor(strategy);
      if (prepareError) {
        setServerError(prepareError);
        return;
      }

      setVerificationStrategy(strategy);
      setStep("verification");
      return;
    }

    // ── First factor still needed (edge case) ──
    if (status === "needs_first_factor") {
      setServerError(
        "Additional sign-in step required. Please check your email for a magic link or code."
      );
      return;
    }

    setServerError(`Unexpected sign-in status: ${status}`);
  }

  // ── Step 2: Submit verification code ──────────────────────────────────────

  async function handleVerificationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;
    clearErrors();

    // Zod validation
    const parsed = codeSchema.safeParse({ code });
    if (!parsed.success) {
      setFieldErrors({ code: parsed.error.issues[0].message });
      return;
    }

    let error;

    if (verificationStrategy === "email_code") {
      ({ error } = await signIn.mfa.verifyEmailCode({ code }));
    } else if (verificationStrategy === "phone_code") {
      ({ error } = await signIn.mfa.verifyPhoneCode({ code }));
    } else if (verificationStrategy === "totp") {
      ({ error } = await signIn.mfa.verifyTOTP({ code }));
    } else if (verificationStrategy === "backup_code") {
      ({ error } = await signIn.mfa.verifyBackupCode({ code }));
    } else {
      setServerError("Unknown verification strategy.");
      return;
    }

    if (error) {
      setServerError(error.longMessage || error.message);
      return;
    }

    const status = signIn.status;

    // ── Complete ──
    if (status === "complete") {
      await finalizeAndNavigate();
      return;
    }

    // ── Client trust verification ──
    if (status === "needs_client_trust") {
      await finalizeAndNavigate();
      return;
    }

    setServerError("Verification was not completed. Please try again.");
  }

  // ── Resend code (email_code / phone_code only) ─────────────────────────────

  async function handleResend() {
    if (!signIn) return;
    clearErrors();

    if (verificationStrategy === "email_code") {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) setServerError(error.longMessage || error.message);
    } else if (verificationStrategy === "phone_code") {
      const { error } = await signIn.mfa.sendPhoneCode();
      if (error) setServerError(error.longMessage || error.message);
    }
  }

  // ── Verification label helpers ──────────────────────────────────────────────

  function getVerificationDescription() {
    switch (verificationStrategy) {
      case "totp":
        return "Enter the 6-digit code from your authenticator app.";
      case "email_code":
        return "We sent a verification code to your email address.";
      case "phone_code":
        return "We sent a verification code to your phone number.";
      case "backup_code":
        return "Enter one of your backup codes.";
      default:
        return "Enter the verification code sent to you.";
    }
  }

  function getVerificationIcon() {
    switch (verificationStrategy) {
      case "email_code":
        return <Mail className="size-6 text-primary" />;
      case "phone_code":
        return <Phone className="size-6 text-primary" />;
      default:
        return <ShieldCheck className="size-6 text-primary" />;
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (!signIn) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Verification step ───────────────────────────────────────────────────────

  if (step === "verification") {
    return (
      <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              {getVerificationIcon()}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Verify Your Identity
              </h1>
              <p className="text-muted-foreground text-sm">
                {getVerificationDescription()}
              </p>
            </div>
          </div>

          {/* ── Server error ── */}
          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive text-center">
              {serverError}
            </div>
          )}

          <form
            onSubmit={handleVerificationSubmit}
            noValidate
            className="space-y-4 text-left"
          >
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                placeholder="123456"
                maxLength={8}
                disabled={isSubmitting}
                className={`h-10 text-center text-lg tracking-widest font-mono ${
                  fieldErrors.code ? "border-destructive" : ""
                }`}
                aria-describedby={
                  fieldErrors.code ? "code-error" : undefined
                }
              />
              {fieldErrors.code && (
                <p
                  id="code-error"
                  className="text-sm text-destructive text-center"
                  role="alert"
                >
                  {fieldErrors.code}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium transition-all hover:shadow-[0_0_20px_-5px_var(--color-primary)]"
              disabled={isSubmitting || !code.trim()}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Verifying…
                </>
              ) : (
                "Verify & sign in"
              )}
            </Button>
          </form>

          <div className="flex flex-col gap-2 items-center">
            {(verificationStrategy === "email_code" ||
              verificationStrategy === "phone_code") && (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                Didn&apos;t receive a code? Resend
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                signIn.reset();
                setStep("credentials");
                setCode("");
                clearErrors();
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="inline size-3 mr-1" />
              Back to sign in
            </button>
          </div>

          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">
            Invite only · &copy; {new Date().getFullYear()} Dockyard Portal
          </p>
        </div>
      </div>
    );
  }

  // ── Credentials step ────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.svg"
            alt="Dockyard"
            width={160}
            height={40}
            className="h-10 w-auto brightness-200"
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Dockyard Portal
            </h1>
            <p className="text-muted-foreground">
              Secure access to your admin portal
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCredentialsSubmit}
          noValidate
          className="space-y-4 text-left"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isSubmitting}
              className={`h-10 ${fieldErrors.email ? "border-destructive" : ""}`}
              aria-describedby={
                fieldErrors.email ? "email-error" : undefined
              }
            />
            {fieldErrors.email && (
              <p
                id="email-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isSubmitting}
                className={`h-10 pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p
                id="password-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* ── Server error ── */}
          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive text-center">
              {serverError}
            </div>
          )}

          {/* ── Clerk field errors ── */}
          {errors.fields.identifier && (
            <p className="text-sm text-destructive text-center" role="alert">
              {errors.fields.identifier.longMessage ||
                errors.fields.identifier.message}
            </p>
          )}
          {errors.fields.password && (
            <p className="text-sm text-destructive text-center" role="alert">
              {errors.fields.password.longMessage ||
                errors.fields.password.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium transition-all hover:shadow-[0_0_20px_-5px_var(--color-primary)]"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">
          Invite only · &copy; {new Date().getFullYear()} Dockyard Portal
        </p>
      </div>
    </div>
  );
}