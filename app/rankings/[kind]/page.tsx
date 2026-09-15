import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/layout/page-heading";
import { PreviewNotice } from "@/components/layout/preview-notice";
import { RankingNav } from "@/components/rankings/ranking-nav";
import { RankingTable } from "@/components/rankings/ranking-table";
import {
  getRanking,
  isRankingKind,
  rankingConfig,
  rankingKinds,
} from "@/lib/rankings";

export function generateStaticParams() {
  return rankingKinds.map((kind) => ({ kind }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string }>;
}): Promise<Metadata> {
  const { kind } = await params;
  if (!isRankingKind(kind)) return {};

  const config = rankingConfig[kind];
  return {
    title: `${config.title} Ranking`,
    description: config.description,
  };
}

export default async function RankingPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  if (!isRankingKind(kind)) notFound();

  const config = rankingConfig[kind];
  const ranking = getRanking(kind);

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[90rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <PageHeading
            eyebrow={config.eyebrow}
            title={config.title}
            description={config.description}
          />
          <RankingNav active={kind} />
        </div>
        <PreviewNotice />
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {ranking.length} eligible Kagglers
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              Score version 0.1 preview
            </p>
          </div>
          <RankingTable
            kagglers={ranking}
            metric={config.metric}
            metricLabel={config.metricLabel}
          />
        </div>
      </div>
    </main>
  );
}
