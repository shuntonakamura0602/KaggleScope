import Link from "next/link";
import { Trophy } from "lucide-react";
import { AvatarMark } from "@/components/kaggler/avatar-mark";
import { MedalCounts } from "@/components/kaggler/medal-counts";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMetricValue, type RankingMetric } from "@/lib/rankings";
import type { Kaggler } from "@/seed/kagglers";

export function RankingTable({
  kagglers,
  metric,
  metricLabel,
}: {
  kagglers: Kaggler[];
  metric: RankingMetric;
  metricLabel: string;
}) {
  if (kagglers.length === 0) {
    return (
      <Empty className="min-h-80 border border-border bg-card/40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Trophy aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No eligible Kagglers</EmptyTitle>
          <EmptyDescription>
            No one in this preview dataset meets the ranking requirements.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card/55 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/35 hover:bg-secondary/35">
              <TableHead className="w-16 pl-5 text-muted-foreground">
                #
              </TableHead>
              <TableHead>Kaggler</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Official</TableHead>
              <TableHead>Medals</TableHead>
              <TableHead>Competitions</TableHead>
              <TableHead className="pr-5 text-right">{metricLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kagglers.map((kaggler, index) => (
              <TableRow key={kaggler.username}>
                <TableCell className="pl-5 font-mono text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/kagglers/${kaggler.username}`}
                    className="flex w-fit items-center gap-3 rounded-lg hover:text-primary"
                  >
                    <AvatarMark name={kaggler.displayName} />
                    <span>
                      <span className="block font-medium">
                        {kaggler.displayName}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        @{kaggler.username}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {kaggler.tier}
                </TableCell>
                <TableCell className="font-mono">
                  #{kaggler.officialRank}
                </TableCell>
                <TableCell>
                  <MedalCounts medals={kaggler.medals} />
                </TableCell>
                <TableCell className="font-mono">
                  {kaggler.competitionCount}
                </TableCell>
                <TableCell className="pr-5 text-right font-mono text-lg font-semibold text-primary">
                  {getMetricValue(kaggler, metric).toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ol className="space-y-3 md:hidden">
        {kagglers.map((kaggler, index) => (
          <li key={kaggler.username}>
            <Link
              href={`/kagglers/${kaggler.username}`}
              className="block rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono text-sm text-muted-foreground">
                  {index + 1}
                </span>
                <AvatarMark name={kaggler.displayName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {kaggler.displayName}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    @{kaggler.username} · {kaggler.tier}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-mono text-lg font-semibold text-primary">
                    {getMetricValue(kaggler, metric).toFixed(1)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {metricLabel}
                  </span>
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                <MedalCounts medals={kaggler.medals} />
                <span className="font-mono text-xs text-muted-foreground">
                  Official #{kaggler.officialRank}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
