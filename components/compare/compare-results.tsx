import Link from "next/link";
import type { ReactNode } from "react";
import { Equal, Swords } from "lucide-react";
import { AvatarMark } from "@/components/kaggler/avatar-mark";
import { MedalCounts } from "@/components/kaggler/medal-counts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ComparisonWinner } from "@/lib/compare";
import type { CompareData } from "@/lib/data/kagglers";
import { cn } from "@/lib/utils";
import type { Kaggler } from "@/seed/kagglers";

type MetricRow = {
  label: string;
  left: string;
  right: string;
  winner: ComparisonWinner | null;
};

function numericWinner(
  left: number | null,
  right: number | null,
  higherWins = true,
): ComparisonWinner | null {
  if (left === null || right === null) return null;
  if (left === right) return "draw";
  const leftWins = higherWins ? left > right : left < right;
  return leftWins ? "left" : "right";
}

function score(value: number | null) {
  return value === null ? "Not enough data" : value.toFixed(1);
}

function rank(value: number | null) {
  return value === null ? "—" : `#${value}`;
}

function metricRows(left: Kaggler, right: Kaggler): MetricRow[] {
  return [
    {
      label: "Competition tier",
      left: left.tier,
      right: right.tier,
      winner: null,
    },
    {
      label: "Official rank",
      left: rank(left.officialRank),
      right: rank(right.officialRank),
      winner: numericWinner(left.officialRank, right.officialRank, false),
    },
    {
      label: "Peak rank",
      left: rank(left.highestRank),
      right: rank(right.highestRank),
      winner: numericWinner(left.highestRank, right.highestRank, false),
    },
    {
      label: "Gold medals",
      left: String(left.medals.gold),
      right: String(right.medals.gold),
      winner: numericWinner(left.medals.gold, right.medals.gold),
    },
    {
      label: "Silver medals",
      left: String(left.medals.silver),
      right: String(right.medals.silver),
      winner: numericWinner(left.medals.silver, right.medals.silver),
    },
    {
      label: "Bronze medals",
      left: String(left.medals.bronze),
      right: String(right.medals.bronze),
      winner: numericWinner(left.medals.bronze, right.medals.bronze),
    },
    {
      label: "Competition count",
      left: left.competitionCount.toLocaleString(),
      right: right.competitionCount.toLocaleString(),
      winner: null,
    },
    {
      label: "Career Power",
      left: score(left.careerPower),
      right: score(right.careerPower),
      winner: numericWinner(left.careerPower, right.careerPower),
    },
    {
      label: "Solo Power",
      left: score(left.soloPower),
      right: score(right.soloPower),
      winner: numericWinner(left.soloPower, right.soloPower),
    },
    {
      label: "Consistency",
      left: score(left.consistency),
      right: score(right.consistency),
      winner: numericWinner(left.consistency, right.consistency),
    },
    {
      label: "Momentum",
      left: score(left.momentum),
      right: score(right.momentum),
      winner: numericWinner(left.momentum, right.momentum),
    },
  ];
}

