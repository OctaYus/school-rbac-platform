import { format } from "date-fns";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { studentScopeWhere } from "@/lib/db/scope";
import { csvCell } from "@/lib/security/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Export the caller's (role-scoped) students as CSV. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const students = await prisma.student.findMany({
    where: studentScopeWhere(user),
    orderBy: { fullName: "asc" },
    select: {
      fullName: true,
      externalId: true,
      status: true,
      createdAt: true,
      _count: { select: { marks: true, healthRecords: true } },
    },
  });

  const header = ["Name", "External ID", "Status", "Marks", "Health records", "Created"];
  const lines = students.map((s) =>
    [
      csvCell(s.fullName),
      csvCell(s.externalId ?? ""),
      csvCell(s.status),
      String(s._count.marks),
      String(s._count.healthRecords),
      csvCell(format(s.createdAt, "yyyy-MM-dd")),
    ].join(","),
  );
  const csv = [header.join(","), ...lines].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
