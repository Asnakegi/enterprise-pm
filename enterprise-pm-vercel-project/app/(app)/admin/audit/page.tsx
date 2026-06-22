import { Role } from "@prisma/client";
import { Badge, Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate } from "@/lib/utils";

export default async function AuditPage() {
  await requireRole([Role.ADMIN]);
  const logs = await prisma.auditLog.findMany({ include: { user: true, project: true, task: true }, orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="grid gap-6">
      <div><h1 className="text-3xl font-bold text-white">Audit log</h1><p className="mt-1 text-slate-400">Admin-only record of important system actions.</p></div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr><th className="p-3">Action</th><th>Message</th><th>User</th><th>Project</th><th>Task</th><th>Time</th></tr></thead>
          <tbody className="divide-y divide-line">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="p-3"><Badge tone="blue">{enumLabel(log.action)}</Badge></td>
                <td className="font-medium text-white">{log.message}</td>
                <td>{log.user?.name ?? "System"}</td>
                <td>{log.project?.name ?? "-"}</td>
                <td>{log.task?.title ?? "-"}</td>
                <td>{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
