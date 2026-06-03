"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

import { can } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/app/nav-items";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar hidden w-60 shrink-0 border-r md:block">
      <div className="flex h-14 items-center border-b px-5">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.filter((item) => !item.capability || can(role, item.capability)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
