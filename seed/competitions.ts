import { kagglers, type Kaggler } from "@/seed/kagglers";

export type CompetitionResult = {
  slug: string;
  title: string;
  date: string;
  rank: number;
  teams: number;
  medal: "Gold" | "Silver" | "Bronze" | null;
  teamSize: number;
  specialty: string;
  resultScore?: number;
};

const competitionTemplates: Omit<CompetitionResult, "rank">[] = [
  {
    slug: "wildlife-acoustics-2026",
    title: "Wildlife Acoustics 2026",
    date: "Aug 28, 2026",
    teams: 1840,
    medal: "Gold",
    teamSize: 2,
    specialty: "Audio",
  },
  {
    slug: "open-model-reasoning",
    title: "Open Model Reasoning",
    date: "Jun 14, 2026",
    teams: 3214,
    medal: "Gold",
    teamSize: 1,
    specialty: "LLM / Generative AI",
  },
  {
    slug: "global-crop-mapping",
    title: "Global Crop Mapping",
    date: "Mar 09, 2026",
    teams: 1268,
    medal: "Silver",
    teamSize: 3,
    specialty: "Computer Vision",
  },
  {
    slug: "retail-demand-forecasting",
    title: "Retail Demand Forecasting",
    date: "Nov 22, 2025",
    teams: 2786,
    medal: "Silver",
    teamSize: 1,
    specialty: "Time Series",
  },
  {
    slug: "clinical-notes-classification",
    title: "Clinical Notes Classification",
    date: "Jul 05, 2025",
    teams: 957,
    medal: "Bronze",
    teamSize: 2,
    specialty: "NLP",
  },
  {
    slug: "insurance-risk-modeling",
    title: "Insurance Risk Modeling",
    date: "Feb 18, 2025",
    teams: 4120,
    medal: null,
    teamSize: 1,
    specialty: "Tabular",
  },
];

const baseRanks = [3, 8, 12, 24, 47, 89];

export function getCompetitionHistory(kaggler: Kaggler): CompetitionResult[] {
  const userIndex = Math.max(
    0,
    kagglers.findIndex((candidate) => candidate.username === kaggler.username),
  );

  return competitionTemplates.map((competition, index) => ({
    ...competition,
    rank: Math.min(
      competition.teams,
      baseRanks[index] + userIndex * (index + 1),
    ),
    specialty:
      kaggler.specialties[index % kaggler.specialties.length]?.name ??
      competition.specialty,
  }));
}

export function getPercentile(result: CompetitionResult) {
  return (result.rank / result.teams) * 100;
}

export function getResultScore(result: CompetitionResult) {
  if (result.resultScore !== undefined) return result.resultScore;

  const percentile = result.rank / result.teams;
  const placementScore = 100 * (1 - percentile) ** 2;
  const medalBonus =
    result.medal === "Gold"
      ? 30
      : result.medal === "Silver"
        ? 15
        : result.medal === "Bronze"
          ? 5
          : 0;
  const sizeWeight = Math.min(
    1.25,
    Math.max(0.5, Math.log10(Math.max(result.teams, 10)) / 3),
  );
  return (placementScore + medalBonus) * sizeWeight;
}
