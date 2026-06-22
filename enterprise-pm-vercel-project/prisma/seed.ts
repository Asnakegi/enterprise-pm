import { PrismaClient, ProjectStatus, Role, TaskPriority, TaskStatus, AuditAction } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 12);
  const admin = await prisma.user.create({
    data: { name: "Avery Admin", email: "admin@example.com", passwordHash, role: Role.ADMIN },
  });
  const manager = await prisma.user.create({
    data: { name: "Maya Manager", email: "manager@example.com", passwordHash, role: Role.MANAGER },
  });
  const member = await prisma.user.create({
    data: { name: "Miles Member", email: "member@example.com", passwordHash, role: Role.MEMBER },
  });
  const analyst = await prisma.user.create({
    data: { name: "Nora Analyst", email: "analyst@example.com", passwordHash, role: Role.MEMBER },
  });

  const platform = await prisma.project.create({
    data: {
      name: "Platform Modernization",
      description: "Upgrade the internal delivery platform with improved observability, access control, and reporting.",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-08-30"),
      status: ProjectStatus.ACTIVE,
      ownerId: manager.id,
      members: { create: [{ userId: manager.id }, { userId: member.id }, { userId: analyst.id }] },
    },
  });

  const compliance = await prisma.project.create({
    data: {
      name: "Compliance Readiness",
      description: "Prepare operational evidence, task ownership, and executive reporting for quarterly review.",
      startDate: new Date("2026-06-10"),
      endDate: new Date("2026-07-20"),
      status: ProjectStatus.PLANNED,
      ownerId: admin.id,
      members: { create: [{ userId: admin.id }, { userId: manager.id }, { userId: analyst.id }] },
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Map current deployment workflow",
        description: "Document handoffs, approval points, and environment constraints.",
        projectId: platform.id,
        assigneeId: member.id,
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date("2026-06-25"),
      },
      {
        title: "Design RBAC policy matrix",
        description: "Define admin, manager, and member boundaries for project and task operations.",
        projectId: platform.id,
        assigneeId: analyst.id,
        priority: TaskPriority.CRITICAL,
        status: TaskStatus.REVIEW,
        dueDate: new Date("2026-06-22"),
      },
      {
        title: "Prepare audit evidence checklist",
        description: "Create the evidence list for project activity, role changes, and task assignment history.",
        projectId: compliance.id,
        assigneeId: analyst.id,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date("2026-07-03"),
      },
      {
        title: "Publish executive progress summary",
        description: "Summarize completion, overdue risk, and team workload.",
        projectId: compliance.id,
        assigneeId: manager.id,
        priority: TaskPriority.LOW,
        status: TaskStatus.DONE,
        dueDate: new Date("2026-06-18"),
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { action: AuditAction.PROJECT_CREATED, message: `Project created: ${platform.name}`, userId: manager.id, projectId: platform.id },
      { action: AuditAction.PROJECT_CREATED, message: `Project created: ${compliance.name}`, userId: admin.id, projectId: compliance.id },
      { action: AuditAction.TASK_CREATED, message: "Seed tasks created", userId: admin.id },
      { action: AuditAction.USER_ROLE_CHANGED, message: "Seed users created with role assignments", userId: admin.id },
    ],
  });

  console.log("Seed complete");
  console.table([
    { email: admin.email, password: "Password123!", role: admin.role },
    { email: manager.email, password: "Password123!", role: manager.role },
    { email: member.email, password: "Password123!", role: member.role },
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
