import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Compass, Home, MessageSquare } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen overflow-hidden bg-background px-6 py-8 text-foreground sm:px-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,color-mix(in_oklch,var(--primary)_20%,transparent),transparent_30%),linear-gradient(135deg,color-mix(in_oklch,var(--secondary)_70%,transparent),transparent_45%)]" />
      <div className="absolute left-0 top-0 -z-10 h-full w-px translate-x-8 bg-primary/30 sm:translate-x-14" />
      <div className="absolute bottom-8 left-8 right-8 -z-10 h-px bg-border sm:left-14 sm:right-14" />

      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
        <div className="max-w-2xl">
          <Image
            src="/logo.svg"
            alt="Dockyard"
            width={184}
            height={46}
            priority
            className="mb-12 h-auto w-40 sm:w-46"
          />

          <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <Compass className="size-3.5" />
            Navigation lost
          </p>

          <h1 className="max-w-3xl text-5xl font-semibold leading-none tracking-normal text-foreground sm:text-7xl lg:text-8xl">
            This page drifted off course.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            The link may be outdated, moved, or restricted. Head back to the
            portal and continue from a known route.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              <Home className="size-4" />
              Open dashboard
            </Link>
            <Link
              href="/dashboard/messages"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2 bg-background/55",
              )}
            >
              <MessageSquare className="size-4" />
              Messaging centre
            </Link>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Return to portal sign in
          </Link>
        </div>

        <div className="relative min-h-80 overflow-hidden rounded-lg border border-border/70 bg-card/80 p-5 shadow-2xl shadow-background/50">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <div className="grid h-full min-h-72 grid-rows-[auto_1fr_auto] rounded-md border border-border/60 bg-background/60 p-5">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Route check
              </span>
              <span className="rounded-md border border-destructive/35 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                404
              </span>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute h-44 w-44 rounded-full border border-primary/25" />
              <div className="absolute h-28 w-28 rounded-full border border-dashed border-muted-foreground/35" />
              <div className="absolute h-px w-64 rotate-[-18deg] bg-primary/35" />
              <div className="absolute h-px w-56 rotate-[24deg] bg-border" />
              <div className="relative flex size-24 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-4xl font-semibold text-primary shadow-[0_0_48px_-18px_var(--primary)]">
                404
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
              <span>Request</span>
              <span className="text-center">Unmatched</span>
              <span className="text-right">No index</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
