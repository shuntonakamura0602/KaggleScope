import { cn } from "@/lib/utils";
import { getInitials } from "@/seed/kagglers";

export function AvatarMark({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full border border-primary/20 bg-gradient-to-br from-primary/20 to-chart-2/10 font-mono text-sm font-semibold text-primary",
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
