import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Capability } from "@/lib/auth/permissions";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export interface NavItem {
  href: string;
  key: TranslationKey;
  icon: LucideIcon;
  capability?: Capability;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/students", key: "nav.students", icon: Users },
  { href: "/sessions", key: "nav.sessions", icon: CalendarDays },
  { href: "/todos", key: "nav.todos", icon: ListChecks },
  { href: "/admin/users", key: "nav.users", icon: UserCog, capability: Capability.USER_MANAGE },
  { href: "/admin/audit", key: "nav.audit", icon: ScrollText, capability: Capability.AUDIT_VIEW },
  {
    href: "/admin/organization",
    key: "nav.organization",
    icon: Building2,
    capability: Capability.SETTINGS_MANAGE,
  },
];
