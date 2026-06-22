import { Card, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <Card>
      <h1 className="text-xl font-bold text-white">Not found</h1>
      <p className="mt-2 text-sm text-slate-400">This resource does not exist or you do not have access to it.</p>
      <LinkButton className="mt-4" href="/dashboard">Back to dashboard</LinkButton>
    </Card>
  );
}
