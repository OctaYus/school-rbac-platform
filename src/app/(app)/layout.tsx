import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentOrg } from "@/lib/auth/org";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const org = await getCurrentOrg();
  const orgName = org?.name ?? "Organization";

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar role={user.role} orgName={orgName} />
      <div className="flex flex-1 flex-col">
        <Topbar user={{ name: user.name, email: user.email, role: user.role }} orgName={orgName} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
