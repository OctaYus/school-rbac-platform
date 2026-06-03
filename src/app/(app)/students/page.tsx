import Link from "next/link";
import { Plus } from "lucide-react";
import { StudentStatus } from "@prisma/client";

import { requireUser } from "@/lib/auth/guards";
import { listStudents } from "@/lib/data/students";
import { studentListQuerySchema } from "@/lib/validation/student";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Students · School RBAC Platform" };

const STATUS_VARIANT: Record<StudentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  GRADUATED: "outline",
  SUSPENDED: "destructive",
  ARCHIVED: "secondary",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const query = studentListQuerySchema.parse(sp);
  const { rows, total, page, pages } = await listStudents(user, query);

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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>External ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Records</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <Link href={`/students/${s.id}`} className="hover:underline">
                      {s.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.externalId ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {s._count.marks} marks · {s._count.healthRecords} health
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
