import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

const MARK_GRADIENT = "linear-gradient(135deg, var(--brand-from), var(--brand-to))";
const TEXT_GRADIENT = "linear-gradient(90deg, var(--brand-from), var(--brand-to))";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-white shadow-sm",
        className,
      )}
      style={{ backgroundImage: MARK_GRADIENT }}
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
        <span
          className="bg-clip-text text-lg tracking-tight text-transparent"
          style={{ backgroundImage: TEXT_GRADIENT }}
        >
          Scholaris
        </span>
      )}
    </span>
  );
}
