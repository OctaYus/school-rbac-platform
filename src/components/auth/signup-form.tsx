"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { z } from "zod";

import { signupAction } from "@/app/(auth)/signup/actions";
import { signupSchema } from "@/lib/validation/signup";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { orgName: "", name: "", email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await signupAction(values);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else setServerError(res.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <p
          role="alert"
          className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {serverError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="orgName">Organization name</Label>
        <Input id="orgName" placeholder="Acme Tutoring" {...register("orgName")} />
        {errors.orgName && <p className="text-destructive text-xs">{errors.orgName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" autoComplete="name" {...register("name")} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" type="email" autoComplete="username" {...register("email")} />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-destructive text-xs">{errors.password.message}</p>
        ) : (
          <p className="text-muted-foreground text-xs">
            At least {PASSWORD_MIN_LENGTH} characters with upper, lower, number, and symbol.
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        Create organization
      </Button>
    </form>
  );
}
