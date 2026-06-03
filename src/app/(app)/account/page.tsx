import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm, ProfileForm } from "@/components/account/account-forms";

export const metadata = { title: "Account · Scholaris" };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Account settings" description="Manage your profile and password." />
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Your name and email.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialName={user.name} email={user.email} />
          </CardContent>
        </Card>
        <Card>
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
