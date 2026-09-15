import Link from "next/link";
import { cn } from "@/lib/utils";
import { rankingConfig, rankingKinds, type RankingKind } from "@/lib/rankings";

export function RankingNav({ active }: { active: RankingKind }) {
  return (
    <nav aria-label="Ranking categories" className="overflow-x-auto">
      <ul className="flex min-w-max gap-2">
        {rankingKinds.map((kind) => (
          <li key={kind}>
            <Link
              href={`/rankings/${kind}`}
              aria-current={active === kind ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center rounded-lg border px-4 text-sm font-medium transition-colors",
                active === kind
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-card/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {rankingConfig[kind].title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
