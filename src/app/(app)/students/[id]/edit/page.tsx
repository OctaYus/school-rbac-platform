import { notFound } from "next/navigation";

import { requireCapability } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { getStudentDetail } from "@/lib/data/students";
import { PageHeader } from "@/components/app/page-header";
import { StudentForm } from "@/components/students/student-form";

export const metadata = { title: "Edit student · Scholaris" };

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCapability(Capability.STUDENT_WRITE);
  const { id } = await params;
  const detail = await getStudentDetail(user, id);
  if (!detail) notFound();

  return (
    <>
      <PageHeader title={`Edit ${detail.student.fullName}`} />
      <StudentForm initial={detail.student} />
    </>
  );
}
