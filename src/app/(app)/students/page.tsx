import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { StudentStatus } from "@prisma/client";

import { requireUser } from "@/lib/auth/guards";
import { listStudents } from "@/lib/data/students";
import { studentListQuerySchema } from "@/lib/validation/student";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudentsTable } from "@/components/students/students-table";

export const metadata = { title: "Students · Scholaris" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const query = studentListQuerySchema.parse(sp);
  const { rows, total, page, pages } = await listStudents(user, query);

  const tableRows = rows.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    externalId: s.externalId,
    status: s.status,
    marksCount: s._count.marks,
    healthCount: s._count.healthRecords,
  }));

  const makeHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.status) params.set("status", query.status);
    params.set("page", String(query.page));
    for (const [k, v] of Object.entries(overrides)) params.set(k, String(v));
    return `/students?${params.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Students"
        description={user.role === "TEACHER" ? "Students assigned to you" : `${total} students`}
      >
        <Button asChild variant="outline">
          <a href="/api/students/export">
            <Download className="size-4" /> Export
          </a>
        </Button>
        <Button asChild>
          <Link href="/students/new">
            <Plus className="size-4" /> New student
          </Link>
        </Button>
      </PageHeader>

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search by name…"
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={query.status ?? ""}
          className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="">All statuses</option>
          {Object.values(StudentStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <StudentsTable rows={tableRows} />

      <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
        <span>
          Page {page} of {pages}
        </span>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" disabled={page <= 1}>
            <Link href={makeHref({ page: Math.max(1, page - 1) })}>Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={page >= pages}>
            <Link href={makeHref({ page: Math.min(pages, page + 1) })}>Next</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
