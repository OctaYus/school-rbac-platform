import Link from "next/link";
import type { Role } from "@prisma/client";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemePicker } from "@/components/theme-picker";
import { MobileNav } from "@/components/app/mobile-nav";
import { UserMenu } from "@/components/app/user-menu";

export function Topbar({ user }: { user: { name: string; email: string; role: Role } }) {
  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <MobileNav role={user.role} />
        <Link href="/dashboard" className="md:hidden">
          <Logo />
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <ThemePicker />
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
