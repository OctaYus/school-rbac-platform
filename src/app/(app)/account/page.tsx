import { requireUser } from "@/lib/auth/guards";
import { smtpConfigured } from "@/lib/email/mailer";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmailChangeForm, PasswordForm, ProfileForm } from "@/components/account/account-forms";

export const metadata = { title: "Account · Scholaris" };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 p-6 md:grid-cols-3">
      <div className="md:col-span-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </section>
  );
}

export default async function AccountPage() {
  const user = await requireUser();
  const emailEnabled = smtpConfigured();

  return (
    <>
      <PageHeader
        title="Account settings"
        description="Manage your profile, email, and password."
      />
      <Card className="max-w-3xl">
        <CardContent className="divide-y p-0">
          <Section title="Profile" description="Your display name shown across Scholaris.">
            <ProfileForm initialName={user.name} />
          </Section>

          <Section
            title="Email address"
            description={
              emailEnabled
                ? "Change your email — we'll send a verification code to the new address."
                : "Email changes require email to be configured."
            }
          >
            {emailEnabled ? (
              <EmailChangeForm currentEmail={user.email} />
            ) : (
              <p className="text-sm">
                Current: <span className="font-medium">{user.email}</span>
              </p>
            )}
          </Section>

          <Section
            title="Password"
            description="Change your password. This signs you out everywhere."
          >
            <PasswordForm />
          </Section>
        </CardContent>
      </Card>
    </>
  );
}
