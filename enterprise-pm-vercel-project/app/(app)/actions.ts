"use server";

import { AuditAction, Role, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageProject, requireRole, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectSchema, roleSchema, taskSchema, userSchema } from "@/lib/schemas";

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function audit(action: AuditAction, message: string, userId?: string, projectId?: string, taskId?: string, metadata?: object) {
  await prisma.auditLog.create({
    data: { action, message, userId, projectId, taskId, metadata },
  });
}

export async function createProject(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.MANAGER]);
  const memberIds = formData.getAll("memberIds").map(String);
  const parsed = projectSchema.safeParse({ ...values(formData), memberIds });
  if (!parsed.success) throw new Error("Project information is invalid.");

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      status: parsed.data.status,
      ownerId: parsed.data.ownerId,
      members: {
        create: [...new Set([parsed.data.ownerId, ...memberIds])].map((memberId) => ({
          userId: memberId,
        })),
      },
    },
  });
  await audit(AuditAction.PROJECT_CREATED, `Project created: ${project.name}`, user.id, project.id);
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.MANAGER]);
  const memberIds = formData.getAll("memberIds").map(String);
  const parsed = projectSchema.safeParse({ ...values(formData), memberIds });
  if (!parsed.success || !parsed.data.id) throw new Error("Project information is invalid.");

  const existing = await prisma.project.findUnique({ where: { id: parsed.data.id } });
  if (!existing) throw new Error("Project not found.");
  if (user.role !== Role.ADMIN && existing.ownerId !== user.id) throw new Error("You cannot edit this project.");

  await prisma.project.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      status: parsed.data.status,
      ownerId: parsed.data.ownerId,
      members: {
        deleteMany: {},
        create: [...new Set([parsed.data.ownerId, ...memberIds])].map((memberId) => ({ userId: memberId })),
      },
    },
  });
  await audit(AuditAction.PROJECT_UPDATED, `Project updated: ${parsed.data.name}`, user.id, parsed.data.id);
  revalidatePath("/projects");
  redirect(`/projects/${parsed.data.id}`);
}

export async function deleteProject(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.MANAGER]);
  const id = String(formData.get("id") ?? "");
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return;
  if (user.role !== Role.ADMIN && project.ownerId !== user.id) return;

  await prisma.project.delete({ where: { id } });
  await audit(AuditAction.PROJECT_UPDATED, `Project deleted: ${project.name}`, user.id, id);
  revalidatePath("/projects");
  redirect("/projects");
}

export async function createTask(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.MANAGER]);
  const parsed = taskSchema.safeParse(values(formData));
  if (!parsed.success) throw new Error("Task information is invalid.");

  const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project) throw new Error("Project not found.");
  if (user.role !== Role.ADMIN && project.ownerId !== user.id) throw new Error("You cannot create tasks for this project.");

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      projectId: parsed.data.projectId,
      assigneeId: parsed.data.assigneeId || null,
      priority: parsed.data.priority,
      status: parsed.data.status,
      dueDate: parsed.data.dueDate,
    },
  });
  await audit(AuditAction.TASK_CREATED, `Task created: ${task.title}`, user.id, task.projectId, task.id);
  if (task.assigneeId) {
    await audit(AuditAction.TASK_ASSIGNED, `Task assigned: ${task.title}`, user.id, task.projectId, task.id, { assigneeId: task.assigneeId });
  }
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}`);
  redirect("/tasks");
}

export async function updateTask(formData: FormData) {
  const user = await requireUser();
  const parsed = taskSchema.safeParse(values(formData));
  if (!parsed.success || !parsed.data.id) throw new Error("Task information is invalid.");

  const existing = await prisma.task.findUnique({ where: { id: parsed.data.id }, include: { project: true } });
  if (!existing) throw new Error("Task not found.");
  const canEdit = user.role === Role.ADMIN || (user.role === Role.MANAGER && existing.project.ownerId === user.id);
  const memberStatusOnly = user.role === Role.MEMBER && existing.assigneeId === user.id;
  if (!canEdit && !memberStatusOnly) throw new Error("You cannot edit this task.");

  await prisma.task.update({
    where: { id: parsed.data.id },
    data: canEdit
      ? {
          title: parsed.data.title,
          description: parsed.data.description,
          projectId: parsed.data.projectId,
          assigneeId: parsed.data.assigneeId || null,
          priority: parsed.data.priority,
          status: parsed.data.status,
          dueDate: parsed.data.dueDate,
        }
      : { status: parsed.data.status },
  });
  if (existing.status !== parsed.data.status) {
    await audit(AuditAction.TASK_STATUS_CHANGED, `Task status changed: ${existing.title}`, user.id, existing.projectId, existing.id, {
      from: existing.status,
      to: parsed.data.status,
    });
  }
  if (canEdit && existing.assigneeId !== (parsed.data.assigneeId || null)) {
    await audit(AuditAction.TASK_ASSIGNED, `Task reassigned: ${existing.title}`, user.id, existing.projectId, existing.id, {
      assigneeId: parsed.data.assigneeId,
    });
  }
  revalidatePath("/tasks");
  revalidatePath(`/projects/${existing.projectId}`);
  redirect("/tasks");
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
  if (!task) return { error: "Task not found." };

  const allowed =
    user.role === Role.ADMIN ||
    (user.role === Role.MANAGER && task.project.ownerId === user.id) ||
    task.assigneeId === user.id;
  if (!allowed) return { error: "You cannot update this task." };

  await prisma.task.update({ where: { id: taskId }, data: { status } });
  await audit(AuditAction.TASK_STATUS_CHANGED, `Task status changed: ${task.title}`, user.id, task.projectId, task.id, {
    from: task.status,
    to: status,
  });
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/tasks");
  return { ok: true };
}

export async function deleteTask(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.MANAGER]);
  const id = String(formData.get("id") ?? "");
  const task = await prisma.task.findUnique({ where: { id }, include: { project: true } });
  if (!task) return;
  if (user.role !== Role.ADMIN && task.project.ownerId !== user.id) return;

  await prisma.task.delete({ where: { id } });
  await audit(AuditAction.PROJECT_UPDATED, `Task deleted: ${task.title}`, user.id, task.projectId, task.id);
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}`);
}

export async function createUser(formData: FormData) {
  const actor = await requireRole([Role.ADMIN]);
  const parsed = userSchema.safeParse(values(formData));
  if (!parsed.success) throw new Error("User information is invalid.");

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    },
  });
  await audit(AuditAction.USER_ROLE_CHANGED, `User created with role ${user.role}: ${user.email}`, actor.id, undefined, undefined, {
    targetUserId: user.id,
  });
  revalidatePath("/admin/users");
}

export async function updateUserRole(formData: FormData) {
  const actor = await requireRole([Role.ADMIN]);
  const parsed = roleSchema.safeParse(values(formData));
  if (!parsed.success) throw new Error("Role update is invalid.");

  const user = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  await audit(AuditAction.USER_ROLE_CHANGED, `User role changed: ${user.email} is now ${user.role}`, actor.id, undefined, undefined, {
    targetUserId: user.id,
  });
  revalidatePath("/admin/users");
}
