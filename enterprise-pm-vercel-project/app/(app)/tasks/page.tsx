import { Role, TaskPriority, TaskStatus } from "@prisma/client";
import Link from "next/link";
import { deleteTask } from "@/app/(app)/actions";
import { Badge, Button, Card, EmptyState, Input, LinkButton, Select } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate } from "@/lib/utils";

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const filters = await searchParams;
  const where = {
    ...(filters.status ? { status: filters.status as TaskStatus } : {}),
    ...(filters.priority ? { priority: filters.priority as TaskPriority } : {}),
    ...(filters.project ? { projectId: filters.project } : {}),
    ...(filters.assignee ? { assigneeId: filters.assignee } : {}),
    ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" as const } } : {}),
    ...(user.role === Role.MEMBER ? { assigneeId: user.id } : {}),
  };
  const [tasks, projects, users] = await Promise.all([
    prisma.task.findMany({ where, include: { project: true, assignee: true }, orderBy: { dueDate: "asc" } }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-bold text-white">Tasks</h1><p className="mt-1 text-slate-400">Search, filter, assign, and update work.</p></div>
        {user.role !== Role.MEMBER ? <LinkButton href="/tasks/new">New task</LinkButton> : null}
      </div>
      <Card>
        <form className="grid gap-3 md:grid-cols-6">
          <Input defaultValue={filters.q} name="q" placeholder="Search title" />
          <Select defaultValue={filters.status ?? ""} name="status"><option value="">All statuses</option>{Object.values(TaskStatus).map((s) => <option key={s} value={s}>{enumLabel(s)}</option>)}</Select>
          <Select defaultValue={filters.priority ?? ""} name="priority"><option value="">All priorities</option>{Object.values(TaskPriority).map((p) => <option key={p} value={p}>{enumLabel(p)}</option>)}</Select>
          <Select defaultValue={filters.project ?? ""} name="project"><option value="">All projects</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          <Select defaultValue={filters.assignee ?? ""} name="assignee"><option value="">All assignees</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
          <Button type="submit">Filter</Button>
        </form>
      </Card>
      {tasks.length === 0 ? <EmptyState title="No tasks found" description="Adjust filters or create a new task." /> : null}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="p-3">Task</th><th>Project</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th><th>Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="p-3"><p className="font-semibold text-white">{task.title}</p><p className="text-slate-500">{task.description}</p></td>
                <td><Link className="text-sky-300" href={`/projects/${task.projectId}`}>{task.project.name}</Link></td>
                <td>{task.assignee?.name ?? "Unassigned"}</td>
                <td><Badge tone={task.priority === "CRITICAL" ? "red" : task.priority === "HIGH" ? "yellow" : "neutral"}>{enumLabel(task.priority)}</Badge></td>
                <td><Badge tone={task.status === "DONE" ? "green" : "blue"}>{enumLabel(task.status)}</Badge></td>
                <td>{formatDate(task.dueDate)}</td>
                <td>
                  <div className="flex gap-2">
                    <LinkButton className="bg-slate-800 text-white hover:bg-slate-700" href={`/tasks/${task.id}/edit`}>Edit</LinkButton>
                    {user.role !== Role.MEMBER ? <form action={deleteTask}><input name="id" type="hidden" value={task.id} /><Button type="submit" variant="danger">Delete</Button></form> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
