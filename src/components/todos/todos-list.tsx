"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import { CalendarDays, Loader2, Plus, Trash2 } from "lucide-react";
import { TodoPriority, TodoStatus } from "@prisma/client";

import {
  clearCompletedTodos,
  createTodo,
  deleteTodo,
  setTodoStatus,
  updateTodo,
} from "@/app/(app)/todos/actions";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface TodoItem {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null; // ISO
  status: TodoStatus;
  priority: TodoPriority;
}

const COLUMNS: { key: TodoStatus; labelKey: TranslationKey; dot: string }[] = [
  { key: TodoStatus.TODO, labelKey: "todos.colTODO", dot: "bg-zinc-400" },
  { key: TodoStatus.IN_PROGRESS, labelKey: "todos.colIN_PROGRESS", dot: "bg-amber-500" },
  { key: TodoStatus.DONE, labelKey: "todos.colDONE", dot: "bg-emerald-500" },
];

const PRIORITY: Record<TodoPriority, { labelKey: TranslationKey; cls: string } | null> = {
  NONE: null,
  LOW: {
    labelKey: "todos.prLOW",
    cls: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  },
  MEDIUM: {
    labelKey: "todos.prMEDIUM",
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  HIGH: {
    labelKey: "todos.prHIGH",
    cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  },
};

const PRIORITY_RANK: Record<TodoPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3 };

export function TodosList({ todos }: { todos: TodoItem[] }) {
  const router = useRouter();
  const { t } = useT();
  const [dragOver, setDragOver] = useState<TodoStatus | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [addingCol, setAddingCol] = useState<TodoStatus | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState<TodoItem | null>(null);

  const doneCount = todos.filter((t) => t.status === TodoStatus.DONE).length;

  async function moveTo(id: string, status: TodoStatus) {
    const t = todos.find((x) => x.id === id);
    if (!t || t.status === status) return;
    await setTodoStatus({ id, status });
    router.refresh();
  }

  async function addTo(status: TodoStatus) {
    if (!newTitle.trim()) {
      setAddingCol(null);
      return;
    }
    const title = newTitle;
    setNewTitle("");
    setAddingCol(null);
    await createTodo({ title, status });
    router.refresh();
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = todos
            .filter((t) => t.status === col.key)
            .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.key);
              }}
              onDragLeave={() => setDragOver((c) => (c === col.key ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                setDragOver(null);
                setDragId(null);
                if (id) moveTo(id, col.key);
              }}
              className={cn(
                "bg-muted/30 flex flex-col gap-2 rounded-xl border p-3 transition-colors",
                dragOver === col.key && "border-primary bg-primary/5 ring-primary/30 ring-2",
              )}
            >
              <div className="flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span className={cn("size-2 rounded-full", col.dot)} />
                  {t(col.labelKey)}
                  <span className="text-muted-foreground font-normal">{items.length}</span>
                </h2>
                {col.key === TodoStatus.DONE && doneCount > 0 && (
                  <button
                    onClick={async () => {
                      await clearCompletedTodos();
                      router.refresh();
                    }}
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    {t("todos.clear")}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {items.map((todo) => {
                  const overdue =
                    todo.dueDate &&
                    todo.status !== TodoStatus.DONE &&
                    isPast(new Date(todo.dueDate));
                  const pr = PRIORITY[todo.priority];
                  return (
                    <div
                      key={todo.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", todo.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(todo.id);
                      }}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => setEditing(todo)}
                      className={cn(
                        "bg-card cursor-pointer rounded-lg border p-3 shadow-sm transition hover:shadow-md",
                        dragId === todo.id && "opacity-50",
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-medium",
                          todo.status === TodoStatus.DONE && "text-muted-foreground line-through",
                        )}
                      >
                        {todo.title}
                      </p>
                      {(pr || todo.dueDate) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {pr && (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[11px] font-medium",
                                pr.cls,
                              )}
                            >
                              {t(pr.labelKey)}
                            </span>
                          )}
                          {todo.dueDate && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-[11px]",
                                overdue ? "text-rose-500" : "text-muted-foreground",
                              )}
                            >
                              <CalendarDays className="size-3" />
                              {format(new Date(todo.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {addingCol === col.key ? (
                  <Input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => addTo(col.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTo(col.key);
                      if (e.key === "Escape") {
                        setAddingCol(null);
                        setNewTitle("");
                      }
                    }}
                    placeholder={t("todos.taskTitlePlaceholder")}
                    className="h-9"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setAddingCol(col.key);
                      setNewTitle("");
                    }}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors"
                  >
                    <Plus className="size-4" /> {t("common.new")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EditTodoDialog
        todo={editing}
        onClose={() => setEditing(null)}
        onChanged={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </>
  );
}

function EditTodoDialog({
  todo,
  onClose,
  onChanged,
}: {
  todo: TodoItem | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-mount fields per task via key so inputs reset to the opened todo.
  if (!todo) return null;

  return (
    <Dialog open={todo !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("todos.editTask")}</DialogTitle>
        </DialogHeader>
        <Fields
          key={todo.id}
          todo={todo}
          busy={busy}
          error={error}
          onDelete={async () => {
            setBusy(true);
            await deleteTodo({ id: todo.id });
            setBusy(false);
            onChanged();
          }}
          onSave={async (values) => {
            setBusy(true);
            setError(null);
            const res = await updateTodo({ id: todo.id, ...values });
            setBusy(false);
            if (res.ok) onChanged();
            else setError(res.error);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function Fields({
  todo,
  busy,
  error,
  onSave,
  onDelete,
}: {
  todo: TodoItem;
  busy: boolean;
  error: string | null;
  onSave: (v: {
    title: string;
    notes: string;
    dueDate: string;
    status: TodoStatus;
    priority: TodoPriority;
  }) => void;
  onDelete: () => void;
}) {
  const { t } = useT();
  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes ?? "");
  const [dueDate, setDueDate] = useState(
    todo.dueDate ? format(new Date(todo.dueDate), "yyyy-MM-dd") : "",
  );
  const [status, setStatus] = useState<TodoStatus>(todo.status);
  const [priority, setPriority] = useState<TodoPriority>(todo.priority);

  return (
    <div className="space-y-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="t-title">{t("todos.fieldTitle")}</Label>
        <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="t-notes">{t("todos.description")}</Label>
        <Textarea
          id="t-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("todos.addDetails")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="t-status">{t("todos.statusLabel")}</Label>
          <select
            id="t-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TodoStatus)}
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="TODO">{t("todos.colTODO")}</option>
            <option value="IN_PROGRESS">{t("todos.colIN_PROGRESS")}</option>
            <option value="DONE">{t("todos.colDONE")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-priority">{t("todos.priority")}</Label>
          <select
            id="t-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoPriority)}
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="NONE">{t("todos.prNONE")}</option>
            <option value="LOW">{t("todos.prLOW")}</option>
            <option value="MEDIUM">{t("todos.prMEDIUM")}</option>
            <option value="HIGH">{t("todos.prHIGH")}</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="t-due">{t("todos.dueDate")}</Label>
        <Input
          id="t-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" className="text-destructive" onClick={onDelete} disabled={busy}>
          <Trash2 className="size-4" /> {t("common.delete")}
        </Button>
        <Button
          onClick={() => onSave({ title, notes, dueDate, status, priority })}
          disabled={busy || !title.trim()}
        >
          {busy && <Loader2 className="animate-spin" />}
          {t("common.save")}
        </Button>
      </DialogFooter>
    </div>
  );
}
