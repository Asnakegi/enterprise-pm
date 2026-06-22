import { BarChart3, ClipboardList, FolderKanban, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit", label: "Audit Log", icon: ShieldCheck },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const visibleLinks = links.filter((link) => {
    if (link.href.startsWith("/admin")) return user.role === "ADMIN";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-slate-950/95 p-4 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg bg-slate-900 p-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-sky-500 font-black text-slate-950">PM</div>
          <div>
            <p className="font-semibold text-white">Enterprise PM</p>
            <p className="text-xs text-slate-400">Operations workspace</p>
          </div>
        </Link>
        <nav className="mt-6 grid gap-1">
          {visibleLinks.map((link) => (
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
              href={link.href}
              key={link.href}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={user.role === "ADMIN" ? "red" : user.role === "MANAGER" ? "blue" : "green"}>{user.role}</Badge>
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
