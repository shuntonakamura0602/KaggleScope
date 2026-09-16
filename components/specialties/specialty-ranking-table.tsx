import Link from "next/link";
import { Shapes } from "lucide-react";
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
import type { SpecialtyRankingEntry } from "@/lib/data/kagglers";

export function SpecialtyRankingTable({
  entries,
  specialtyName,
}: {
  entries: SpecialtyRankingEntry[];
  specialtyName: string;
}) {
  if (entries.length === 0) {
    return (
      <Empty className="min-h-80 border border-border bg-card/40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Shapes aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No eligible Kagglers</EmptyTitle>
          <EmptyDescription>
            No Kaggler has enough {specialtyName} results to be ranked yet.
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
              <TableHead>Specialty results</TableHead>
              <TableHead>Specialty medals</TableHead>
              <TableHead className="pr-5 text-right">Power</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.kaggler.username}>
                <TableCell className="pl-5 font-mono text-muted-foreground">
                  {entry.rank}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/kagglers/${entry.kaggler.username}`}
                    className="flex w-fit items-center gap-3 rounded-lg hover:text-primary"
                  >
                    <AvatarMark name={entry.kaggler.displayName} />
                    <span>
                      <span className="block font-medium">
                        {entry.kaggler.displayName}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        @{entry.kaggler.username}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {entry.kaggler.tier}
                </TableCell>
                <TableCell className="font-mono">
                  {entry.competitionCount ?? "—"}
                </TableCell>
                <TableCell>
                  {entry.medals ? <MedalCounts medals={entry.medals} /> : "—"}
                </TableCell>
                <TableCell className="pr-5 text-right font-mono text-lg font-semibold text-primary">
                  {entry.score.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ol className="space-y-3 md:hidden">
        {entries.map((entry) => (
          <li key={entry.kaggler.username}>
            <Link
              href={`/kagglers/${entry.kaggler.username}`}
              className="block rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono text-sm text-muted-foreground">
                  {entry.rank}
                </span>
                <AvatarMark name={entry.kaggler.displayName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {entry.kaggler.displayName}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    @{entry.kaggler.username} · {entry.kaggler.tier}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-mono text-lg font-semibold text-primary">
                    {entry.score.toFixed(1)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {specialtyName} Power
                  </span>
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-sm text-muted-foreground">
                  {entry.competitionCount === null
                    ? "Preview result count unavailable"
                    : `${entry.competitionCount} eligible results`}
                </span>
                {entry.medals && <MedalCounts medals={entry.medals} />}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
