"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Loader2, X } from "lucide-react";
import { SessionStatus } from "@prisma/client";

import { markSession } from "@/app/(app)/sessions/actions";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function MarkSessionActions({ id }: { id: string }) {
  const router = useRouter();
  const { t } = useT();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");

  async function run(status: SessionStatus, scheduledAt?: string) {
    setPending(status);
    setError(null);
    const res = await markSession({ id, status, scheduledAt: scheduledAt || undefined });
    setPending(null);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {error && <span className="text-destructive text-xs">{error}</span>}
      <Button
        size="sm"
        variant="outline"
        onClick={() => run(SessionStatus.TAKEN)}
        disabled={pending !== null}
      >
        {pending === SessionStatus.TAKEN ? <Loader2 className="animate-spin" /> : <Check />}
        {t("ss.TAKEN")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => run(SessionStatus.MISSED)}
        disabled={pending !== null}
      >
        {pending === SessionStatus.MISSED ? <Loader2 className="animate-spin" /> : <X />}
        {t("ss.MISSED")}
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" disabled={pending !== null}>
            <CalendarClock /> {t("sessions.reschedule")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sessions.rescheduleTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`resched-${id}`}>{t("sessions.newDateTime")}</Label>
            <Input
              id={`resched-${id}`}
              type="datetime-local"
              value={rescheduleAt}
              onChange={(e) => setRescheduleAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                onClick={() => run(SessionStatus.RESCHEDULED, rescheduleAt)}
                disabled={!rescheduleAt}
              >
                {t("sessions.reschedule")}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
