import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/layout/page-heading";
import { PreviewNotice } from "@/components/layout/preview-notice";
import { RankingNav } from "@/components/rankings/ranking-nav";
import { RankingTable } from "@/components/rankings/ranking-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getRankingPage } from "@/lib/data/kagglers";
import { isRankingKind, rankingConfig, rankingKinds } from "@/lib/rankings";

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
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { kind } = await params;
  if (!isRankingKind(kind)) notFound();

  const config = rankingConfig[kind];
  const query = await searchParams;
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const data = await getRankingPage(
    kind,
    Number.isFinite(requestedPage) ? requestedPage : 1,
  );
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

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
        <PreviewNotice source={data.source} updatedAt={data.updatedAt} />
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data.total} eligible Kagglers
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              Score version 0.1
            </p>
          </div>
          <RankingTable
            kagglers={data.kagglers}
            metric={config.metric}
            metricLabel={config.metricLabel}
          />
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                {data.page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/rankings/${kind}?page=${data.page - 1}`}
                    />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <span className="px-3 font-mono text-sm text-muted-foreground">
                    Page {Math.min(data.page, totalPages)} of {totalPages}
                  </span>
                </PaginationItem>
                {data.page < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href={`/rankings/${kind}?page=${data.page + 1}`}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </main>
  );
}
