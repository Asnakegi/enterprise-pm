import { Role } from "@prisma/client";
import { TaskForm } from "@/components/task-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewTaskPage() {
  await requireRole([Role.ADMIN, Role.MANAGER]);
  const [projects, users] = await Promise.all([
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="grid gap-6">
      <div><h1 className="text-3xl font-bold text-white">New task</h1><p className="mt-1 text-slate-400">Assign work to a project member.</p></div>
      <TaskForm projects={projects} users={users} />
    </div>
  );
}
