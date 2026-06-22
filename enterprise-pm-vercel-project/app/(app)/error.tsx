"use client";

import { Button, Card } from "@/components/ui";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Card>
      <h1 className="text-xl font-bold text-white">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-400">{error.message || "The request could not be completed."}</p>
      <Button className="mt-4" onClick={reset} type="button">Try again</Button>
    </Card>
  );
}
