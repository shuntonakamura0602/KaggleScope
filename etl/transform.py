"""Polars transformations from Meta Kaggle tables to persistence-ready rows."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import polars as pl

from .contracts import CONTRACTS

EXPERT_TIER = 2
GRANDMASTER_TIER = 4
NULL_VALUES = ["", "NA", "N/A", "NULL", "null"]


@dataclass(frozen=True)
class TransformedData:
    kagglers: pl.DataFrame
    competitions: pl.DataFrame
    teams: pl.DataFrame
    team_members: pl.DataFrame

    @property
    def counts(self) -> dict[str, int]:
        return {
            "kagglers": self.kagglers.height,
            "competitions": self.competitions.height,
            "teams": self.teams.height,
            "team_members": self.team_members.height,
        }


def _scan(path: Path) -> pl.LazyFrame:
    return pl.scan_csv(
        path,
        null_values=NULL_VALUES,
        infer_schema_length=10_000,
        low_memory=True,
    )


def _column(columns: set[str], name: str, dtype: pl.DataType) -> pl.Expr:
    if name in columns:
        return pl.col(name).cast(dtype, strict=False)
    return pl.lit(None, dtype=dtype)


def _text(columns: set[str], name: str) -> pl.Expr:
    return _column(columns, name, pl.String)


def _integer(columns: set[str], name: str) -> pl.Expr:
    return _column(columns, name, pl.Int64)


def _float(columns: set[str], name: str) -> pl.Expr:
    return _column(columns, name, pl.Float64)


def _boolean(columns: set[str], name: str, *, default: bool = False) -> pl.Expr:
    if name not in columns:
        return pl.lit(default, dtype=pl.Boolean)
    normalized = pl.col(name).cast(pl.String, strict=False).str.to_lowercase()
    return normalized.is_in(["true", "1", "yes", "t"]).fill_null(default)


def _medal(columns: set[str]) -> pl.Expr:
    if "Medal" not in columns:
        return pl.lit(None, dtype=pl.String)
    value = pl.col("Medal").cast(pl.String, strict=False).str.to_lowercase()
    return (
        pl.when(value.is_in(["1", "gold"]))
        .then(pl.lit("Gold"))
        .when(value.is_in(["2", "silver"]))
        .then(pl.lit("Silver"))
        .when(value.is_in(["3", "bronze"]))
        .then(pl.lit("Bronze"))
        .otherwise(pl.lit(None, dtype=pl.String))
    )


def transform_sources(
    data_dir: Path, columns_by_source: dict[str, set[str]]
) -> TransformedData:
    achievements_columns = columns_by_source["achievements"]
    competition_achievements = (
        _scan(data_dir / CONTRACTS["achievements"].filename)
        .filter(
            pl.col("AchievementType")
            .cast(pl.String)
            .str.to_lowercase()
            .is_in(["competition", "competitions"])
            & pl.col("Tier")
            .cast(pl.Int64, strict=False)
            .is_between(EXPERT_TIER, GRANDMASTER_TIER)
        )
        .select(
            pl.col("UserId").cast(pl.Int64, strict=False).alias("kaggle_user_id"),
            pl.col("Tier").cast(pl.Int16, strict=False).alias("competition_tier"),
            _float(achievements_columns, "Points").alias("official_points"),
            _integer(achievements_columns, "CurrentRanking").alias("official_rank"),
            _integer(achievements_columns, "HighestRanking").alias("highest_rank"),
            _integer(achievements_columns, "TotalGold")
            .fill_null(0)
            .alias("gold_count"),
            _integer(achievements_columns, "TotalSilver")
            .fill_null(0)
            .alias("silver_count"),
            _integer(achievements_columns, "TotalBronze")
            .fill_null(0)
            .alias("bronze_count"),
        )
        .group_by("kaggle_user_id")
        .agg(pl.all().max())
    )

    users_columns = columns_by_source["users"]
    users = _scan(data_dir / CONTRACTS["users"].filename).select(
        pl.col("Id").cast(pl.Int64, strict=False).alias("kaggle_user_id"),
        pl.col("UserName").cast(pl.String).alias("username"),
        _text(users_columns, "DisplayName").alias("display_name"),
        _text(users_columns, "RegisterDate").alias("registered_at"),
    )
    kagglers = (
        users.join(competition_achievements, on="kaggle_user_id", how="inner")
        .filter(
            pl.col("kaggle_user_id").is_not_null() & pl.col("username").is_not_null()
        )
        .unique(subset=["kaggle_user_id"], keep="last")
        .collect(engine="streaming")
    )

    competition_columns = columns_by_source["competitions"]
    competitions = (
        _scan(data_dir / CONTRACTS["competitions"].filename)
        .select(
            pl.col("Id").cast(pl.Int64, strict=False).alias("kaggle_competition_id"),
            pl.col("Slug").cast(pl.String).alias("slug"),
            pl.col("Title").cast(pl.String).alias("title"),
            _text(competition_columns, "Subtitle").alias("subtitle"),
            _text(competition_columns, "EnabledDate").alias("enabled_at"),
            _text(competition_columns, "DeadlineDate").alias("deadline_at"),
            _integer(competition_columns, "TotalTeams").alias("total_teams"),
            _integer(competition_columns, "TotalCompetitors").alias(
                "total_competitors"
            ),
            _text(competition_columns, "CompetitionTypeId").alias("competition_type"),
            _boolean(competition_columns, "CanQualifyTiers").alias("can_qualify_tiers"),
            (_integer(competition_columns, "TotalTeams").fill_null(0) > 0).alias(
                "has_leaderboard"
            ),
            _text(competition_columns, "HostSegmentTitle").alias("host_name"),
        )
        .filter(
            pl.col("kaggle_competition_id").is_not_null()
            & pl.col("slug").is_not_null()
            & pl.col("title").is_not_null()
        )
        .unique(subset=["kaggle_competition_id"], keep="last")
        .collect(engine="streaming")
    )

    target_ids = kagglers.lazy().select("kaggle_user_id")
    memberships = _scan(data_dir / CONTRACTS["memberships"].filename).select(
        pl.col("TeamId").cast(pl.Int64, strict=False).alias("kaggle_team_id"),
        pl.col("UserId").cast(pl.Int64, strict=False).alias("kaggle_user_id"),
    )
    target_memberships = memberships.join(target_ids, on="kaggle_user_id", how="inner")
    relevant_team_ids = target_memberships.select("kaggle_team_id").unique()
    team_sizes = (
        memberships.join(relevant_team_ids, on="kaggle_team_id", how="inner")
        .group_by("kaggle_team_id")
        .agg(pl.col("kaggle_user_id").n_unique().alias("team_size"))
    )

    team_columns = columns_by_source["teams"]
    teams = (
        _scan(data_dir / CONTRACTS["teams"].filename)
        .select(
            pl.col("Id").cast(pl.Int64, strict=False).alias("kaggle_team_id"),
            pl.col("CompetitionId")
            .cast(pl.Int64, strict=False)
            .alias("kaggle_competition_id"),
            _text(team_columns, "TeamName").alias("team_name"),
            _integer(team_columns, "PrivateLeaderboardRank").alias("private_rank"),
            _integer(team_columns, "PublicLeaderboardRank").alias("public_rank"),
            _medal(team_columns).alias("medal"),
            _text(team_columns, "MedalAwardDate").alias("medal_awarded_at"),
            _boolean(team_columns, "IsBenchmark").alias("is_benchmark"),
        )
        .join(relevant_team_ids, on="kaggle_team_id", how="inner")
        .join(team_sizes, on="kaggle_team_id", how="left")
        .with_columns(pl.col("team_size").fill_null(1).clip(lower_bound=1))
        .filter(
            pl.col("kaggle_team_id").is_not_null()
            & pl.col("kaggle_competition_id").is_not_null()
        )
        .unique(subset=["kaggle_team_id"], keep="last")
        .collect(engine="streaming")
    )

    team_members = (
        target_memberships.join(
            teams.lazy().select("kaggle_team_id"), on="kaggle_team_id", how="inner"
        )
        .unique(subset=["kaggle_team_id", "kaggle_user_id"])
        .collect(engine="streaming")
    )

    return TransformedData(
        kagglers=kagglers,
        competitions=competitions,
        teams=teams,
        team_members=team_members,
    )
