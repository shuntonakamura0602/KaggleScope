import Link from "next/link";
import { Activity, ArrowRight, Compass, Search, Sparkles } from "lucide-react";
import { AvatarMark } from "@/components/kaggler/avatar-mark";
import { MedalCounts } from "@/components/kaggler/medal-counts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getHomeData } from "@/lib/data/kagglers";
import { specialties } from "@/seed/kagglers";

export default async function Home() {
  const data = await getHomeData();

  return (
    <main>
      <section className="mx-auto grid max-w-[90rem] gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:items-center lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            Independent competitive analytics
          </div>
          <h1 className="max-w-2xl text-4xl leading-[1.05] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
            See what makes a Kaggler strong.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Explore career performance, recent momentum, solo strength, and the
            specialties behind the leaderboard.
          </p>

          <div className="mt-9 max-w-2xl">
            <label htmlFor="kaggler-search" className="sr-only">
              Search Kagglers
            </label>
            <div className="group flex items-center rounded-2xl border border-border bg-card/85 p-2 shadow-[0_24px_80px_rgb(0_0_0/22%)] transition-colors focus-within:border-primary/60">
              <Search
                className="ml-3 size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="kaggler-search"
                type="search"
                placeholder="Search Kagglers..."
                className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              />
              <span className="hidden rounded-lg bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground sm:block">
                {data.source === "database" ? "Database" : "Preview"}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {data.source === "database"
                ? `${data.kagglerCount.toLocaleString()} processed Kagglers${data.updatedAt ? ` · Calculated ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(data.updatedAt)}` : ""}`
                : "Preview dataset · 20 fictional Kagglers"}
            </p>
          </div>
        </div>

        <Card className="relative overflow-hidden border-primary/15 bg-card/70 py-0 shadow-[0_30px_100px_rgb(0_0_0/25%)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
            <div>
              <p className="font-semibold">Career Power leaders</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.source === "database"
                  ? "Latest calculation"
                  : "Preview ranking"}
              </p>
            </div>
            <Link
              href="/rankings/overall"
              className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              View all <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <CardContent className="divide-y divide-border/60 px-3 py-2 sm:px-4">
            {data.topKagglers.length === 0 && (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                No scored Kagglers are available yet.
              </p>
            )}
            {data.topKagglers.map((kaggler, index) => (
              <Link
                key={kaggler.username}
                href={`/kagglers/${kaggler.username}`}
                className="grid grid-cols-[2rem_auto_1fr_auto] items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-secondary/70 sm:px-3"
              >
                <span className="font-mono text-sm text-muted-foreground">
                  {String(kaggler.careerRank ?? index + 1).padStart(2, "0")}
                </span>
                <AvatarMark name={kaggler.displayName} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {kaggler.displayName}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    @{kaggler.username}
                  </span>
                </span>
                <span className="font-mono text-lg font-semibold text-primary">
                  {kaggler.careerPower.toFixed(1)}
                </span>
              </Link>
            ))}
          </CardContent>
          <div className="grid grid-cols-2 gap-px border-t border-border/70 bg-border/70">
            <div className="bg-card px-5 py-4 sm:px-6">
              <p className="font-mono text-2xl font-semibold">
                {data.kagglerCount.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Kagglers</p>
            </div>
            <div className="bg-card px-5 py-4 sm:px-6">
              <MedalCounts medals={data.medalTotals} />
              <p className="mt-2 text-sm text-muted-foreground">
                Medals tracked
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="border-y border-border/70 bg-card/20">
        <div className="mx-auto max-w-[90rem] px-4 py-14 sm:px-6 sm:py-18 lg:px-10">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-mono text-sm text-primary">
                <Activity className="size-4" aria-hidden="true" /> Live signal
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                Trending now
              </h2>
            </div>
            <Link
              href="/rankings/momentum"
              className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              Momentum ranking
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.trendingKagglers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recent results are available yet.
              </p>
            )}
            {data.trendingKagglers.map((kaggler, index) => (
              <Link
                href={`/kagglers/${kaggler.username}`}
                key={kaggler.username}
                className="group rounded-xl border border-border bg-card/55 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35"
              >
                <div className="flex items-center justify-between gap-4">
                  <AvatarMark name={kaggler.displayName} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(kaggler.momentumRank ?? index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-5 font-medium group-hover:text-primary">
                  {kaggler.displayName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  @{kaggler.username}
                </p>
                <div className="mt-5 flex items-end justify-between border-t border-border/60 pt-4">
                  <span className="text-sm text-muted-foreground">
                    Momentum
                  </span>
                  <span className="font-mono text-2xl font-semibold text-primary">
                    {kaggler.momentum.toFixed(1)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 font-mono text-sm text-primary">
            <Compass className="size-4" aria-hidden="true" /> Find your field
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Explore by specialty
          </h2>
          <p className="mt-3 text-muted-foreground">
            See which competitors stand out in the problems you care about.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {specialties.map((specialty) => {
            const specialtyData = data.specialtyLeaders[specialty.name] ?? {
              leader: null,
              eligibleCount: 0,
            };
            const leader = specialtyData.leader;

            return (
              <article
                key={specialty.slug}
                className="relative overflow-hidden rounded-xl border border-border bg-card/45 p-5"
              >
                <div
                  className="absolute inset-y-0 left-0 w-0.5"
                  style={{ backgroundColor: specialty.accent }}
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{specialty.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {specialtyData.eligibleCount} ranked Kagglers
                    </p>
                  </div>
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: specialty.accent }}
                    aria-hidden="true"
                  />
                </div>
                {leader && (
                  <Link
                    href={`/kagglers/${leader.username}`}
                    className="mt-7 flex items-center justify-between gap-4 border-t border-border/60 pt-4 hover:text-primary"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs text-muted-foreground">
                        {data.source === "database"
                          ? "Current leader"
                          : "Preview leader"}
                      </span>
                      <span className="mt-1 block truncate text-sm font-medium">
                        {leader.displayName}
                      </span>
                    </span>
                    <span className="font-mono text-xl font-semibold">
                      {leader.specialties
                        .find((item) => item.name === specialty.name)
                        ?.score.toFixed(1)}
                    </span>
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[90rem] px-4 pb-16 sm:px-6 sm:pb-24 lg:px-10">
        <div className="grid overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-card to-primary/5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="p-6 sm:p-9">
            <p className="font-mono text-sm text-primary">Beyond the rank</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Official rankings show where someone stands. KaggleScope helps
              explain why.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-px border-t border-border bg-border lg:h-full lg:grid-cols-1 lg:border-t-0 lg:border-l">
            <div className="bg-card/90 px-6 py-5 lg:flex lg:min-w-56 lg:flex-col lg:justify-center">
              <p className="font-mono text-2xl text-primary">4</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Power signals
              </p>
            </div>
            <div className="bg-card/90 px-6 py-5 lg:flex lg:min-w-56 lg:flex-col lg:justify-center">
              <p className="font-mono text-2xl text-primary">6</p>
              <p className="mt-1 text-sm text-muted-foreground">Specialties</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
