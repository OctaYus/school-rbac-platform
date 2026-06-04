import { notFound } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { Building2, CalendarClock, GraduationCap, Users } from "lucide-react";

import { requireCapability } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { getOrgOverview } from "@/lib/data/admin";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgSettingsForm } from "@/components/admin/org-settings-form";

export const metadata = { title: "Organization · Scholaris" };

const PLAN_LABEL: Record<string, string> = { FREE: "Free", PRO: "Pro", ENTERPRISE: "Enterprise" };

export default async function OrganizationPage() {
  const user = await requireCapability(Capability.SETTINGS_MANAGE);
  const { org, members, students, sessions } = await getOrgOverview(user.organizationId);
  if (!org) notFound();

  const trialDays =
    org.trialEndsAt && org.plan === "FREE"
      ? Math.max(0, differenceInCalendarDays(org.trialEndsAt, new Date()))
      : null;

  const stats = [
    { label: "Members", value: members, icon: Users },
    { label: "Students", value: students, icon: GraduationCap },
    { label: "Sessions", value: sessions, icon: CalendarClock },
  ];

  return (
    <>
      <PageHeader title="Organization" description="Manage your organization and plan." />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Your organization name and identifier.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <OrgSettingsForm initialName={org.name} />
            <dl className="text-muted-foreground space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Slug</dt>
                <dd className="text-foreground font-mono">{org.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Created</dt>
                <dd className="text-foreground">{format(org.createdAt, "PP")}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan &amp; usage</CardTitle>
            <CardDescription>Your current plan and usage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="text-primary size-5" />
                <span className="text-lg font-semibold">{PLAN_LABEL[org.plan] ?? org.plan}</span>
              </div>
              {trialDays !== null && (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-500/10 dark:text-amber-400">
                  {trialDays} day{trialDays === 1 ? "" : "s"} left in trial
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-muted/40 rounded-lg border p-3 text-center">
                  <s.icon className="text-muted-foreground mx-auto mb-1 size-4" />
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-muted-foreground text-xs">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <Button disabled className="w-full">
                Manage billing (coming soon)
              </Button>
              <p className="text-muted-foreground mt-2 text-center text-xs">
                Subscription billing via Stripe is on the way.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
