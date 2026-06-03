import Link from "next/link";
import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Forbidden · School RBAC Platform" };

export default function ForbiddenPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <ShieldX className="text-destructive size-12" />
      <h1 className="text-2xl font-bold">403 — Forbidden</h1>
      <p className="text-muted-foreground max-w-md">
        Your account doesn&apos;t have permission to view this page.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  );
}
