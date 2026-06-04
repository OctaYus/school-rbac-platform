"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { clearCompletedTodos, createTodo, deleteTodo, toggleTodo } from "@/app/(app)/todos/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TodoItem {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null; // ISO
  completed: boolean;
}

export function TodosList({ todos }: { todos: TodoItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

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

  async function onToggle(id: string, completed: boolean) {
    setBusyId(id);
    await toggleTodo({ id, completed });
    setBusyId(null);
    router.refresh();
  }

  async function onDelete(id: string) {
    setBusyId(id);
    await deleteTodo({ id });
    setBusyId(null);
    router.refresh();
  }

  function Row({ t }: { t: TodoItem }) {
    const overdue = t.dueDate && !t.completed && isPast(new Date(t.dueDate));
    return (
      <li className="hover:bg-muted/40 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors">
        <input
          type="checkbox"
          checked={t.completed}
          onChange={() => onToggle(t.id, !t.completed)}
          disabled={busyId === t.id}
          aria-label={t.completed ? "Mark as not done" : "Mark as done"}
          className="border-input size-4 cursor-pointer rounded border accent-[var(--primary)]"
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn("truncate text-sm", t.completed && "text-muted-foreground line-through")}
          >
            {t.title}
          </p>
          {t.dueDate && (
            <p className={cn("text-xs", overdue ? "text-rose-500" : "text-muted-foreground")}>
              Due {format(new Date(t.dueDate), "MMM d, yyyy")}
              {overdue ? " · overdue" : ""}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete task"
          onClick={() => onDelete(t.id)}
          disabled={busyId === t.id}
        >
          {busyId === t.id ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="text-muted-foreground hover:text-destructive size-4" />
          )}
        </Button>
      </li>
    );
  }

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
          Add
        </Button>
      </form>
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div>
        <h2 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
          To do ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">Nothing to do. Nice. 🎉</p>
        ) : (
          <ul className="-mx-2">
            {pending.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </ul>
        )}
      </div>

      {completed.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Completed ({completed.length})
            </h2>
            <button
              onClick={async () => {
                await clearCompletedTodos();
                router.refresh();
              }}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Clear completed
            </button>
          </div>
          <ul className="-mx-2">
            {completed.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
