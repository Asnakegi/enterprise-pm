import { TaskStatus } from "@prisma/client";
import { BarMetricChart, StatusChart } from "@/components/charts";
import { Badge, Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate, percent } from "@/lib/utils";

export default async function ReportsPage() {
  await requireUser();
  const today = new Date();
  const [projects, byStatus, byPriority, overdue, users] = await Promise.all([
    prisma.project.findMany({ include: { tasks: true }, orderBy: { name: "asc" } }),
    prisma.task.groupBy({ by: ["status"], _count: true }),
    prisma.task.groupBy({ by: ["priority"], _count: true }),
    prisma.task.findMany({ where: { dueDate: { lt: today }, status: { not: TaskStatus.DONE } }, include: { project: true, assignee: true }, orderBy: { dueDate: "asc" } }),
    prisma.user.findMany({ include: { assignedTasks: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <div><h1 className="text-3xl font-bold text-white">Reports</h1><p className="mt-1 text-slate-400">Executive summaries for completion, risk, and workload.</p></div>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card><h2 className="text-lg font-semibold text-white">Tasks by status</h2><StatusChart data={byStatus.map((x) => ({ name: enumLabel(x.status), value: x._count }))} /></Card>
        <Card><h2 className="text-lg font-semibold text-white">Tasks by priority</h2><BarMetricChart data={byPriority.map((x) => ({ name: enumLabel(x.priority), value: x._count }))} /></Card>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-white">Project completion</h2>
          <div className="mt-4 grid gap-3">
            {projects.map((project) => {
              const done = project.tasks.filter((task) => task.status === "DONE").length;
              const value = percent(done, project.tasks.length);
              return (
                <div key={project.id}>
                  <div className="flex justify-between text-sm"><span>{project.name}</span><span>{value}%</span></div>
                  <div className="mt-2 h-2 rounded bg-slate-800"><div className="h-2 rounded bg-sky-400" style={{ width: `${value}%` }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-white">Workload by user</h2>
          <BarMetricChart data={users.map((user) => ({ name: user.name, value: user.assignedTasks.filter((task) => task.status !== "DONE").length }))} />
        </Card>
      </section>
      <Card>
        <h2 className="text-lg font-semibold text-white">Overdue tasks</h2>
        <div className="mt-4 divide-y divide-line">
          {overdue.map((task) => (
            <div className="flex items-center justify-between gap-3 py-3" key={task.id}>
              <div><p className="font-medium text-white">{task.title}</p><p className="text-sm text-slate-500">{task.project.name} · {task.assignee?.name ?? "Unassigned"}</p></div>
              <Badge tone="red">{formatDate(task.dueDate)}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
