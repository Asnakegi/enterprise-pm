"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/schemas";

export async function registerAction(_prevState: { error: string } | null, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please provide a valid name, email, and password." };
  }

  const limited = rateLimit(`register:${parsed.data.email}`, 3, 60_000);
  if (!limited.ok) {
    return { error: "Too many attempts. Try again in a minute." };
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (exists) {
    return { error: "An account already exists for this email." };
  }

  const userCount = await prisma.user.count();

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: userCount === 0 ? "ADMIN" : "MEMBER",
    },
  });

  redirect("/login");
}
