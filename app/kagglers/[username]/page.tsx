import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  CircleUserRound,
  Hash,
  Trophy,
  UsersRound,
} from "lucide-react";
import { AvatarMark } from "@/components/kaggler/avatar-mark";
import { CompetitionHistory } from "@/components/kaggler/competition-history";
import { MedalCounts } from "@/components/kaggler/medal-counts";
import { ProfileScoreGrid } from "@/components/kaggler/profile-score-grid";
import { SpecialtyBars } from "@/components/kaggler/specialty-bars";
import { PreviewNotice } from "@/components/layout/preview-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKagglerProfileData } from "@/lib/data/kagglers";
import { getPercentile } from "@/seed/competitions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const data = await getKagglerProfileData(username);
  if (!data) return {};

  return {
    title: `${data.kaggler.displayName} Kaggle Stats & Rankings`,
    description: `Explore ${data.kaggler.displayName}'s competition stats, rankings, medals, and specialties on KaggleScope.`,
  };
}

export default async function KagglerProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getKagglerProfileData(username);
  if (!data) notFound();

  const { kaggler, history, teammates } = data;
  const bestResults = [...data.history]
    .sort((a, b) => getPercentile(a) - getPercentile(b))
    .slice(0, 3);

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[90rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <div className="space-y-8">
        <PreviewNotice source={data.source} updatedAt={data.updatedAt} />

        <section className="flex flex-col gap-6 border-b border-border/70 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-5">
            <AvatarMark
              name={kaggler.displayName}
              className="size-16 text-xl sm:size-20 sm:text-2xl"
            />
            <div>
              <p className="font-mono text-sm text-primary">
                Competition {kaggler.tier}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {kaggler.displayName}
              </h1>
              <p className="mt-2 text-muted-foreground">
                @{kaggler.username}
                {kaggler.country ? ` · ${kaggler.country}` : ""}
              </p>
            </div>
          </div>
          <Link
            href={`https://www.kaggle.com/${kaggler.username}`}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            target="_blank"
            rel="noreferrer"
          >
            View on Kaggle
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </section>

        <section aria-labelledby="official-stats-heading">
          <h2 id="official-stats-heading" className="sr-only">
            Official Kaggle statistics
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <Stat
              label="Official rank"
              value={kaggler.officialRank ? `#${kaggler.officialRank}` : "—"}
              icon={Hash}
            />
            <Stat
              label="Peak rank"
              value={kaggler.highestRank ? `#${kaggler.highestRank}` : "—"}
              icon={Trophy}
            />
            <Stat
              label="Competitions"
              value={String(kaggler.competitionCount)}
              icon={CircleUserRound}
            />
            <Stat
              label="Registered"
              value={kaggler.joinedYear ? String(kaggler.joinedYear) : "—"}
              icon={CalendarDays}
            />
            <div className="col-span-2 flex min-h-24 flex-col justify-center rounded-xl border border-border bg-card/45 px-5">
              <p className="mb-3 text-sm text-muted-foreground">Medals</p>
              <MedalCounts medals={kaggler.medals} />
            </div>
          </div>
        </section>

        <section aria-labelledby="key-scores-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.08em] text-primary uppercase">
                Unofficial metrics
              </p>
              <h2
                id="key-scores-heading"
                className="mt-2 text-2xl font-semibold tracking-tight"
              >
                Performance profile
              </h2>
            </div>
            <p className="hidden font-mono text-xs text-muted-foreground sm:block">
              Score version 0.1
            </p>
          </div>
          <ProfileScoreGrid kaggler={kaggler} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <Card className="bg-card/55">
            <CardHeader>
              <CardTitle className="text-xl">Specialties</CardTitle>
              <p className="text-sm text-muted-foreground">
                Relative performance by competition category
              </p>
            </CardHeader>
            <CardContent>
              <SpecialtyBars kaggler={kaggler} />
            </CardContent>
          </Card>

          <Card className="bg-card/55">
            <CardHeader>
              <CardTitle className="text-xl">Best performances</CardTitle>
              <p className="text-sm text-muted-foreground">
                Strongest finishes by percentile
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {bestResults.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No eligible results are available.
                </p>
              )}
              {bestResults.map((result, index) => (
                <div
                  key={result.slug}
                  className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-xl border border-border/70 bg-background/30 p-3"
                >
                  <span className="font-mono text-sm text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {result.title}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      #{result.rank} of {result.teams.toLocaleString()}
                    </span>
                  </span>
                  <span className="font-mono text-sm text-primary">
                    Top {getPercentile(result).toFixed(1)}%
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <section aria-labelledby="history-heading">
          <div className="mb-4">
            <h2
              id="history-heading"
              className="text-2xl font-semibold tracking-tight"
            >
              Competition history
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Newest results first
            </p>
          </div>
          <CompetitionHistory results={history} />
        </section>

        <Card className="bg-card/55">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UsersRound className="size-5 text-primary" aria-hidden="true" />
              <CardTitle className="text-xl">Frequent teammates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {teammates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No repeated teammates found.
              </p>
            )}
            {teammates.map((teammate) => (
              <Link
                key={teammate.username}
                href={`/kagglers/${teammate.username}`}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/30 p-4 transition-colors hover:border-primary/35"
              >
                <AvatarMark name={teammate.displayName} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {teammate.displayName}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {teammate.competitionCount} competitions
                  </span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Hash;
}) {
  return (
    <div className="flex min-h-24 flex-col justify-center rounded-xl border border-border bg-card/45 px-4 sm:px-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" /> {label}
      </div>
      <p className="mt-2 font-mono text-xl font-semibold">{value}</p>
    </div>
  );
}
