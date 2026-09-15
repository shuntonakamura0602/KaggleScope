import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => bigserial("id", { mode: "number" }).primaryKey();
const externalId = (name: string) => bigint(name, { mode: "number" });
const score = (name: string) =>
  numeric(name, { precision: 14, scale: 4, mode: "number" });
const power = (name: string) =>
  numeric(name, { precision: 6, scale: 3, mode: "number" });
const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const kagglers = pgTable(
  "kagglers",
  {
    id: id(),
    kaggleUserId: externalId("kaggle_user_id").notNull().unique(),
    username: text("username").notNull().unique(),
    displayName: text("display_name"),
    registeredAt: timestamp("registered_at", { withTimezone: true }),
    competitionTier: smallint("competition_tier"),
    officialPoints: numeric("official_points", {
      precision: 14,
      scale: 4,
      mode: "number",
    }),
    officialRank: integer("official_rank"),
    highestRank: integer("highest_rank"),
    goldCount: integer("gold_count").default(0).notNull(),
    silverCount: integer("silver_count").default(0).notNull(),
    bronzeCount: integer("bronze_count").default(0).notNull(),
    ...timestamps(),
  },
  (table) => [
    index("kagglers_username_idx").on(table.username),
    index("kagglers_official_rank_idx").on(table.officialRank),
    check(
      "kagglers_official_rank_positive",
      sql`${table.officialRank} is null or ${table.officialRank} > 0`,
    ),
    check(
      "kagglers_highest_rank_positive",
      sql`${table.highestRank} is null or ${table.highestRank} > 0`,
    ),
    check(
      "kagglers_medal_counts_non_negative",
      sql`${table.goldCount} >= 0 and ${table.silverCount} >= 0 and ${table.bronzeCount} >= 0`,
    ),
  ],
);

export const competitions = pgTable(
  "competitions",
  {
    id: id(),
    kaggleCompetitionId: externalId("kaggle_competition_id").notNull().unique(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    enabledAt: timestamp("enabled_at", { withTimezone: true }),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    totalTeams: integer("total_teams"),
    totalCompetitors: integer("total_competitors"),
    competitionType: text("competition_type"),
    canQualifyTiers: boolean("can_qualify_tiers").default(false).notNull(),
    hasLeaderboard: boolean("has_leaderboard").default(false).notNull(),
    hostName: text("host_name"),
    ...timestamps(),
  },
  (table) => [
    check(
      "competitions_team_counts_non_negative",
      sql`(${table.totalTeams} is null or ${table.totalTeams} >= 0) and (${table.totalCompetitors} is null or ${table.totalCompetitors} >= 0)`,
    ),
  ],
);

export const competitionSpecialties = pgTable(
  "competition_specialties",
  {
    competitionId: bigint("competition_id", { mode: "number" })
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    specialty: text("specialty").notNull(),
    confidence: numeric("confidence", {
      precision: 5,
      scale: 4,
      mode: "number",
    }).notNull(),
    classificationSource: text("classification_source").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.competitionId, table.specialty] }),
    check(
      "competition_specialties_confidence_range",
      sql`${table.confidence} >= 0 and ${table.confidence} <= 1`,
    ),
    check(
      "competition_specialties_source_valid",
      sql`${table.classificationSource} in ('tag', 'manual', 'llm')`,
    ),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: id(),
    kaggleTeamId: externalId("kaggle_team_id").notNull().unique(),
    competitionId: bigint("competition_id", { mode: "number" })
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    teamName: text("team_name"),
    privateRank: integer("private_rank"),
    publicRank: integer("public_rank"),
    medal: text("medal"),
    medalAwardedAt: timestamp("medal_awarded_at", { withTimezone: true }),
    teamSize: integer("team_size").notNull(),
    isBenchmark: boolean("is_benchmark").default(false).notNull(),
  },
  (table) => [
    index("teams_competition_id_idx").on(table.competitionId),
    check(
      "teams_private_rank_positive",
      sql`${table.privateRank} is null or ${table.privateRank} > 0`,
    ),
    check(
      "teams_public_rank_positive",
      sql`${table.publicRank} is null or ${table.publicRank} > 0`,
    ),
    check("teams_team_size_positive", sql`${table.teamSize} >= 1`),
    check(
      "teams_medal_valid",
      sql`${table.medal} is null or ${table.medal} in ('Gold', 'Silver', 'Bronze')`,
    ),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: bigint("team_id", { mode: "number" })
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    kagglerId: bigint("kaggler_id", { mode: "number" })
      .notNull()
      .references(() => kagglers.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.kagglerId] }),
    index("team_members_kaggler_id_idx").on(table.kagglerId),
  ],
);

