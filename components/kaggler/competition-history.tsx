import { Medal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getPercentile, type CompetitionResult } from "@/seed/competitions";

function MedalLabel({ medal }: { medal: CompetitionResult["medal"] }) {
  if (!medal) return <span className="text-muted-foreground">—</span>;
  const className = {
    Gold: "text-medal-gold",
    Silver: "text-medal-silver",
    Bronze: "text-medal-bronze",
  }[medal];

  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <Medal className="size-4" aria-hidden="true" /> {medal}
    </span>
  );
}

export function CompetitionHistory({
  results,
}: {
  results: CompetitionResult[];
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/35 hover:bg-secondary/35">
              <TableHead className="pl-5">Competition</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Percentile</TableHead>
              <TableHead>Medal</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="pr-5">Specialty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.slug}>
                <TableCell className="max-w-64 pl-5 font-medium whitespace-normal">
                  {result.title}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {result.date}
                </TableCell>
                <TableCell className="font-mono">
                  #{result.rank.toLocaleString()} /{" "}
                  {result.teams.toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-primary">
                  Top {getPercentile(result).toFixed(1)}%
                </TableCell>
                <TableCell>
                  <MedalLabel medal={result.medal} />
                </TableCell>
                <TableCell>{result.teamSize}</TableCell>
                <TableCell className="pr-5 text-muted-foreground">
                  {result.specialty}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {results.map((result) => (
          <article
            key={result.slug}
            className="rounded-xl border border-border bg-card/45 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">{result.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.date} · {result.specialty}
                </p>
              </div>
              <MedalLabel medal={result.medal} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Rank</p>
                <p className="mt-1 font-mono">#{result.rank}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Finish</p>
                <p className="mt-1 font-mono text-primary">
                  Top {getPercentile(result).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Team size</p>
                <p className="mt-1 font-mono">{result.teamSize}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
