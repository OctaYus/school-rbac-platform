"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { TodoStatus } from "@prisma/client";

import {
  clearCompletedTodos,
  createTodo,
  deleteTodo,
  setTodoStatus,
} from "@/app/(app)/todos/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface TodoItem {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null; // ISO
  status: TodoStatus;
}

const COLUMNS: { key: TodoStatus; label: string; dot: string }[] = [
  { key: TodoStatus.TODO, label: "To do", dot: "bg-zinc-400" },
  { key: TodoStatus.IN_PROGRESS, label: "In progress", dot: "bg-amber-500" },
  { key: TodoStatus.DONE, label: "Done", dot: "bg-emerald-500" },
];

const STATUS_LABEL: Record<TodoStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export function TodosList({ todos }: { todos: TodoItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    setError(null);
    const res = await createTodo({ title, dueDate: due || undefined });
    setAdding(false);
    if (res.ok) {
      setTitle("");
      setDue("");
      router.refresh();
    } else setError(res.error);
  }

  async function changeStatus(id: string, status: TodoStatus) {
    setBusyId(id);
    await setTodoStatus({ id, status });
    setBusyId(null);
    router.refresh();
  }

  async function onDelete(id: string) {
    setBusyId(id);
    await deleteTodo({ id });
    setBusyId(null);
    router.refresh();
  }

  const doneCount = todos.filter((t) => t.status === TodoStatus.DONE).length;

  return (
    <div className="space-y-6">
      <form onSubmit={onAdd} className="flex flex-wrap gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="min-w-[12rem] flex-1"
        />
        <Input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="w-auto"
          aria-label="Due date"
        />
        <Button type="submit" disabled={adding || !title.trim()}>
          {adding ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
          Add task
        </Button>
      </form>
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = todos.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-muted/30 space-y-3 rounded-xl border p-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span className={cn("size-2 rounded-full", col.dot)} />
                  {col.label}
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
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-muted-foreground px-1 py-6 text-center text-xs">No tasks.</p>
                ) : (
                  items.map((t) => {
                    const overdue =
                      t.dueDate && t.status !== TodoStatus.DONE && isPast(new Date(t.dueDate));
                    return (
                      <Card key={t.id} className="space-y-2 p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              t.status === TodoStatus.DONE && "text-muted-foreground line-through",
                            )}
                          >
                            {t.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-mt-1 -mr-1 size-7 shrink-0"
                            aria-label="Delete task"
                            onClick={() => onDelete(t.id)}
                            disabled={busyId === t.id}
                          >
                            {busyId === t.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="text-muted-foreground hover:text-destructive size-3.5" />
                            )}
                          </Button>
                        </div>
                        {t.dueDate && (
                          <p
                            className={cn(
                              "text-xs",
                              overdue ? "text-rose-500" : "text-muted-foreground",
                            )}
                          >
                            Due {format(new Date(t.dueDate), "MMM d")}
                            {overdue ? " · overdue" : ""}
                          </p>
                        )}
                        <select
                          value={t.status}
                          disabled={busyId === t.id}
                          onChange={(e) => changeStatus(t.id, e.target.value as TodoStatus)}
                          aria-label="Status"
                          className="border-input h-7 w-full rounded-md border bg-transparent px-2 text-xs"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.key} value={c.key}>
                              {STATUS_LABEL[c.key]}
                            </option>
                          ))}
                        </select>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
