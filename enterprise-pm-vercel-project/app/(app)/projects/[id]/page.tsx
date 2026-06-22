import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/components/kanban-board";
import { Badge, Card, LinkButton } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate, percent } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: true,
      members: { include: { user: true } },
      tasks: { include: { assignee: { select: { name: true } } }, orderBy: { dueDate: "asc" } },
    },
  });
  if (!project) notFound();
  if (user.role === Role.MEMBER && !project.members.some((member) => member.userId === user.id)) notFound();

  const done = project.tasks.filter((task) => task.status === "DONE").length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3"><h1 className="text-3xl font-bold text-white">{project.name}</h1><Badge tone="blue">{enumLabel(project.status)}</Badge></div>
          <p className="mt-2 max-w-4xl text-slate-400">{project.description}</p>
        </div>
        {user.role !== Role.MEMBER ? <LinkButton href={`/projects/${project.id}/edit`}>Edit project</LinkButton> : null}
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-slate-400">Owner</p><p className="mt-2 font-semibold text-white">{project.owner.name}</p></Card>
        <Card><p className="text-sm text-slate-400">Timeline</p><p className="mt-2 font-semibold text-white">{formatDate(project.startDate)} - {formatDate(project.endDate)}</p></Card>
        <Card><p className="text-sm text-slate-400">Progress</p><p className="mt-2 font-semibold text-white">{percent(done, project.tasks.length)}%</p></Card>
        <Card><p className="text-sm text-slate-400">Team</p><p className="mt-2 font-semibold text-white">{project.members.length} members</p></Card>
      </section>
      <Card>
        <h2 className="text-lg font-semibold text-white">Team members</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.members.map((member) => <Badge key={member.id} tone="neutral">{member.user.name}</Badge>)}
        </div>
      </Card>
      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-white">Kanban board</h2>
        <KanbanBoard tasks={project.tasks} />
      </section>
    </div>
  );
}
