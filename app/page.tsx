import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Lock className="size-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dockyard Design</h1>
            <p className="text-muted-foreground">Secure access to your admin portal</p>
          </div>
        </div>

        <div className="grid gap-3">
          <Link href="/sign-in" className="inline-block w-full">
            <Button className="w-full h-12 text-base font-medium">
              Sign in
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">
          &copy; {new Date().getFullYear()} Dockyard Design
        </p>
      </div>
    </div>
  );
}
