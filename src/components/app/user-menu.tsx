"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import type { Role } from "@prisma/client";

import { signOutAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ user }: { user: { name: string; email: string; role: Role } }) {
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
          <div className="text-primary mt-1 text-xs font-medium">{user.role}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings /> Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOutAction()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
