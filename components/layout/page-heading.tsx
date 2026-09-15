import { cn } from "@/lib/utils";

export function PageHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <p className="font-mono text-sm font-medium tracking-[0.08em] text-primary uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
        {description}
      </p>
    </div>
  );
}
