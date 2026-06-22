import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const [task, projects, users] = await Promise.all([
    prisma.task.findUnique({ where: { id } }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!task) notFound();
  return (
    <div className="grid gap-6">
      <div><h1 className="text-3xl font-bold text-white">Edit task</h1><p className="mt-1 text-slate-400">{task.title}</p></div>
      <TaskForm task={task} projects={projects} users={users} />
    </div>
  );
}
