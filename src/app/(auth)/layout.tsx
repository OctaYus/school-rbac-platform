import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <GraduationCap className="size-6" />
        School RBAC Platform
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
