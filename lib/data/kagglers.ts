import { cache } from "react";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  isNotNull,
  max,
  ne,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  competitionResults,
  competitionSpecialties,
  competitions,
  kagglers as kagglerTable,
  kagglerScores,
  specialtyScores,
  teamMembers,
} from "@/db/schema";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getRanking, type RankingKind } from "@/lib/rankings";
import {
  getCompetitionHistory,
  type CompetitionResult,
} from "@/seed/competitions";
import {
  getKaggler,
  kagglers as previewKagglers,
  specialties,
  type Kaggler,
} from "@/seed/kagglers";

export type DataSource = "database" | "preview";

export type DataStatus = {
  source: DataSource;
  updatedAt: Date | null;
};

export type Teammate = {
  username: string;
  displayName: string;
  competitionCount: number;
};

export type HomeData = DataStatus & {
  topKagglers: Kaggler[];
  trendingKagglers: Kaggler[];
  kagglerCount: number;
  medalTotals: { gold: number; silver: number; bronze: number };
  specialtyLeaders: Record<
    string,
    { leader: Kaggler | null; eligibleCount: number }
  >;
};

export type RankingPageData = DataStatus & {
  kagglers: Kaggler[];
  total: number;
  page: number;
  pageSize: number;
};

export type KagglerProfileData = DataStatus & {
  kaggler: Kaggler;
  history: CompetitionResult[];
  teammates: Teammate[];
};

const PAGE_SIZE = 50;

const summarySelection = {
  id: kagglerTable.id,
  username: kagglerTable.username,
  displayName: kagglerTable.displayName,
  registeredAt: kagglerTable.registeredAt,
  competitionTier: kagglerTable.competitionTier,
  officialRank: kagglerTable.officialRank,
  highestRank: kagglerTable.highestRank,
  goldCount: kagglerTable.goldCount,
  silverCount: kagglerTable.silverCount,
  bronzeCount: kagglerTable.bronzeCount,
  careerPower: kagglerScores.careerPower,
  careerRank: kagglerScores.careerRank,
  soloPower: kagglerScores.soloPower,
  soloRank: kagglerScores.soloRank,
  consistencyScore: kagglerScores.consistencyScore,
  consistencyRank: kagglerScores.consistencyRank,
  momentumScore: kagglerScores.momentumScore,
  momentumRank: kagglerScores.momentumRank,
  competitionCount: kagglerScores.competitionCount,
};

type SummaryRow = {
  id: number;
  username: string;
  displayName: string | null;
  registeredAt: Date | null;
  competitionTier: number | null;
  officialRank: number | null;
  highestRank: number | null;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  careerPower: number;
  careerRank: number;
  soloPower: number | null;
  soloRank: number | null;
  consistencyScore: number | null;
  consistencyRank: number | null;
  momentumScore: number;
  momentumRank: number;
  competitionCount: number;
};

function tierName(tier: number | null): Kaggler["tier"] {
  if (tier === 4) return "Grandmaster";
  if (tier === 3) return "Master";
  return "Expert";
}

function toKaggler(
  row: SummaryRow,
  profileSpecialties: Kaggler["specialties"] = [],
): Kaggler {
  return {
    username: row.username,
    displayName: row.displayName || row.username,
    tier: tierName(row.competitionTier),
    country: null,
    officialRank: row.officialRank,
    highestRank: row.highestRank,
    careerPower: row.careerPower,
    soloPower: row.soloPower,
    consistency: row.consistencyScore,
    momentum: row.momentumScore,
    competitionCount: row.competitionCount,
    medals: {
      gold: row.goldCount,
      silver: row.silverCount,
      bronze: row.bronzeCount,
    },
    specialties: profileSpecialties,
    joinedYear: row.registeredAt?.getUTCFullYear() ?? null,
    careerRank: row.careerRank,
    soloRank: row.soloRank,
    consistencyRank: row.consistencyRank,
    momentumRank: row.momentumRank,
  };
}

async function database() {
  const { getDb } = await import("@/lib/db/client");
  return getDb();
}

function rankColumn(kind: RankingKind) {
  if (kind === "momentum") return kagglerScores.momentumRank;
  if (kind === "solo") return kagglerScores.soloRank;
  if (kind === "consistency") return kagglerScores.consistencyRank;
  return kagglerScores.careerRank;
}

function eligibility(kind: RankingKind) {
  if (kind === "solo") return isNotNull(kagglerScores.soloPower);
  if (kind === "consistency") return isNotNull(kagglerScores.consistencyScore);
  return undefined;
}

