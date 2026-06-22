import { Role } from "@prisma/client";
import Link from "next/link";
import { deleteProject } from "@/app/(app)/actions";
import { Badge, Button, Card, EmptyState, LinkButton } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate, percent } from "@/lib/utils";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: user.role === Role.ADMIN ? {} : user.role === Role.MANAGER ? { ownerId: user.id } : { members: { some: { userId: user.id } } },
    include: { owner: true, tasks: true, members: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="mt-1 text-slate-400">Create, track, and govern active delivery work.</p>
        </div>
        {user.role !== Role.MEMBER ? <LinkButton href="/projects/new">New project</LinkButton> : null}
      </div>
      {projects.length === 0 ? <EmptyState title="No projects" description="Create a project to start organizing work." /> : null}
      <div className="grid gap-4">
        {projects.map((project) => {
          const done = project.tasks.filter((task) => task.status === "DONE").length;
          return (
            <Card key={project.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Link className="text-xl font-semibold text-white hover:text-sky-300" href={`/projects/${project.id}`}>{project.name}</Link>
                    <Badge tone={project.status === "COMPLETED" ? "green" : project.status === "ON_HOLD" ? "yellow" : "blue"}>{enumLabel(project.status)}</Badge>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">{project.description}</p>
                  <p className="mt-3 text-xs text-slate-500">Owner {project.owner.name} · {formatDate(project.startDate)} to {formatDate(project.endDate)}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:w-96">
                  <Mini label="Members" value={project.members.length} />
                  <Mini label="Tasks" value={project.tasks.length} />
                  <Mini label="Complete" value={`${percent(done, project.tasks.length)}%`} />
                </div>
              </div>
              {user.role !== Role.MEMBER ? (
                <div className="mt-4 flex gap-2">
                  <LinkButton className="bg-slate-800 text-white hover:bg-slate-700" href={`/projects/${project.id}/edit`}>Edit</LinkButton>
                  <form action={deleteProject}><input name="id" type="hidden" value={project.id} /><Button type="submit" variant="danger">Delete</Button></form>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-md bg-slate-950 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-white">{value}</p></div>;
}
