"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-2xl border border-destructive/25 bg-card/60 p-7 text-center sm:p-10">
        <AlertTriangle
          className="mx-auto size-8 text-destructive"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-2xl font-semibold">Data is unavailable</h1>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-muted-foreground">
          KaggleScope could not read the latest processed data. Please try the
          request again.
        </p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
