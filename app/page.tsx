"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VerificationStrategy =
  | "email_code"
  | "phone_code"
  | "totp"
  | "backup_code";

export default function LandingPage() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [verificationStrategy, setVerificationStrategy] =
    useState<VerificationStrategy | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);

  const isSubmitting = fetchStatus === "fetching" || isFinalizing;

  // Show loading state while Clerk initializes (#6, #13)
  if (!signIn) {
    return (
      <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/5 rounded-full blur-[120px]" />
        </div>
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Check if we need to show verification UI
  const needsVerification =
    signIn.status === "needs_second_factor" ||
    signIn.status === "needs_client_trust";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Guard against null signIn (#6)
    if (!signIn) {
      setErrorMessage("Authentication not initialized. Please try again.");
      return;
    }

    try {
      const createResult = await signIn.create({
        identifier: email,
        password,
      });

      if (createResult.error) {
        setErrorMessage(
          createResult.error.message ||
            "Something went wrong. Please try again.",
        );
        return;
      }

      if (signIn.status === "complete") {
        setIsFinalizing(true);
        const finalizeResult = await signIn.finalize();
        if (finalizeResult.error) {
          setIsFinalizing(false);
          setErrorMessage(
            finalizeResult.error.message || "Failed to finalize sign in.",
          );
          return;
        }
        router.push("/dashboard");
      } else if (
        signIn.status === "needs_client_trust" ||
        signIn.status === "needs_second_factor"
      ) {
        // Need MFA verification
        const factors = signIn.supportedSecondFactors;
        if (factors?.length) {
          const emailFactor = factors.find((f) => f.strategy === "email_code");
          const phoneFactor = factors.find((f) => f.strategy === "phone_code");
          const factor = emailFactor || phoneFactor || factors[0];

          setVerificationStrategy(factor.strategy as VerificationStrategy);

          // Send the verification code
          if (factor.strategy === "email_code") {
            const { error } = await signIn.mfa.sendEmailCode();
            if (error) {
              setErrorMessage(error.longMessage || error.message);
            }
          } else if (factor.strategy === "phone_code") {
            const { error } = await signIn.mfa.sendPhoneCode();
            if (error) {
              setErrorMessage(error.longMessage || error.message);
            }
          }
        } else {
          setErrorMessage("Verification required but no methods available.");
        }
      } else {
        setErrorMessage(
          `Unexpected status: ${signIn.status}. Please try again.`,
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!verificationStrategy) return;

    try {
      let result;
      if (verificationStrategy === "email_code") {
        result = await signIn.mfa.verifyEmailCode({ code });
      } else if (verificationStrategy === "phone_code") {
        result = await signIn.mfa.verifyPhoneCode({ code });
      } else if (verificationStrategy === "totp") {
        result = await signIn.mfa.verifyTOTP({ code });
      } else if (verificationStrategy === "backup_code") {
        result = await signIn.mfa.verifyBackupCode({ code });
      } else {
        setErrorMessage("Unknown verification method.");
        return;
      }

      if (result.error) {
        setErrorMessage(result.error.longMessage || result.error.message);
        return;
      }

      // After successful verification, finalize
      setIsFinalizing(true);
      const finalizeResult = await signIn.finalize();
      if (finalizeResult.error) {
        setIsFinalizing(false);
        setErrorMessage(
          finalizeResult.error.message || "Failed to complete sign in.",
        );
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Verification failed",
      );
    }
  };

  const handleResend = async () => {
    if (!verificationStrategy) return;
    if (verificationStrategy === "email_code") {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) setErrorMessage(error.longMessage || error.message);
    } else if (verificationStrategy === "phone_code") {
      const { error } = await signIn.mfa.sendPhoneCode();
      if (error) setErrorMessage(error.longMessage || error.message);
    }
  };

  const handleBackToSignIn = () => {
    signIn.reset();
    setEmail("");
    setPassword("");
    setCode("");
    setVerificationStrategy(null);
    setErrorMessage("");
  };

  // Show verification UI if needed
  if (needsVerification && verificationStrategy) {
    return (
      <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
        {isFinalizing && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="size-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Completing sign in...</p>
          </div>
        )}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex flex-row items-center justify-center pb-10">
            <Image
              src="/logo.svg"
              alt="Dockyard"
              width={320}
              height={80}
              className="h-auto w-auto"
              loading="eager"
            />
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              {verificationStrategy === "email_code" ? (
                <Mail className="size-6 text-primary" />
              ) : verificationStrategy === "phone_code" ? (
                <Phone className="size-6 text-primary" />
              ) : (
                <ShieldCheck className="size-6 text-primary" />
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Verify Your Identity
              </h1>
              <p className="text-muted-foreground text-sm">
                {verificationStrategy === "email_code"
                  ? "Enter the verification code sent to your email."
                  : verificationStrategy === "phone_code"
                    ? "Enter the verification code sent to your phone."
                    : "Enter your verification code."}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleVerifyCode} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                disabled={isSubmitting}
                className="h-10 text-center text-lg tracking-widest font-mono"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="w-full h-12 text-base font-medium transition-all hover:shadow-[0_0_20px_-5px_var(--color-primary)]"
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
              onClick={handleBackToSignIn}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="inline size-3 mr-1" />
              Back to sign in
            </button>
          </div>

          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">
            Dockyard Portal · &copy; {new Date().getFullYear()} Dockyard Design
          </p>
        </div>
      </div>
    );
  }

  // Show sign-in form
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      {isFinalizing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="size-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Completing sign in...</p>
        </div>
      )}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-row items-center justify-center pb-20">
          <Image
            src="/logo.svg"
            alt="Dockyard"
            width={320}
            height={80}
            className="h-auto w-auto"
            priority
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@dockyard.design"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isSubmitting}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isSubmitting}
                className="h-10 pr-10"
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
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive text-center">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium transition-all hover:shadow-[0_0_20px_-5px_var(--color-primary)]"
            disabled={isSubmitting}
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
          Dockyard Portal · &copy; {new Date().getFullYear()} Dockyard Design
        </p>
      </div>
    </div>
  );
}
