"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LandingPage() {
  const { signIn, fetchStatus, errors } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isSubmitting = fetchStatus === "fetching";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const createResult = await signIn.create({
      identifier: email,
      password,
    });

    if (createResult.error) {
      setErrorMessage(
        createResult.error.message || "Something went wrong. Please try again."
      );
      return;
    }

    if (signIn.status === "complete") {
      const finalizeResult = await signIn.finalize();
      if (finalizeResult.error) {
        setErrorMessage(
          finalizeResult.error.message || "Failed to finalize sign in."
        );
        return;
      }
      router.push("/dashboard");
    } else {
      setErrorMessage("Additional verification required. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-row items-center justify-center pb-20">
          <Image src="/logo.svg" alt="Dockyard" width={320} height={80} className="h-auto w-auto brightness-200" loading="eager" />
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
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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