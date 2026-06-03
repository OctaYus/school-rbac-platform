import { requireCapability } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { getActiveTeachers, getSessionTemplates } from "@/lib/data/sessions";
import { PageHeader } from "@/components/app/page-header";
import { AssignForm } from "@/components/sessions/assign-form";

export const metadata = { title: "Assign session · School RBAC Platform" };

export default async function AssignSessionPage() {
  await requireCapability(Capability.SESSION_ASSIGN);
  const [teachers, templates] = await Promise.all([getActiveTeachers(), getSessionTemplates()]);

  return (
    <>
      <PageHeader title="Assign a session" description="Schedule a session for a teacher." />
      <AssignForm teachers={teachers} templates={templates} />
    </>
  );
}
