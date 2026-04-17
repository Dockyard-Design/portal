"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
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

type VerificationStrategy = "email_code" | "phone_code" | "totp" | "backup_code";

export default function CustomSignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Verification code state
  const [code, setCode] = useState("");
  const [verificationStrategy, setVerificationStrategy] =
    useState<VerificationStrategy | null>(null);

  const isSubmitting = fetchStatus === "fetching";

  // Determine which step we're on based on signIn.status
  const needsVerification =
    signIn?.status === "needs_second_factor" ||
    signIn?.status === "needs_client_trust";

  const handleFinalize = async () => {
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
      setErrorMessage(error.longMessage || error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const { error } = await signIn!.password({
      emailAddress: email,
      password,
    });

    if (error) {
      setErrorMessage(error.longMessage || error.message);
      return;
    }

    if (signIn!.status === "complete") {
      await handleFinalize();
    } else if (signIn!.status === "needs_second_factor") {
      // MFA required - find the best available strategy
      const factors = signIn!.supportedSecondFactors;
      const emailCodeFactor = factors.find(
        (f: any) => f.strategy === "email_code"
      );
      const phoneCodeFactor = factors.find(
        (f: any) => f.strategy === "phone_code"
      );
      const totpFactor = factors.find((f: any) => f.strategy === "totp");

      // Prefer email code, then phone code, then TOTP
      if (emailCodeFactor) {
        const { error: sendError } = await signIn!.mfa.sendEmailCode();
        if (sendError) {
          setErrorMessage(sendError.longMessage || sendError.message);
          return;
        }
        setVerificationStrategy("email_code");
      } else if (phoneCodeFactor) {
        const { error: sendError } = await signIn!.mfa.sendPhoneCode();
        if (sendError) {
          setErrorMessage(sendError.longMessage || sendError.message);
          return;
        }
        setVerificationStrategy("phone_code");
      } else if (totpFactor) {
        // TOTP requires the user to use an authenticator app - just show the code input
        setVerificationStrategy("totp");
      } else {
        // Backup code as last resort
        setVerificationStrategy("backup_code");
      }
    } else if (signIn!.status === "needs_client_trust") {
      // Client Trust (new device verification) - find available strategy
      const factors = signIn!.supportedSecondFactors;
      const emailCodeFactor = factors.find(
        (f: any) => f.strategy === "email_code"
      );
      const phoneCodeFactor = factors.find(
        (f: any) => f.strategy === "phone_code"
      );

      if (emailCodeFactor) {
        const { error: sendError } = await signIn!.mfa.sendEmailCode();
        if (sendError) {
          setErrorMessage(sendError.longMessage || sendError.message);
          return;
        }
        setVerificationStrategy("email_code");
      } else if (phoneCodeFactor) {
        const { error: sendError } = await signIn!.mfa.sendPhoneCode();
        if (sendError) {
          setErrorMessage(sendError.longMessage || sendError.message);
          return;
        }
        setVerificationStrategy("phone_code");
      } else {
        setErrorMessage(
          "No supported verification method available. Please try again."
        );
      }
    } else {
      setErrorMessage(
        "Sign-in could not be completed. Please try a different method."
      );
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    let error;

    if (verificationStrategy === "email_code") {
      ({ error } = await signIn!.mfa.verifyEmailCode({ code }));
    } else if (verificationStrategy === "phone_code") {
      ({ error } = await signIn!.mfa.verifyPhoneCode({ code }));
    } else if (verificationStrategy === "totp") {
      ({ error } = await signIn!.mfa.verifyTOTP({ code }));
    } else if (verificationStrategy === "backup_code") {
      ({ error } = await signIn!.mfa.verifyBackupCode({ code }));
    } else {
      setErrorMessage("Unknown verification strategy.");
      return;
    }

    if (error) {
      setErrorMessage(error.longMessage || error.message);
      return;
    }

    if (signIn!.status === "complete") {
      await handleFinalize();
    } else {
      setErrorMessage("Verification was not completed. Please try again.");
    }
  };

  const handleResendCode = async () => {
    setErrorMessage("");

    if (verificationStrategy === "email_code") {
      const { error } = await signIn!.mfa.sendEmailCode();
      if (error) {
        setErrorMessage(error.longMessage || error.message);
      }
    } else if (verificationStrategy === "phone_code") {
      const { error } = await signIn!.mfa.sendPhoneCode();
      if (error) {
        setErrorMessage(error.longMessage || error.message);
      }
    }
  };

  const handleStartOver = () => {
    signIn!.reset();
    setVerificationStrategy(null);
    setCode("");
    setErrorMessage("");
  };

  const getVerificationDescription = () => {
    if (verificationStrategy === "email_code") {
      return "A verification code has been sent to your email address.";
    } else if (verificationStrategy === "phone_code") {
      return "A verification code has been sent to your phone number.";
    } else if (verificationStrategy === "totp") {
      return "Enter the code from your authenticator app.";
    } else if (verificationStrategy === "backup_code") {
      return "Enter one of your backup recovery codes.";
    }
    return "Enter the verification code.";
  };

  const getVerificationIcon = () => {
    if (verificationStrategy === "email_code") {
      return <Mail className="size-6 text-primary" />;
    } else if (verificationStrategy === "phone_code") {
      return <Phone className="size-6 text-primary" />;
    }
    return <ShieldCheck className="size-6 text-primary" />;
  };

  // Show verification code form when needed
  if (needsVerification && verificationStrategy) {
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

          <form onSubmit={handleVerifyCode} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoComplete="one-time-code"
                disabled={isSubmitting}
                className="h-10 text-center text-lg tracking-widest"
                autoFocus
              />
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive text-center">
                {errorMessage}
              </div>
            )}

            {errors.fields.code && (
              <p className="text-sm text-destructive text-center">
                {errors.fields.code.longMessage || errors.fields.code.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium transition-all hover:shadow-[0_0_20px_-5px_var(--color-primary)]"
              disabled={isSubmitting || !code.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Verifying…
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </form>

          <div className="flex flex-col gap-2 items-center">
            {(verificationStrategy === "email_code" ||
              verificationStrategy === "phone_code") && (
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                Didn&apos;t receive a code? Resend
              </button>
            )}
            <button
              type="button"
              onClick={handleStartOver}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="inline size-3 mr-1" />
              Start over
            </button>
          </div>

          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">
            Invite only · &copy; {new Date().getFullYear()} Dockyard Portal
          </p>
        </div>
      </div>
    );
  }

  // Default: show email/password sign-in form
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

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
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

          {errors.fields.identifier && (
            <p className="text-sm text-destructive text-center">
              {errors.fields.identifier.longMessage ||
                errors.fields.identifier.message}
            </p>
          )}

          {errors.fields.password && (
            <p className="text-sm text-destructive text-center">
              {errors.fields.password.longMessage ||
                errors.fields.password.message}
            </p>
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
          Invite only · &copy; {new Date().getFullYear()} Dockyard Portal
        </p>
      </div>
    </div>
  );
}