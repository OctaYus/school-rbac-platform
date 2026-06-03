"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { Role } from "@prisma/client";

import { can } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/app/nav-items";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="mb-6">
          <Logo />
        </SheetTitle>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.filter((item) => !item.capability || can(role, item.capability)).map(
            (item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </SheetClose>
              );
            },
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
