import { TaskStatus } from "@prisma/client";
import { Card, Badge } from "@/components/ui";
import { StatusChart } from "@/components/charts";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  await requireUser();
  const today = new Date();
  const [projects, tasks, completed, overdue, recent, statusGroups] = await Promise.all([
    prisma.project.count(),
    prisma.task.count(),
    prisma.task.count({ where: { status: TaskStatus.DONE } }),
    prisma.task.count({ where: { dueDate: { lt: today }, status: { not: TaskStatus.DONE } } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
    prisma.task.groupBy({ by: ["status"], _count: true }),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-slate-400">Portfolio health, delivery pressure, and recent activity.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Projects" value={projects} />
        <Metric label="Tasks" value={tasks} />
        <Metric label="Completed" value={completed} tone="green" />
        <Metric label="Overdue" value={overdue} tone="red" />
      </section>
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-lg font-semibold text-white">Task status</h2>
          <StatusChart data={statusGroups.map((group) => ({ name: enumLabel(group.status), value: group._count }))} />
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-white">Recent activity</h2>
          <div className="mt-4 divide-y divide-line">
            {recent.map((log) => (
              <div className="flex items-center justify-between gap-3 py-3" key={log.id}>
                <div>
                  <p className="text-sm font-medium text-slate-200">{log.message}</p>
                  <p className="text-xs text-slate-500">{log.user?.name ?? "System"} · {formatDate(log.createdAt)}</p>
                </div>
                <Badge tone="blue">{enumLabel(log.action)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Metric({ label, value, tone = "blue" }: { label: string; value: number; tone?: "blue" | "green" | "red" }) {
  return (
    <Card>
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-4xl font-bold text-white">{value}</p>
        <Badge tone={tone}>{label}</Badge>
      </div>
    </Card>
  );
}
