import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Accept invite · Scholaris" };

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>Set your name and password to activate your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <AcceptInviteForm token={token} />
      </CardContent>
    </Card>
  );
}
