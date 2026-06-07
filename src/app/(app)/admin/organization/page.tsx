import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CalendarClock, GraduationCap, Users } from "lucide-react";

import { requireCapability } from "@/lib/auth/guards";
import { Capability } from "@/lib/auth/permissions";
import { getI18n } from "@/lib/i18n/server";
import { getOrgOverview } from "@/lib/data/admin";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgSettingsForm } from "@/components/admin/org-settings-form";

export const metadata = { title: "Organization · Scholaris" };

export default async function OrganizationPage() {
  const user = await requireCapability(Capability.SETTINGS_MANAGE);
  const { org, members, students, sessions } = await getOrgOverview(user.organizationId);
  if (!org) notFound();

  const { t } = await getI18n();

  const stats = [
    { label: t("org.members"), value: members, icon: Users },
    { label: t("org.students"), value: students, icon: GraduationCap },
    { label: t("org.sessions"), value: sessions, icon: CalendarClock },
  ];

  return (
    <>
      <PageHeader title={t("org.title")} description={t("org.desc")} />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("org.general")}</CardTitle>
            <CardDescription>{t("org.generalDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <OrgSettingsForm initialName={org.name} />
            <dl className="text-muted-foreground space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt>{t("org.slug")}</dt>
                <dd className="text-foreground font-mono">{org.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("org.created")}</dt>
                <dd className="text-foreground">{format(org.createdAt, "PP")}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("org.usage")}</CardTitle>
            <CardDescription>{t("org.usageDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-muted/40 rounded-lg border p-3 text-center">
                  <s.icon className="text-muted-foreground mx-auto mb-1 size-4" />
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-muted-foreground text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
