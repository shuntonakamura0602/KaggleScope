import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/layout/page-heading";
import { PreviewNotice } from "@/components/layout/preview-notice";
import { SpecialtyRankingTable } from "@/components/specialties/specialty-ranking-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getSpecialtyRankingPage } from "@/lib/data/kagglers";
import { getSpecialtyBySlug, specialties } from "@/seed/kagglers";

export function generateStaticParams() {
  return specialties.map((specialty) => ({ slug: specialty.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const specialty = getSpecialtyBySlug(slug);
  if (!specialty) return {};

  return {
    title: `Top ${specialty.name} Kagglers`,
    description: `Discover the strongest ${specialty.name} competition performers ranked by KaggleScope Specialty Power.`,
  };
}

export default async function SpecialtyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  if (!getSpecialtyBySlug(slug)) notFound();

  const query = await searchParams;
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const data = await getSpecialtyRankingPage(
    slug,
    Number.isFinite(requestedPage) ? requestedPage : 1,
  );
  if (!data) notFound();

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[90rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative max-w-3xl pl-5">
            <span
              className="absolute inset-y-1 left-0 w-1 rounded-full"
              style={{ backgroundColor: data.specialty.accent }}
              aria-hidden="true"
            />
            <PageHeading
              eyebrow="Specialty ranking"
              title={data.specialty.name}
              description={`Kagglers ranked by results from eligible ${data.specialty.name} competitions.`}
            />
          </div>
          <nav aria-label="Specialty rankings">
            <ul className="flex max-w-2xl flex-wrap gap-2">
              {specialties.map((specialty) => (
                <li key={specialty.slug}>
                  <Link
                    href={`/specialties/${specialty.slug}`}
                    aria-current={specialty.slug === slug ? "page" : undefined}
                    className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card/55 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground aria-[current=page]:border-primary/40 aria-[current=page]:bg-primary/10 aria-[current=page]:text-primary"
                  >
                    {specialty.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <PreviewNotice source={data.source} updatedAt={data.updatedAt} />

        <section aria-labelledby="specialty-ranking-count">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p
              id="specialty-ranking-count"
              className="text-sm text-muted-foreground"
            >
              {data.total} eligible Kagglers
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              Score version 0.1
            </p>
          </div>
          <SpecialtyRankingTable
            entries={data.entries}
            specialtyName={data.specialty.name}
          />

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                {data.page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/specialties/${slug}?page=${data.page - 1}`}
                    />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <span className="px-3 font-mono text-sm text-muted-foreground">
                    Page {data.page} of {totalPages}
                  </span>
                </PaginationItem>
                {data.page < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href={`/specialties/${slug}?page=${data.page + 1}`}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </section>
      </div>
    </main>
  );
}
