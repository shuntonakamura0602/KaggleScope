CREATE TABLE "competition_results" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kaggler_id" bigint NOT NULL,
	"competition_id" bigint NOT NULL,
	"team_id" bigint NOT NULL,
	"final_rank" integer NOT NULL,
	"total_teams" integer NOT NULL,
	"percentile" numeric(12, 10) NOT NULL,
	"medal" text,
	"team_size" integer NOT NULL,
	"is_solo" boolean NOT NULL,
	"result_score" numeric(14, 4) NOT NULL,
	"result_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competition_results_kaggler_competition_unique" UNIQUE("kaggler_id","competition_id"),
	CONSTRAINT "competition_results_rank_positive" CHECK ("competition_results"."final_rank" > 0),
	CONSTRAINT "competition_results_total_teams_positive" CHECK ("competition_results"."total_teams" > 0),
	CONSTRAINT "competition_results_rank_within_teams" CHECK ("competition_results"."final_rank" <= "competition_results"."total_teams"),
	CONSTRAINT "competition_results_percentile_range" CHECK ("competition_results"."percentile" > 0 and "competition_results"."percentile" <= 1),
	CONSTRAINT "competition_results_team_size_positive" CHECK ("competition_results"."team_size" >= 1),
	CONSTRAINT "competition_results_solo_matches_team_size" CHECK ("competition_results"."is_solo" = ("competition_results"."team_size" = 1)),
	CONSTRAINT "competition_results_medal_valid" CHECK ("competition_results"."medal" is null or "competition_results"."medal" in ('Gold', 'Silver', 'Bronze'))
);
--> statement-breakpoint
CREATE TABLE "competition_specialties" (
	"competition_id" bigint NOT NULL,
	"specialty" text NOT NULL,
	"confidence" numeric(5, 4) NOT NULL,
	"classification_source" text NOT NULL,
	CONSTRAINT "competition_specialties_competition_id_specialty_pk" PRIMARY KEY("competition_id","specialty"),
	CONSTRAINT "competition_specialties_confidence_range" CHECK ("competition_specialties"."confidence" >= 0 and "competition_specialties"."confidence" <= 1),
	CONSTRAINT "competition_specialties_source_valid" CHECK ("competition_specialties"."classification_source" in ('tag', 'manual', 'llm'))
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kaggle_competition_id" bigint NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"enabled_at" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"total_teams" integer,
	"total_competitors" integer,
	"competition_type" text,
	"can_qualify_tiers" boolean DEFAULT false NOT NULL,
	"has_leaderboard" boolean DEFAULT false NOT NULL,
	"host_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competitions_kaggle_competition_id_unique" UNIQUE("kaggle_competition_id"),
	CONSTRAINT "competitions_slug_unique" UNIQUE("slug"),
	CONSTRAINT "competitions_team_counts_non_negative" CHECK (("competitions"."total_teams" is null or "competitions"."total_teams" >= 0) and ("competitions"."total_competitors" is null or "competitions"."total_competitors" >= 0))
);
--> statement-breakpoint
CREATE TABLE "etl_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"meta_kaggle_version" text,
	"users_processed" integer DEFAULT 0 NOT NULL,
	"competitions_processed" integer DEFAULT 0 NOT NULL,
	"results_processed" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	CONSTRAINT "etl_runs_status_valid" CHECK ("etl_runs"."status" in ('running', 'succeeded', 'failed')),
	CONSTRAINT "etl_runs_counts_non_negative" CHECK ("etl_runs"."users_processed" >= 0 and "etl_runs"."competitions_processed" >= 0 and "etl_runs"."results_processed" >= 0)
);
--> statement-breakpoint
CREATE TABLE "kaggler_scores" (
	"kaggler_id" bigint PRIMARY KEY NOT NULL,
	"score_version" text NOT NULL,
	"career_raw" numeric(14, 4) NOT NULL,
	"career_power" numeric(6, 3) NOT NULL,
	"career_rank" integer NOT NULL,
	"solo_raw" numeric(14, 4),
	"solo_power" numeric(6, 3),
	"solo_rank" integer,
	"consistency_raw" numeric(14, 4),
	"consistency_score" numeric(6, 3),
	"consistency_rank" integer,
	"momentum_raw" numeric(14, 4) NOT NULL,
	"momentum_score" numeric(6, 3) NOT NULL,
	"momentum_rank" integer NOT NULL,
	"competition_count" integer DEFAULT 0 NOT NULL,
	"solo_competition_count" integer DEFAULT 0 NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kaggler_scores_powers_in_range" CHECK ("kaggler_scores"."career_power" between 0 and 100
        and ("kaggler_scores"."solo_power" is null or "kaggler_scores"."solo_power" between 0 and 100)
        and ("kaggler_scores"."consistency_score" is null or "kaggler_scores"."consistency_score" between 0 and 100)
        and "kaggler_scores"."momentum_score" between 0 and 100),
	CONSTRAINT "kaggler_scores_counts_non_negative" CHECK ("kaggler_scores"."competition_count" >= 0 and "kaggler_scores"."solo_competition_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "kagglers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kaggle_user_id" bigint NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"registered_at" timestamp with time zone,
	"competition_tier" smallint,
	"official_points" numeric(14, 4),
	"official_rank" integer,
	"highest_rank" integer,
	"gold_count" integer DEFAULT 0 NOT NULL,
	"silver_count" integer DEFAULT 0 NOT NULL,
	"bronze_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kagglers_kaggle_user_id_unique" UNIQUE("kaggle_user_id"),
	CONSTRAINT "kagglers_username_unique" UNIQUE("username"),
	CONSTRAINT "kagglers_official_rank_positive" CHECK ("kagglers"."official_rank" is null or "kagglers"."official_rank" > 0),
	CONSTRAINT "kagglers_highest_rank_positive" CHECK ("kagglers"."highest_rank" is null or "kagglers"."highest_rank" > 0),
	CONSTRAINT "kagglers_medal_counts_non_negative" CHECK ("kagglers"."gold_count" >= 0 and "kagglers"."silver_count" >= 0 and "kagglers"."bronze_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ranking_snapshots" (
	"snapshot_date" date NOT NULL,
	"kaggler_id" bigint NOT NULL,
	"official_rank" integer,
	"official_points" numeric(14, 4),
	"career_rank" integer,
	"career_power" numeric(6, 3),
	CONSTRAINT "ranking_snapshots_snapshot_date_kaggler_id_pk" PRIMARY KEY("snapshot_date","kaggler_id")
);
--> statement-breakpoint
CREATE TABLE "specialty_scores" (
	"kaggler_id" bigint NOT NULL,
	"specialty" text NOT NULL,
	"raw_score" numeric(14, 4) NOT NULL,
	"score" numeric(6, 3) NOT NULL,
	"rank" integer NOT NULL,
	"competition_count" integer DEFAULT 0 NOT NULL,
	"gold_count" integer DEFAULT 0 NOT NULL,
	"silver_count" integer DEFAULT 0 NOT NULL,
	"bronze_count" integer DEFAULT 0 NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "specialty_scores_kaggler_id_specialty_pk" PRIMARY KEY("kaggler_id","specialty"),
	CONSTRAINT "specialty_scores_score_range" CHECK ("specialty_scores"."score" between 0 and 100),
	CONSTRAINT "specialty_scores_counts_non_negative" CHECK ("specialty_scores"."competition_count" >= 0 and "specialty_scores"."gold_count" >= 0 and "specialty_scores"."silver_count" >= 0 and "specialty_scores"."bronze_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" bigint NOT NULL,
	"kaggler_id" bigint NOT NULL,
	CONSTRAINT "team_members_team_id_kaggler_id_pk" PRIMARY KEY("team_id","kaggler_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kaggle_team_id" bigint NOT NULL,
	"competition_id" bigint NOT NULL,
	"team_name" text,
	"private_rank" integer,
	"public_rank" integer,
	"medal" text,
	"medal_awarded_at" timestamp with time zone,
	"team_size" integer NOT NULL,
	"is_benchmark" boolean DEFAULT false NOT NULL,
	CONSTRAINT "teams_kaggle_team_id_unique" UNIQUE("kaggle_team_id"),
	CONSTRAINT "teams_private_rank_positive" CHECK ("teams"."private_rank" is null or "teams"."private_rank" > 0),
	CONSTRAINT "teams_public_rank_positive" CHECK ("teams"."public_rank" is null or "teams"."public_rank" > 0),
	CONSTRAINT "teams_team_size_positive" CHECK ("teams"."team_size" >= 1),
	CONSTRAINT "teams_medal_valid" CHECK ("teams"."medal" is null or "teams"."medal" in ('Gold', 'Silver', 'Bronze'))
);
--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_kaggler_id_kagglers_id_fk" FOREIGN KEY ("kaggler_id") REFERENCES "public"."kagglers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_specialties" ADD CONSTRAINT "competition_specialties_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kaggler_scores" ADD CONSTRAINT "kaggler_scores_kaggler_id_kagglers_id_fk" FOREIGN KEY ("kaggler_id") REFERENCES "public"."kagglers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_kaggler_id_kagglers_id_fk" FOREIGN KEY ("kaggler_id") REFERENCES "public"."kagglers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialty_scores" ADD CONSTRAINT "specialty_scores_kaggler_id_kagglers_id_fk" FOREIGN KEY ("kaggler_id") REFERENCES "public"."kagglers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_kaggler_id_kagglers_id_fk" FOREIGN KEY ("kaggler_id") REFERENCES "public"."kagglers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competition_results_kaggler_id_idx" ON "competition_results" USING btree ("kaggler_id");--> statement-breakpoint
CREATE INDEX "competition_results_competition_id_idx" ON "competition_results" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "competition_results_result_score_idx" ON "competition_results" USING btree ("result_score");--> statement-breakpoint
CREATE INDEX "etl_runs_started_at_idx" ON "etl_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "kaggler_scores_career_power_idx" ON "kaggler_scores" USING btree ("career_power");--> statement-breakpoint
CREATE INDEX "kaggler_scores_momentum_score_idx" ON "kaggler_scores" USING btree ("momentum_score");--> statement-breakpoint
CREATE INDEX "kaggler_scores_solo_power_idx" ON "kaggler_scores" USING btree ("solo_power");--> statement-breakpoint
CREATE INDEX "kagglers_username_idx" ON "kagglers" USING btree ("username");--> statement-breakpoint
CREATE INDEX "kagglers_official_rank_idx" ON "kagglers" USING btree ("official_rank");--> statement-breakpoint
CREATE INDEX "ranking_snapshots_kaggler_id_idx" ON "ranking_snapshots" USING btree ("kaggler_id");--> statement-breakpoint
CREATE INDEX "specialty_scores_specialty_score_idx" ON "specialty_scores" USING btree ("specialty","score");--> statement-breakpoint
CREATE INDEX "team_members_kaggler_id_idx" ON "team_members" USING btree ("kaggler_id");--> statement-breakpoint
CREATE INDEX "teams_competition_id_idx" ON "teams" USING btree ("competition_id");