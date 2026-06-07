import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";
import { Logo } from "@/components/brand/logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <div className="from-background to-muted/40 flex flex-1 flex-col items-center justify-center bg-gradient-to-b px-4 py-12">
      <Link href="/" className="mb-6">
        <Logo className="text-xl" />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="text-muted-foreground mt-6 text-xs">{t("auth.tagline")}</p>
    </div>
  );
}
