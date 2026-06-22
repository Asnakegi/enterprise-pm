import { Card } from "@/components/ui";

export default function Loading() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card className="h-28 animate-pulse bg-slate-900" key={index} />
      ))}
    </div>
  );
}
