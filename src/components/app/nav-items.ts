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

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  capability?: Capability;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/todos", label: "To-do", icon: ListChecks },
  { href: "/admin/users", label: "Users", icon: UserCog, capability: Capability.USER_MANAGE },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, capability: Capability.AUDIT_VIEW },
  {
    href: "/admin/organization",
    label: "Organization",
    icon: Building2,
    capability: Capability.SETTINGS_MANAGE,
  },
];
