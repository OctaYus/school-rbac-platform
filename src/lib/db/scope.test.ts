import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";

import { sessionScopeWhere, studentRelatedScopeWhere, studentScopeWhere } from "@/lib/db/scope";

const teacher = { id: "teacher-1", role: Role.TEACHER };
const supervisor = { id: "sup-1", role: Role.SUPERVISOR };
const owner = { id: "owner-1", role: Role.OWNER };

describe("row-level scope (layer 3)", () => {
  it("scopes a teacher's student queries to their assignments", () => {
    expect(studentScopeWhere(teacher)).toEqual({
      assignments: { some: { teacherId: "teacher-1" } },
    });
  });

  it("scopes a teacher's session queries to their own sessions", () => {
    expect(sessionScopeWhere(teacher)).toEqual({ teacherId: "teacher-1" });
  });

  it("scopes a teacher's mark/health queries via the student relation", () => {
    expect(studentRelatedScopeWhere(teacher)).toEqual({
      student: { assignments: { some: { teacherId: "teacher-1" } } },
    });
  });

  it("gives non-teacher staff an unrestricted scope", () => {
    for (const u of [supervisor, owner]) {
      expect(studentScopeWhere(u)).toEqual({});
      expect(sessionScopeWhere(u)).toEqual({});
      expect(studentRelatedScopeWhere(u)).toEqual({});
    }
  });
});
