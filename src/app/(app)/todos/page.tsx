import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { PageHeader } from "@/components/app/page-header";
import { TodosList } from "@/components/todos/todos-list";

export const metadata = { title: "To-do · Scholaris" };

export default async function TodosPage() {
  const user = await requireUser();
  const { t } = await getI18n();
  const todos = await prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      notes: true,
      dueDate: true,
      status: true,
      priority: true,
    },
  });

  return (
    <>
      <PageHeader title={t("todos.title")} description={t("todos.desc")} />
      <TodosList
        todos={todos.map((td) => ({
          id: td.id,
          title: td.title,
          notes: td.notes,
          dueDate: td.dueDate ? td.dueDate.toISOString() : null,
          status: td.status,
          priority: td.priority,
        }))}
      />
    </>
  );
}
