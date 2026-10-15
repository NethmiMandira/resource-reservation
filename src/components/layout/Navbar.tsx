import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { isAdmin } from "@/lib/permissions";
import { listUsers } from "@/services/user.service";
import NavLinks from "@/components/layout/NavLinks";
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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        {/* Left Section: Brand & Nav Tabs */}
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 transition-colors hover:border-slate-300"
          >
            <span className="h-2 w-2 rounded-full bg-slate-900" aria-hidden="true" />
            <span className="text-sm font-bold tracking-tight text-slate-900">
              Resource Reservation
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-5">
            <NavLinks links={links} />
          </nav>
        </div>

        {/* Right Section: User Switcher */}
        <UserSwitcher
          currentId={current?.id ?? null}
          users={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
        />
      </div>
    </header>
  );
}