export const competitionResults = pgTable(
  "competition_results",
  {
    id: id(),
    kagglerId: bigint("kaggler_id", { mode: "number" })
      .notNull()
      .references(() => kagglers.id, { onDelete: "cascade" }),
    competitionId: bigint("competition_id", { mode: "number" })
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    teamId: bigint("team_id", { mode: "number" })
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    finalRank: integer("final_rank").notNull(),
    totalTeams: integer("total_teams").notNull(),
    percentile: numeric("percentile", {
      precision: 12,
      scale: 10,
      mode: "number",
    }).notNull(),
    medal: text("medal"),
    teamSize: integer("team_size").notNull(),
    isSolo: boolean("is_solo").notNull(),
    resultScore: score("result_score").notNull(),
    resultDate: timestamp("result_date", { withTimezone: true }).notNull(),
    ...timestamps(),
  },
  (table) => [
    unique("competition_results_kaggler_competition_unique").on(
      table.kagglerId,
      table.competitionId,
    ),
    index("competition_results_kaggler_id_idx").on(table.kagglerId),
    index("competition_results_competition_id_idx").on(table.competitionId),
    index("competition_results_result_score_idx").on(table.resultScore),
    check("competition_results_rank_positive", sql`${table.finalRank} > 0`),
    check(
      "competition_results_total_teams_positive",
      sql`${table.totalTeams} > 0`,
    ),
    check(
      "competition_results_rank_within_teams",
      sql`${table.finalRank} <= ${table.totalTeams}`,
    ),
    check(
      "competition_results_percentile_range",
      sql`${table.percentile} > 0 and ${table.percentile} <= 1`,
    ),
    check(
      "competition_results_team_size_positive",
      sql`${table.teamSize} >= 1`,
    ),
    check(
      "competition_results_solo_matches_team_size",
      sql`${table.isSolo} = (${table.teamSize} = 1)`,
    ),
    check(
      "competition_results_medal_valid",
      sql`${table.medal} is null or ${table.medal} in ('Gold', 'Silver', 'Bronze')`,
    ),
  ],
);

export const kagglerScores = pgTable(
  "kaggler_scores",
  {
    kagglerId: bigint("kaggler_id", { mode: "number" })
      .primaryKey()
      .references(() => kagglers.id, { onDelete: "cascade" }),
    scoreVersion: text("score_version").notNull(),
    careerRaw: score("career_raw").notNull(),
    careerPower: power("career_power").notNull(),
    careerRank: integer("career_rank").notNull(),
    soloRaw: score("solo_raw"),
    soloPower: power("solo_power"),
    soloRank: integer("solo_rank"),
    consistencyRaw: score("consistency_raw"),
    consistencyScore: power("consistency_score"),
    consistencyRank: integer("consistency_rank"),
    momentumRaw: score("momentum_raw").notNull(),
    momentumScore: power("momentum_score").notNull(),
    momentumRank: integer("momentum_rank").notNull(),
    competitionCount: integer("competition_count").default(0).notNull(),
    soloCompetitionCount: integer("solo_competition_count")
      .default(0)
      .notNull(),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("kaggler_scores_career_power_idx").on(table.careerPower),
    index("kaggler_scores_momentum_score_idx").on(table.momentumScore),
    index("kaggler_scores_solo_power_idx").on(table.soloPower),
    check(
      "kaggler_scores_powers_in_range",
      sql`${table.careerPower} between 0 and 100
        and (${table.soloPower} is null or ${table.soloPower} between 0 and 100)
        and (${table.consistencyScore} is null or ${table.consistencyScore} between 0 and 100)
        and ${table.momentumScore} between 0 and 100`,
    ),
    check(
      "kaggler_scores_counts_non_negative",
      sql`${table.competitionCount} >= 0 and ${table.soloCompetitionCount} >= 0`,
    ),
  ],
);

export const specialtyScores = pgTable(
  "specialty_scores",
  {
    kagglerId: bigint("kaggler_id", { mode: "number" })
      .notNull()
      .references(() => kagglers.id, { onDelete: "cascade" }),
    specialty: text("specialty").notNull(),
    rawScore: score("raw_score").notNull(),
    score: power("score").notNull(),
    rank: integer("rank").notNull(),
    competitionCount: integer("competition_count").default(0).notNull(),
    goldCount: integer("gold_count").default(0).notNull(),
    silverCount: integer("silver_count").default(0).notNull(),
    bronzeCount: integer("bronze_count").default(0).notNull(),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.kagglerId, table.specialty] }),
    index("specialty_scores_specialty_score_idx").on(
      table.specialty,
      table.score,
    ),
    check(
      "specialty_scores_score_range",
      sql`${table.score} between 0 and 100`,
    ),
    check(
      "specialty_scores_counts_non_negative",
      sql`${table.competitionCount} >= 0 and ${table.goldCount} >= 0 and ${table.silverCount} >= 0 and ${table.bronzeCount} >= 0`,
    ),
  ],
);

export const rankingSnapshots = pgTable(
  "ranking_snapshots",
  {
    snapshotDate: date("snapshot_date", { mode: "string" }).notNull(),
    kagglerId: bigint("kaggler_id", { mode: "number" })
      .notNull()
      .references(() => kagglers.id, { onDelete: "cascade" }),
    officialRank: integer("official_rank"),
    officialPoints: numeric("official_points", {
      precision: 14,
      scale: 4,
      mode: "number",
    }),
    careerRank: integer("career_rank"),
    careerPower: power("career_power"),
  },
  (table) => [
    primaryKey({ columns: [table.snapshotDate, table.kagglerId] }),
    index("ranking_snapshots_kaggler_id_idx").on(table.kagglerId),
  ],
);

export const etlRuns = pgTable(
  "etl_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: text("status").notNull(),
    metaKaggleVersion: text("meta_kaggle_version"),
    usersProcessed: integer("users_processed").default(0).notNull(),
    competitionsProcessed: integer("competitions_processed")
      .default(0)
      .notNull(),
    resultsProcessed: integer("results_processed").default(0).notNull(),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("etl_runs_started_at_idx").on(table.startedAt),
    check(
      "etl_runs_status_valid",
      sql`${table.status} in ('running', 'succeeded', 'failed')`,
    ),
    check(
      "etl_runs_counts_non_negative",
      sql`${table.usersProcessed} >= 0 and ${table.competitionsProcessed} >= 0 and ${table.resultsProcessed} >= 0`,
    ),
  ],
);

export type KagglerRow = typeof kagglers.$inferSelect;
export type NewKagglerRow = typeof kagglers.$inferInsert;
