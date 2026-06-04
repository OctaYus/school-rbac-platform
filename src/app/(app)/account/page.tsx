import { requireUser } from "@/lib/auth/guards";
import { smtpConfigured } from "@/lib/email/mailer";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailChangeForm, PasswordForm, ProfileForm } from "@/components/account/account-forms";

export const metadata = { title: "Account · Scholaris" };

export default async function AccountPage() {
  const user = await requireUser();
  const emailEnabled = smtpConfigured();

  return (
    <>
      <PageHeader
        title="Account settings"
        description="Manage your profile, email, and password."
      />
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Your display name.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialName={user.name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email address</CardTitle>
            <CardDescription>
              {emailEnabled
                ? "Change your email — we'll send a verification code."
                : "Email change needs email to be configured."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailEnabled ? (
              <EmailChangeForm currentEmail={user.email} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Current: <span className="text-foreground font-medium">{user.email}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Password</CardTitle>
            <CardDescription>Change your password (signs you out).</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
