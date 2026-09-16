import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getRankForKaggler } from "@/lib/rankings";
import type { Kaggler } from "@/seed/kagglers";

export function ProfileScoreGrid({ kaggler }: { kaggler: Kaggler }) {
  const scores = [
    {
      label: "Career Power",
      value: kaggler.careerPower,
      rank:
        kaggler.careerRank ?? getRankForKaggler(kaggler.username, "overall"),
    },
    {
      label: "Solo Power",
      value: kaggler.soloPower,
      rank:
        kaggler.soloRank === undefined
          ? getRankForKaggler(kaggler.username, "solo")
          : kaggler.soloRank,
    },
    {
      label: "Consistency",
      value: kaggler.consistency,
      rank:
        kaggler.consistencyRank === undefined
          ? getRankForKaggler(kaggler.username, "consistency")
          : kaggler.consistencyRank,
    },
    {
      label: "Momentum",
      value: kaggler.momentum,
      rank:
        kaggler.momentumRank ?? getRankForKaggler(kaggler.username, "momentum"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {scores.map((score) => (
        <Card key={score.label} className="gap-4 bg-card/60 py-5">
          <CardContent className="px-4 sm:px-5">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {score.label}
              <Info
                className="size-3.5"
                aria-label="Unofficial KaggleScope metric"
              />
            </div>
            {score.value === null ? (
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                Not enough data
              </p>
            ) : (
              <>
                <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                  {score.value.toFixed(1)}
                </p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  Rank {score.rank ? `#${score.rank}` : "—"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
