import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Sign in · Scholaris" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ "check-email"?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const sp = await searchParams;
  const checkEmail = sp["check-email"];
  const { t } = await getI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.loginTitle")}</CardTitle>
        <CardDescription>{t("auth.loginDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {checkEmail ? (
          <p className="bg-muted rounded-md border px-3 py-2 text-sm">
            Check your email for a sign-in link.
          </p>
        ) : (
          <LoginForm />
        )}
      </CardContent>
      <CardFooter className="text-muted-foreground justify-between text-sm">
        <Link href="/signup" className="hover:text-foreground hover:underline">
          {t("auth.createAccount")}
        </Link>
        <Link href="/forgot-password" className="hover:text-foreground hover:underline">
          {t("auth.forgot")}
        </Link>
      </CardFooter>
    </Card>
  );
}
