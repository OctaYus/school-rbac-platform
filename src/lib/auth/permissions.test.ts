import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";

import { Capability, can, canAssignRole } from "@/lib/auth/permissions";

describe("capability matrix", () => {
  it("lets only OWNER/MANAGER manage users and view audit", () => {
    for (const cap of [Capability.USER_MANAGE, Capability.AUDIT_VIEW, Capability.SETTINGS_MANAGE]) {
      expect(can(Role.OWNER, cap)).toBe(true);
      expect(can(Role.MANAGER, cap)).toBe(true);
      expect(can(Role.SUPERVISOR, cap)).toBe(false);
      expect(can(Role.TEACHER, cap)).toBe(false);
    }
  });

  it("lets all roles create/edit students and write records", () => {
    for (const role of [Role.OWNER, Role.MANAGER, Role.SUPERVISOR, Role.TEACHER]) {
      expect(can(role, Capability.STUDENT_WRITE)).toBe(true);
      expect(can(role, Capability.STUDENT_RECORDS_WRITE)).toBe(true);
      expect(can(role, Capability.HEALTH_WRITE)).toBe(true);
      expect(can(role, Capability.SESSION_MARK)).toBe(true);
    }
  });

  it("restricts session assignment and view-all to staff (not TEACHER)", () => {
    for (const cap of [
      Capability.SESSION_ASSIGN,
      Capability.SESSION_TEMPLATE_CREATE,
      Capability.STUDENT_VIEW_ALL,
      Capability.CALENDAR_VIEW_ANY,
    ]) {
      expect(can(Role.SUPERVISOR, cap)).toBe(true);
      expect(can(Role.TEACHER, cap)).toBe(false);
    }
  });
});

describe("canAssignRole", () => {
  it("lets OWNER assign any role", () => {
    for (const target of [Role.OWNER, Role.MANAGER, Role.SUPERVISOR, Role.TEACHER]) {
      expect(canAssignRole(Role.OWNER, target)).toBe(true);
    }
  });

  it("lets MANAGER assign anything except OWNER", () => {
    expect(canAssignRole(Role.MANAGER, Role.OWNER)).toBe(false);
    expect(canAssignRole(Role.MANAGER, Role.MANAGER)).toBe(true);
    expect(canAssignRole(Role.MANAGER, Role.TEACHER)).toBe(true);
  });

  it("forbids SUPERVISOR and TEACHER from assigning roles", () => {
    for (const actor of [Role.SUPERVISOR, Role.TEACHER]) {
      for (const target of [Role.OWNER, Role.MANAGER, Role.SUPERVISOR, Role.TEACHER]) {
        expect(canAssignRole(actor, target)).toBe(false);
      }
    }
  });
});
