import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm",
        className,
      )}
    >
      <GraduationCap className="size-5" />
    </span>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-lg tracking-tight text-transparent">
          Scholaris
        </span>
      )}
    </span>
  );
}
