import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start your free trial</CardTitle>
        <CardDescription>
          Create your organization — 14 days free, no card required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="text-muted-foreground justify-center text-sm">
        Already have an account?&nbsp;
        <Link href="/login" className="text-foreground hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
