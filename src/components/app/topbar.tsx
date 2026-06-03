import Link from "next/link";
import { GraduationCap } from "lucide-react";
import type { Role } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/app/sign-out-button";
import { MobileNav } from "@/components/app/mobile-nav";

export function Topbar({ user }: { user: { name: string; email: string; role: Role } }) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <MobileNav role={user.role} />
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold md:hidden">
          <GraduationCap className="size-5" />
          School
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right text-sm leading-tight sm:block">
          <div className="font-medium">{user.name}</div>
          <div className="text-muted-foreground text-xs">{user.email}</div>
        </div>
        <Badge variant="secondary">{user.role}</Badge>
        <SignOutButton />
      </div>
    </header>
  );
}
