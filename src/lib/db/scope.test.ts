import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";

import { sessionScopeWhere, studentRelatedScopeWhere, studentScopeWhere } from "@/lib/db/scope";

const ORG = "org-1";
const teacher = { id: "teacher-1", role: Role.TEACHER, organizationId: ORG };
const supervisor = { id: "sup-1", role: Role.SUPERVISOR, organizationId: ORG };
const owner = { id: "owner-1", role: Role.OWNER, organizationId: ORG };

describe("row-level scope (layer 3)", () => {
  it("scopes a teacher to their org + assigned students", () => {
    expect(studentScopeWhere(teacher)).toEqual({
      organizationId: ORG,
      assignments: { some: { teacherId: "teacher-1" } },
    });
  });

  it("scopes a teacher's sessions to their org + own sessions", () => {
    expect(sessionScopeWhere(teacher)).toEqual({ organizationId: ORG, teacherId: "teacher-1" });
  });

  it("scopes a teacher's mark/health queries via the student relation", () => {
    expect(studentRelatedScopeWhere(teacher)).toEqual({
      student: { organizationId: ORG, assignments: { some: { teacherId: "teacher-1" } } },
    });
  });

  it("scopes non-teacher staff to their org only (no assignment filter)", () => {
    for (const u of [supervisor, owner]) {
      expect(studentScopeWhere(u)).toEqual({ organizationId: ORG });
      expect(sessionScopeWhere(u)).toEqual({ organizationId: ORG });
      expect(studentRelatedScopeWhere(u)).toEqual({ student: { organizationId: ORG } });
    }
  });
});
