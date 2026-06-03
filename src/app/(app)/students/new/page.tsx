import { requireCapability } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/app/page-header";
import { StudentForm } from "@/components/students/student-form";

export const metadata = { title: "New student · School RBAC Platform" };

export default async function NewStudentPage() {
  await requireCapability(Capability.STUDENT_WRITE);
  return (
    <>
      <PageHeader title="New student" />
      <StudentForm />
    </>
  );
}
