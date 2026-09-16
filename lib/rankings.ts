import { kagglers, type Kaggler } from "@/seed/kagglers";

export const rankingKinds = [
  "overall",
  "momentum",
  "solo",
  "consistency",
] as const;

export type RankingKind = (typeof rankingKinds)[number];
export type RankingMetric =
  | "careerPower"
  | "momentum"
  | "soloPower"
  | "consistency";

export const rankingConfig: Record<
  RankingKind,
  {
    eyebrow: string;
    title: string;
    description: string;
    metric: RankingMetric;
    metricLabel: string;
  }
> = {
  overall: {
    eyebrow: "Career ranking",
    title: "Overall",
    description:
      "Career Power weighs a Kaggler's strongest competition results across their full competitive history.",
    metric: "careerPower",
    metricLabel: "Career Power",
  },
  momentum: {
    eyebrow: "Recent performance",
    title: "Momentum",
    description:
      "Momentum gives more weight to strong finishes from the most recent 365 days.",
    metric: "momentum",
    metricLabel: "Momentum",
  },
  solo: {
    eyebrow: "Individual performance",
    title: "Solo",
    description:
      "Solo Power looks only at competitions completed without teammates. At least three results are required.",
    metric: "soloPower",
    metricLabel: "Solo Power",
  },
  consistency: {
    eyebrow: "Reliable performance",
    title: "Consistency",
    description:
      "Consistency rewards repeat top finishes while accounting for the number of eligible competitions.",
    metric: "consistency",
    metricLabel: "Consistency",
  },
};

export function isRankingKind(value: string): value is RankingKind {
  return rankingKinds.includes(value as RankingKind);
}

export function getRanking(kind: RankingKind): Kaggler[] {
  const { metric } = rankingConfig[kind];

  return [...kagglers]
    .filter((kaggler) => metric !== "soloPower" || kaggler.soloPower !== null)
    .sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric));
}

export function getMetricValue(kaggler: Kaggler, metric: RankingMetric) {
  return kaggler[metric] ?? 0;
}

export function getMetricRank(
  kaggler: Kaggler,
  metric: RankingMetric,
): number | null | undefined {
  if (metric === "careerPower") return kaggler.careerRank;
  if (metric === "momentum") return kaggler.momentumRank;
  if (metric === "soloPower") return kaggler.soloRank;
  return kaggler.consistencyRank;
}

export function getRankForKaggler(
  username: string,
  kind: RankingKind,
): number | null {
  const index = getRanking(kind).findIndex(
    (kaggler) => kaggler.username === username,
  );
  return index < 0 ? null : index + 1;
}
