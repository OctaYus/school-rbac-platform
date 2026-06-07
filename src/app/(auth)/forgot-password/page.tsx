import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Forgot password · Scholaris" };

export default async function ForgotPasswordPage() {
  const { t } = await getI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.forgotTitle")}</CardTitle>
        <CardDescription>{t("auth.forgotDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter className="text-muted-foreground text-sm">
        <Link href="/login" className="hover:text-foreground hover:underline">
          {t("auth.backToSignIn")}
        </Link>
      </CardFooter>
    </Card>
  );
}