async function databaseSummaries(kind: RankingKind, limit: number, offset = 0) {
  const db = await database();
  const rows = await db
    .select(summarySelection)
    .from(kagglerTable)
    .innerJoin(kagglerScores, eq(kagglerScores.kagglerId, kagglerTable.id))
    .where(eligibility(kind))
    .orderBy(asc(rankColumn(kind)))
    .limit(limit)
    .offset(offset);
  return rows.map((row) => toKaggler(row));
}

async function latestCalculation() {
  const db = await database();
  const [row] = await db
    .select({ value: max(kagglerScores.calculatedAt) })
    .from(kagglerScores);
  return row?.value ?? null;
}

function previewStatus(): DataStatus {
  return { source: "preview", updatedAt: null };
}

export const getHomeData = cache(async (): Promise<HomeData> => {
  if (!isDatabaseConfigured()) {
    const medalTotals = previewKagglers.reduce(
      (totals, kaggler) => ({
        gold: totals.gold + kaggler.medals.gold,
        silver: totals.silver + kaggler.medals.silver,
        bronze: totals.bronze + kaggler.medals.bronze,
      }),
      { gold: 0, silver: 0, bronze: 0 },
    );
    const specialtyLeaders = Object.fromEntries(
      specialties.map((specialty) => {
        const eligible = previewKagglers
          .filter((kaggler) =>
            kaggler.specialties.some((item) => item.name === specialty.name),
          )
          .sort(
            (a, b) =>
              (b.specialties.find((item) => item.name === specialty.name)
                ?.score ?? 0) -
              (a.specialties.find((item) => item.name === specialty.name)
                ?.score ?? 0),
          );
        return [
          specialty.name,
          { leader: eligible[0] ?? null, eligibleCount: eligible.length },
        ];
      }),
    );
    return {
      ...previewStatus(),
      topKagglers: previewKagglers.slice(0, 5),
      trendingKagglers: getRanking("momentum").slice(0, 4),
      kagglerCount: previewKagglers.length,
      medalTotals,
      specialtyLeaders,
    };
  }

  const db = await database();
  const [topKagglers, trendingKagglers, totals, updatedAt, specialtyEntries] =
    await Promise.all([
      databaseSummaries("overall", 5),
      databaseSummaries("momentum", 4),
      db
        .select({
          kagglerCount: count(),
          gold: sql<number>`coalesce(sum(${kagglerTable.goldCount}), 0)::int`,
          silver: sql<number>`coalesce(sum(${kagglerTable.silverCount}), 0)::int`,
          bronze: sql<number>`coalesce(sum(${kagglerTable.bronzeCount}), 0)::int`,
        })
        .from(kagglerTable),
      latestCalculation(),
      Promise.all(
        specialties.map(async (specialty) => {
          const [leaderRow, countRow] = await Promise.all([
            db
              .select({
                ...summarySelection,
                specialtyScore: specialtyScores.score,
              })
              .from(specialtyScores)
              .innerJoin(
                kagglerTable,
                eq(kagglerTable.id, specialtyScores.kagglerId),
              )
              .innerJoin(
                kagglerScores,
                eq(kagglerScores.kagglerId, kagglerTable.id),
              )
              .where(eq(specialtyScores.specialty, specialty.name))
              .orderBy(desc(specialtyScores.score))
              .limit(1),
            db
              .select({ value: count() })
              .from(specialtyScores)
              .where(eq(specialtyScores.specialty, specialty.name)),
          ]);
          return [
            specialty.name,
            {
              leader: leaderRow[0]
                ? toKaggler(leaderRow[0], [
                    {
                      name: specialty.name,
                      score: leaderRow[0].specialtyScore,
                    },
                  ])
                : null,
              eligibleCount: countRow[0]?.value ?? 0,
            },
          ] as const;
        }),
      ),
    ]);
  const total = totals[0];
  return {
    source: "database",
    updatedAt,
    topKagglers,
    trendingKagglers,
    kagglerCount: total?.kagglerCount ?? 0,
    medalTotals: {
      gold: total?.gold ?? 0,
      silver: total?.silver ?? 0,
      bronze: total?.bronze ?? 0,
    },
    specialtyLeaders: Object.fromEntries(specialtyEntries),
  };
});

