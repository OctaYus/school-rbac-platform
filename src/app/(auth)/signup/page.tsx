import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { SignupForm } from "@/components/auth/signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Create your organization · Scholaris" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { t } = await getI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.signupTitle")}</CardTitle>
        <CardDescription>{t("auth.signupDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="text-muted-foreground justify-center text-sm">
        {t("auth.alreadyHave")}&nbsp;
        <Link href="/login" className="text-foreground hover:underline">
          {t("common.signIn")}
        </Link>
      </CardFooter>
    </Card>
  );
}
