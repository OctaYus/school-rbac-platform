"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import type { Role } from "@prisma/client";

import { signOutAction } from "@/app/(app)/actions";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  user,
  orgName,
}: {
  user: { name: string; email: string; role: Role };
  orgName: string;
}) {
  const { t } = useT();
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <span className="bg-primary/10 text-primary inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold">
            {initials}
          </span>
          <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="font-medium">{user.name}</div>
          <div className="text-muted-foreground text-xs font-normal">{user.email}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-primary text-xs font-medium">{user.role}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground truncate text-xs" title={orgName}>
              {orgName}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings /> {t("common.accountSettings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOutAction()}>
          <LogOut /> {t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
