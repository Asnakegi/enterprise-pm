import { Role } from "@prisma/client";
import { ProjectForm } from "@/components/project-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewProjectPage() {
  await requireRole([Role.ADMIN, Role.MANAGER]);
  const users = await prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } });
  return (
    <div className="grid gap-6">
      <div><h1 className="text-3xl font-bold text-white">New project</h1><p className="mt-1 text-slate-400">Define ownership, timeline, and team membership.</p></div>
      <ProjectForm users={users} />
    </div>
  );
}
