import Link from "next/link";
import { format } from "date-fns";

import { requireCapability } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { listAudit } from "@/lib/data/admin";
import { auditQuerySchema } from "@/lib/validation/admin";
import { PageHeader } from "@/components/app/page-header";
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

export const metadata = { title: "Audit log · Scholaris" };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireCapability(Capability.AUDIT_VIEW);
  const sp = await searchParams;
  const query = auditQuerySchema.parse(sp);
  const { rows, total, page, pages } = await listAudit(query);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query.entity) params.set("entity", query.entity);
    if (query.action) params.set("action", query.action);
    params.set("page", String(p));
    return `/admin/audit?${params.toString()}`;
  };

  return (
    <>
      <PageHeader title="Audit log" description={`${total} events (append-only)`} />

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <Input
          name="action"
          defaultValue={query.action ?? ""}
          placeholder="Filter action (e.g. student.update)"
          className="max-w-xs"
        />
        <Input
          name="entity"
          defaultValue={query.entity ?? ""}
          placeholder="Entity (e.g. Student)"
          className="max-w-[12rem]"
        />
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  No audit events.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {format(a.createdAt, "PPp")}
                  </TableCell>
                  <TableCell className="text-sm">{a.actor.name}</TableCell>
                  <TableCell className="font-mono text-xs">{a.action}</TableCell>
                  <TableCell className="text-sm">
                    {a.entity}
                    <span className="text-muted-foreground"> · {a.entityId.slice(0, 8)}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{a.ip ?? "—"}</TableCell>
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
            <Link href={pageHref(Math.max(1, page - 1))}>Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={page >= pages}>
            <Link href={pageHref(Math.min(pages, page + 1))}>Next</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
