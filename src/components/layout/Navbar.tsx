import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { isAdmin } from "@/lib/permissions";
import { listUsers } from "@/services/user.service";
import UserSwitcher from "@/components/layout/UserSwitcher";

export default async function Navbar() {
  const [users, current] = await Promise.all([listUsers(), getCurrentUser()]);

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/resources", label: "Resources" },
    { href: "/reservations", label: "Reservations" },
   ...(current && isAdmin(current)
  ? [
      { href: "/categories", label: "Categories" },
      { href: "/users", label: "Users" },
    ]
  : []),
  ];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex items-center gap-5">
          <Link href="/" className="font-semibold text-slate-900">
            Resource Reservation
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <UserSwitcher
          currentId={current?.id ?? null}
          users={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
        />
      </div>
    </header>
  );
}
