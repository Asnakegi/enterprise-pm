import { Role } from "@prisma/client";
import { createUser, updateUserRole } from "@/app/(app)/actions";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  await requireRole([Role.ADMIN]);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="grid gap-6">
      <div><h1 className="text-3xl font-bold text-white">User management</h1><p className="mt-1 text-slate-400">Create users and control workspace roles.</p></div>
      <Card>
        <h2 className="text-lg font-semibold text-white">Create user</h2>
        <form action={createUser} className="mt-4 grid gap-3 md:grid-cols-5">
          <Label title="Name"><Input name="name" required /></Label>
          <Label title="Email"><Input name="email" type="email" required /></Label>
          <Label title="Password"><Input minLength={8} name="password" type="password" required /></Label>
          <Label title="Role"><Select name="role">{Object.values(Role).map((role) => <option key={role} value={role}>{role}</option>)}</Select></Label>
          <div className="flex items-end"><Button type="submit">Create</Button></div>
        </form>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr><th className="p-3">User</th><th>Email</th><th>Role</th><th>Created</th><th>Change role</th></tr></thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="p-3 font-semibold text-white">{user.name}</td>
                <td>{user.email}</td>
                <td><Badge tone={user.role === "ADMIN" ? "red" : user.role === "MANAGER" ? "blue" : "green"}>{user.role}</Badge></td>
                <td>{user.createdAt.toLocaleDateString()}</td>
                <td>
                  <form action={updateUserRole} className="flex gap-2">
                    <input name="userId" type="hidden" value={user.id} />
                    <Select className="w-36" defaultValue={user.role} name="role">{Object.values(Role).map((role) => <option key={role} value={role}>{role}</option>)}</Select>
                    <Button type="submit" variant="secondary">Save</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
