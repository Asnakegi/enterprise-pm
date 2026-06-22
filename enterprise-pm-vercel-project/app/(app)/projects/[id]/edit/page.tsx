import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/project-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole([Role.ADMIN, Role.MANAGER]);
  const { id } = await params;
  const [project, users] = await Promise.all([
    prisma.project.findUnique({ where: { id }, include: { members: true } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
  ]);
  if (!project) notFound();
  return (
    <div className="grid gap-6">
      <div><h1 className="text-3xl font-bold text-white">Edit project</h1><p className="mt-1 text-slate-400">{project.name}</p></div>
      <ProjectForm project={project} users={users} />
    </div>
  );
}