export const getRankingPage = cache(
  async (kind: RankingKind, requestedPage = 1): Promise<RankingPageData> => {
    const page = Math.max(1, Math.floor(requestedPage));
    if (!isDatabaseConfigured()) {
      const ranking = getRanking(kind);
      const totalPages = Math.max(1, Math.ceil(ranking.length / PAGE_SIZE));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * PAGE_SIZE;
      return {
        ...previewStatus(),
        kagglers: ranking.slice(start, start + PAGE_SIZE),
        total: ranking.length,
        page: safePage,
        pageSize: PAGE_SIZE,
      };
    }

    const db = await database();
    const [totalRows, updatedAt] = await Promise.all([
      db
        .select({ value: count() })
        .from(kagglerTable)
        .innerJoin(kagglerScores, eq(kagglerScores.kagglerId, kagglerTable.id))
        .where(eligibility(kind)),
      latestCalculation(),
    ]);
    const total = totalRows[0]?.value ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const rows = await databaseSummaries(
      kind,
      PAGE_SIZE,
      (safePage - 1) * PAGE_SIZE,
    );
    return {
      source: "database",
      updatedAt,
      kagglers: rows,
      total,
      page: safePage,
      pageSize: PAGE_SIZE,
    };
  },
);

export const getKagglerProfileData = cache(
  async (username: string): Promise<KagglerProfileData | null> => {
    if (!isDatabaseConfigured()) {
      const kaggler = getKaggler(username);
      if (!kaggler) return null;
      const index = previewKagglers.findIndex(
        (candidate) => candidate.username === username,
      );
      return {
        ...previewStatus(),
        kaggler,
        history: getCompetitionHistory(kaggler),
        teammates: [1, 4, 7].map((distance, teammateIndex) => {
          const teammate =
            previewKagglers[(index + distance) % previewKagglers.length];
          return {
            username: teammate.username,
            displayName: teammate.displayName,
            competitionCount: 8 - teammateIndex * 2,
          };
        }),
      };
    }

    const db = await database();
    const [row] = await db
      .select(summarySelection)
      .from(kagglerTable)
      .innerJoin(kagglerScores, eq(kagglerScores.kagglerId, kagglerTable.id))
      .where(eq(kagglerTable.username, username))
      .limit(1);
    if (!row) return null;

    const mine = alias(teamMembers, "mine");
    const peer = alias(teamMembers, "peer");
    const [specialtyRows, resultRows, teammateRows, updatedAt] =
      await Promise.all([
        db
          .select({
            name: specialtyScores.specialty,
            score: specialtyScores.score,
          })
          .from(specialtyScores)
          .where(eq(specialtyScores.kagglerId, row.id))
          .orderBy(desc(specialtyScores.score)),
        db
          .select({
            competitionId: competitions.id,
            slug: competitions.slug,
            title: competitions.title,
            resultDate: competitionResults.resultDate,
            finalRank: competitionResults.finalRank,
            totalTeams: competitionResults.totalTeams,
            medal: competitionResults.medal,
            teamSize: competitionResults.teamSize,
            specialty: competitionSpecialties.specialty,
          })
          .from(competitionResults)
          .innerJoin(
            competitions,
            eq(competitions.id, competitionResults.competitionId),
          )
          .leftJoin(
            competitionSpecialties,
            eq(competitionSpecialties.competitionId, competitions.id),
          )
          .where(eq(competitionResults.kagglerId, row.id))
          .orderBy(desc(competitionResults.resultDate)),
        db
          .select({
            username: kagglerTable.username,
            displayName: kagglerTable.displayName,
            competitionCount: countDistinct(peer.teamId),
          })
          .from(mine)
          .innerJoin(
            peer,
            and(
              eq(peer.teamId, mine.teamId),
              ne(peer.kagglerId, mine.kagglerId),
            ),
          )
          .innerJoin(kagglerTable, eq(kagglerTable.id, peer.kagglerId))
          .where(eq(mine.kagglerId, row.id))
          .groupBy(
            kagglerTable.id,
            kagglerTable.username,
            kagglerTable.displayName,
          )
          .orderBy(desc(countDistinct(peer.teamId)))
          .limit(3),
        latestCalculation(),
      ]);

    const resultByCompetition = new Map<number, CompetitionResult>();
    for (const result of resultRows) {
      if (resultByCompetition.has(result.competitionId)) continue;
      resultByCompetition.set(result.competitionId, {
        slug: result.slug,
        title: result.title,
        date: new Intl.DateTimeFormat("en", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        }).format(result.resultDate),
        rank: result.finalRank,
        teams: result.totalTeams,
        medal: result.medal as CompetitionResult["medal"],
        teamSize: result.teamSize,
        specialty: result.specialty ?? "Other",
      });
    }

    const profileSpecialties = specialtyRows.map((specialty) => ({
      name: specialty.name,
      score: specialty.score,
    }));
    return {
      source: "database",
      updatedAt,
      kaggler: toKaggler(row, profileSpecialties),
      history: [...resultByCompetition.values()],
      teammates: teammateRows.map((teammate) => ({
        username: teammate.username,
        displayName: teammate.displayName || teammate.username,
        competitionCount: teammate.competitionCount,
      })),
    };
  },
);
