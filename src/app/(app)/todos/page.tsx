import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TodosList } from "@/components/todos/todos-list";

export const metadata = { title: "To-do · Scholaris" };

export default async function TodosPage() {
  const user = await requireUser();
  const todos = await prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, notes: true, dueDate: true, completed: true },
  });

  return (
    <>
      <PageHeader title="To-do" description="Your personal task list." />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <TodosList
            todos={todos.map((t) => ({
              id: t.id,
              title: t.title,
              notes: t.notes,
              dueDate: t.dueDate ? t.dueDate.toISOString() : null,
              completed: t.completed,
            }))}
          />
        </CardContent>
      </Card>
    </>
  );
}
