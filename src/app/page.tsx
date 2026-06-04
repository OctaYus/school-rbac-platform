import Link from "next/link";
import { CalendarDays, HeartPulse, ShieldCheck, Users } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Users, title: "Students", desc: "Records, marks, and assignments — role-scoped." },
  { icon: CalendarDays, title: "Sessions", desc: "Schedule and track teacher sessions." },
  { icon: HeartPulse, title: "Health records", desc: "Encrypted, access-controlled, audited." },
  { icon: ShieldCheck, title: "Security", desc: "Three-layer RBAC, MFA, full audit log." },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </header>

      <section className="from-background to-muted/40 flex flex-1 flex-col items-center justify-center gap-6 bg-gradient-to-b px-6 py-20 text-center">
        <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-3 py-1 text-xs font-medium">
          Secure school management
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Run your school on{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(90deg, var(--brand-from), var(--brand-to))",
            }}
          >
            Scholaris
          </span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Students, sessions, marks, and health records — protected by three-layer access control,
          MFA, application-layer encryption, and an append-only audit trail.
        </p>
        <div className="flex items-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Get started free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        <div className="mt-10 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card rounded-xl border p-5 text-left shadow-sm">
              <f.icon className="text-primary mb-3 size-6" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-muted-foreground border-t px-6 py-4 text-center text-xs">
        Scholaris · OWNER · MANAGER · SUPERVISOR · TEACHER
      </footer>
    </main>
  );
}