function ParticipantCard({ kaggler }: { kaggler: Kaggler }) {
  return (
    <Card className="border-primary/15 bg-card/65">
      <CardContent className="flex items-center gap-4 p-5 sm:p-6">
        <AvatarMark name={kaggler.displayName} className="size-14 text-lg" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/kagglers/${kaggler.username}`}
            className="block truncate text-xl font-semibold hover:text-primary"
          >
            {kaggler.displayName}
          </Link>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            @{kaggler.username} · Competition {kaggler.tier}
          </p>
          <div className="mt-3">
            <MedalCounts medals={kaggler.medals} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCell({
  value,
  winner,
  side,
}: {
  value: string;
  winner: ComparisonWinner | null;
  side: "left" | "right";
}) {
  return (
    <span
      className={cn(
        "font-mono",
        winner === side && "font-semibold text-primary",
      )}
    >
      {value}
    </span>
  );
}

export function CompareResults({ data }: { data: CompareData }) {
  const { left, right, headToHead } = data;
  const rows = metricRows(left, right);

  return (
    <div className="space-y-8">
      <section
        aria-label="Compared Kagglers"
        className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center"
      >
        <ParticipantCard kaggler={left} />
        <div className="mx-auto grid size-12 place-items-center rounded-full border border-primary/25 bg-primary/10 font-mono text-sm font-bold text-primary">
          VS
        </div>
        <ParticipantCard kaggler={right} />
      </section>

      <Card className="bg-card/55">
        <CardHeader>
          <CardTitle>Performance comparison</CardTitle>
          <p className="text-sm text-muted-foreground">
            Highlighted values lead the compared metric. KaggleScope scores are
            unofficial.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/35 hover:bg-secondary/35">
                  <TableHead className="w-[34%]">Metric</TableHead>
                  <TableHead>{left.displayName}</TableHead>
                  <TableHead>{right.displayName}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="text-muted-foreground">
                      {row.label}
                    </TableCell>
                    <TableCell>
                      <MetricCell
                        value={row.left}
                        winner={row.winner}
                        side="left"
                      />
                    </TableCell>
                    <TableCell>
                      <MetricCell
                        value={row.right}
                        winner={row.winner}
                        side="right"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="head-to-head-heading">
        <div className="mb-4">
          <p className="font-mono text-xs tracking-[0.08em] text-primary uppercase">
            Shared competitions
          </p>
          <h2
            id="head-to-head-heading"
            className="mt-2 text-2xl font-semibold tracking-tight"
          >
            Head-to-head
          </h2>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryStat
            label="Shared"
            value={headToHead.competitions.length}
            icon={<Swords aria-hidden="true" />}
          />
          <SummaryStat
            label={`${left.displayName} wins`}
            value={headToHead.leftWins}
          />
          <SummaryStat
            label="Draws"
            value={headToHead.draws}
            icon={<Equal aria-hidden="true" />}
          />
          <SummaryStat
            label={`${right.displayName} wins`}
            value={headToHead.rightWins}
          />
        </div>

        {headToHead.competitions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/45 px-5 py-10 text-center text-sm text-muted-foreground">
            No shared eligible competitions were found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card/55">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/35 hover:bg-secondary/35">
                  <TableHead>Competition</TableHead>
                  <TableHead>{left.displayName}</TableHead>
                  <TableHead>{right.displayName}</TableHead>
                  <TableHead>Winner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headToHead.competitions.map((competition) => (
                  <TableRow key={competition.slug}>
                    <TableCell>
                      <a
                        href={`https://www.kaggle.com/competitions/${competition.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:text-primary"
                      >
                        {competition.title}
                      </a>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {competition.date} ·{" "}
                        {competition.teams.toLocaleString()} teams
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">
                      #{competition.leftRank}
                    </TableCell>
                    <TableCell className="font-mono">
                      #{competition.rightRank}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {competition.winner === "draw"
                        ? "Draw"
                        : competition.winner === "left"
                          ? left.displayName
                          : right.displayName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section aria-labelledby="specialty-compare-heading">
        <div className="mb-4">
          <p className="font-mono text-xs tracking-[0.08em] text-primary uppercase">
            Field strengths
          </p>
          <h2
            id="specialty-compare-heading"
            className="mt-2 text-2xl font-semibold tracking-tight"
          >
            Specialty comparison
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {data.specialties.map((specialty) => (
            <Card key={specialty.slug} className="bg-card/55 py-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={`/specialties/${specialty.slug}`}
                    className="font-medium hover:text-primary"
                  >
                    {specialty.name}
                  </Link>
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: specialty.accent }}
                    aria-hidden="true"
                  />
                </div>
                <SpecialtyBar
                  label={left.displayName}
                  score={specialty.leftScore}
                  accent={specialty.accent}
                  leading={specialty.winner === "left"}
                />
                <SpecialtyBar
                  label={right.displayName}
                  score={specialty.rightScore}
                  accent={specialty.accent}
                  leading={specialty.winner === "right"}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: ReactNode;
}) {
  return (
    <Card className="bg-card/55 py-0">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon && <span className="[&_svg]:size-4">{icon}</span>}
          <span className="truncate">{label}</span>
        </div>
        <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function SpecialtyBar({
  label,
  score,
  accent,
  leading,
}: {
  label: string;
  score: number | null;
  accent: string;
  leading: boolean;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="truncate text-muted-foreground">{label}</span>
        <span
          className={cn("font-mono", leading && "font-semibold text-primary")}
        >
          {score === null ? "—" : score.toFixed(1)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score ?? 0}%`,
            backgroundColor: accent,
            opacity: leading ? 1 : 0.55,
          }}
        />
      </div>
    </div>
  );
}
