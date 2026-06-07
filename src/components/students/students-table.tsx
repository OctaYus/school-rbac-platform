"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import type { StudentStatus } from "@prisma/client";

import { deleteStudents } from "@/app/(app)/students/actions";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { StudentStatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface StudentRow {
  id: string;
  fullName: string;
  externalId: string | null;
  status: StudentStatus;
  marksCount: number;
  healthCount: number;
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="border-input text-primary focus-visible:ring-ring size-4 cursor-pointer rounded border accent-[var(--primary)]"
    />
  );
}

export function StudentsTable({ rows }: { rows: StudentRow[] }) {
  const router = useRouter();
  const { t } = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  async function onConfirmDelete() {
    setPending(true);
    setError(null);
    const res = await deleteStudents({ ids: Array.from(selected) });
    setPending(false);
    if (res.ok) {
      setSelected(new Set());
      router.refresh();
    } else setError(res.error);
  }

  return (
    <div className="space-y-3">
      {someSelected && (
        <div className="bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-2">
          <span className="text-sm">
            {selected.size} {t("students.nSelected")}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4" /> {t("students.deleteSelected")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("students.deleteManyTitle")}</DialogTitle>
                <DialogDescription>{t("students.deleteManyWarn")}</DialogDescription>
              </DialogHeader>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t("common.cancel")}</Button>
                </DialogClose>
                <Button variant="destructive" onClick={onConfirmDelete} disabled={pending}>
                  {pending && <Loader2 className="animate-spin" />}
                  {t("common.delete")} {selected.size}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Check checked={allSelected} onChange={toggleAll} label={t("students.selectAll")} />
              </TableHead>
              <TableHead>{t("students.colName")}</TableHead>
              <TableHead>{t("students.colExternalId")}</TableHead>
              <TableHead>{t("students.colStatus")}</TableHead>
              <TableHead className="text-right">{t("students.colRecords")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  {t("students.noneFound")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.id} data-state={selected.has(s.id) ? "selected" : undefined}>
                  <TableCell>
                    <Check
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      label={`${t("students.select")} ${s.fullName}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/students/${s.id}`} className="hover:underline">
                      {s.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.externalId ?? "—"}</TableCell>
                  <TableCell>
                    <StudentStatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {s.marksCount} {t("students.marksWord")} · {s.healthCount}{" "}
                    {t("students.healthWord")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
