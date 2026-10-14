"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

export default function NavLinks({ links }: { links: NavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {links.map((l) => {
        // "/" must match exactly, otherwise it would be active on every page
        const active =
          l.href === "/"
            ? pathname === "/"
            : pathname === l.href || pathname.startsWith(`${l.href}/`);

        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 py-1 text-sm transition",
              active
                ? "border-slate-900 font-medium text-slate-900"
                : "border-transparent text-slate-600 hover:text-slate-900",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}