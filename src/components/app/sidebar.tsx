"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import type { Role } from "@prisma/client";

import { can } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/app/nav-items";

export function Sidebar({ role, orgName }: { role: Role; orgName: string }) {
  const pathname = usePathname();
  const { t } = useT();
  const items = NAV_ITEMS.filter((item) => !item.capability || can(role, item.capability));

  return (
    <aside className="bg-sidebar hidden w-64 shrink-0 border-e md:flex md:flex-col">
      <div className="border-b px-5 py-3">
        <Link href="/dashboard" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <p className="text-muted-foreground mt-1 truncate text-xs" title={orgName}>
          {orgName}
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <p className="text-muted-foreground/70 px-3 pt-1 pb-2 text-[11px] font-semibold tracking-wider uppercase">
          {t("nav.menu")}
        </p>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground before:bg-primary before:absolute before:start-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-e-full"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
              />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/account"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/account")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          <Settings className="size-4" />
          {t("nav.account")}
        </Link>
      </div>
    </aside>
  );
}
