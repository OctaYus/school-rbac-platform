import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { TodosList } from "@/components/todos/todos-list";

export const metadata = { title: "To-do · Scholaris" };

export default async function TodosPage() {
  const user = await requireUser();
  const todos = await prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, notes: true, dueDate: true, status: true },
  });

  return (
    <>
      <PageHeader
        title="To-do"
        description="Track your tasks across To do, In progress, and Done."
      />
      <TodosList
        todos={todos.map((t) => ({
          id: t.id,
          title: t.title,
          notes: t.notes,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          status: t.status,
        }))}
      />
    </>
  );
}
