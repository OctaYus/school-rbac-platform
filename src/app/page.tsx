import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="flex items-center gap-3">
        <GraduationCap className="size-10" />
        <h1 className="text-3xl font-bold tracking-tight">School RBAC Platform</h1>
      </div>
      <p className="text-muted-foreground max-w-xl">
        A role-based school management system with students, sessions, marks, and health records —
        secured with three-layer access control, MFA, encrypted records, and full audit logging.
      </p>
      <div className="flex items-center gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <ShieldCheck className="size-4" />
        OWNER · MANAGER · SUPERVISOR · TEACHER
      </p>
    </main>
  );
}
