import type { Metadata } from "next";

import { CompareResults } from "@/components/compare/compare-results";
import { CompareSelector } from "@/components/compare/compare-selector";
import { PageHeading } from "@/components/layout/page-heading";
import { PreviewNotice } from "@/components/layout/preview-notice";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCompareData,
  searchKagglers,
  type KagglerSearchResult,
} from "@/lib/data/kagglers";
import type { Kaggler } from "@/seed/kagglers";

export const metadata: Metadata = {
  title: "Compare Kagglers",
  description:
    "Compare two Kaggle competitors across rankings, medals, specialties, and shared competition results.",
};

type ComparePageProps = {
  searchParams: Promise<{ a?: string; b?: string }>;
};

function normalizeUsername(value: string | undefined) {
  return value?.trim().toLowerCase().slice(0, 100) ?? "";
}

function toSearchResult(kaggler: Kaggler): KagglerSearchResult {
  return {
    username: kaggler.username,
    displayName: kaggler.displayName,
    tier: kaggler.tier,
    officialRank: kaggler.officialRank,
  };
}

async function resolveInitialSelection(username: string) {
  if (!username) return null;

  const results = await searchKagglers(username);
  return (
    results.find((result) => result.username.toLowerCase() === username) ?? null
  );
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const leftUsername = normalizeUsername(params.a);
  const rightUsername = normalizeUsername(params.b);
  const hasPair = Boolean(leftUsername && rightUsername);
  const isSameUser = hasPair && leftUsername === rightUsername;
  const comparison =
    hasPair && !isSameUser
      ? await getCompareData(leftUsername, rightUsername)
      : null;

  const [initialLeft, initialRight] = comparison
    ? [toSearchResult(comparison.left), toSearchResult(comparison.right)]
    : await Promise.all([
        resolveInitialSelection(leftUsername),
        resolveInitialSelection(rightUsername),
      ]);

  let message = "Search for two Kagglers to start a side-by-side comparison.";
  if (isSameUser) {
    message = "Choose two different Kagglers to compare.";
  } else if (hasPair && !comparison) {
    message = "One or both Kagglers could not be found.";
  }

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Head-to-head"
        title="Compare Kagglers"
        description="Compare rankings, medals, specialties, and shared competition finishes. Your selection stays in the URL, ready to share."
      />

      <CompareSelector
        key={`${leftUsername}:${rightUsername}`}
        initialLeft={initialLeft}
        initialRight={initialRight}
      />

      {comparison ? (
        <div className="space-y-5">
          <PreviewNotice
            source={comparison.source}
            updatedAt={comparison.updatedAt}
          />
          <CompareResults data={comparison} />
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {message}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
