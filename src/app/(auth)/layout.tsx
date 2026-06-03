import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-background to-muted/40 flex flex-1 flex-col items-center justify-center bg-gradient-to-b px-4 py-12">
      <Link href="/" className="mb-6">
        <Logo className="text-xl" />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="text-muted-foreground mt-6 text-xs">Secure school management · Scholaris</p>
    </div>
  );
}
