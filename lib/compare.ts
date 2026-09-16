import type { CompetitionResult } from "@/seed/competitions";
import { specialties, type Kaggler } from "@/seed/kagglers";

export type ComparisonWinner = "left" | "right" | "draw";

export type SharedCompetition = {
  slug: string;
  title: string;
  date: string;
  teams: number;
  leftRank: number;
  rightRank: number;
  winner: ComparisonWinner;
};

export type HeadToHead = {
  competitions: SharedCompetition[];
  leftWins: number;
  rightWins: number;
  draws: number;
};

export type SpecialtyComparison = {
  name: string;
  slug: string;
  accent: string;
  leftScore: number | null;
  rightScore: number | null;
  winner: ComparisonWinner | null;
};

export function compareRanks(leftRank: number, rightRank: number) {
  if (leftRank === rightRank) return "draw" as const;
  return leftRank < rightRank ? ("left" as const) : ("right" as const);
}

export function buildHeadToHead(
  leftHistory: CompetitionResult[],
  rightHistory: CompetitionResult[],
): HeadToHead {
  const rightBySlug = new Map(
    rightHistory.map((result) => [result.slug, result]),
  );
  const competitions = leftHistory.flatMap((leftResult) => {
    const rightResult = rightBySlug.get(leftResult.slug);
    if (!rightResult) return [];

    return [
      {
        slug: leftResult.slug,
        title: leftResult.title,
        date: leftResult.date,
        teams: Math.max(leftResult.teams, rightResult.teams),
        leftRank: leftResult.rank,
        rightRank: rightResult.rank,
        winner: compareRanks(leftResult.rank, rightResult.rank),
      },
    ];
  });

  return {
    competitions,
    leftWins: competitions.filter((result) => result.winner === "left").length,
    rightWins: competitions.filter((result) => result.winner === "right")
      .length,
    draws: competitions.filter((result) => result.winner === "draw").length,
  };
}

export function buildSpecialtyComparison(
  left: Kaggler,
  right: Kaggler,
): SpecialtyComparison[] {
  return specialties.map((specialty) => {
    const leftScore =
      left.specialties.find((item) => item.name === specialty.name)?.score ??
      null;
    const rightScore =
      right.specialties.find((item) => item.name === specialty.name)?.score ??
      null;
    const winner =
      leftScore === null || rightScore === null
        ? null
        : leftScore === rightScore
          ? "draw"
          : leftScore > rightScore
            ? "left"
            : "right";

    return {
      ...specialty,
      leftScore,
      rightScore,
      winner,
    };
  });
}
