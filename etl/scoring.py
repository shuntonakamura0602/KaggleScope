"""KaggleScope v0.1 competition-result and ranking calculations."""

from __future__ import annotations

from datetime import UTC, datetime

import polars as pl

SCORE_VERSION = "0.1"
SOLO_MINIMUM = 3
CONSISTENCY_MINIMUM = 5
MOMENTUM_WINDOW_DAYS = 365
MOMENTUM_DECAY_DAYS = 180


def _utc_datetime(expression: pl.Expr) -> pl.Expr:
    return expression.cast(pl.String, strict=False).str.to_datetime(
        strict=False, time_zone="UTC"
    )


def build_competition_results(
    competitions: pl.DataFrame,
    teams: pl.DataFrame,
    team_members: pl.DataFrame,
    *,
    as_of: datetime | None = None,
) -> pl.DataFrame:
    """Build one valid result per Kaggler and competition."""
    cutoff = as_of or datetime.now(UTC)
    if cutoff.tzinfo is None:
        cutoff = cutoff.replace(tzinfo=UTC)
    else:
        cutoff = cutoff.astimezone(UTC)
    joined = (
        team_members.join(teams, on="kaggle_team_id", how="inner")
        .join(competitions, on="kaggle_competition_id", how="inner")
        .with_columns(
            pl.coalesce("private_rank", "public_rank").alias("final_rank"),
            pl.coalesce(
                _utc_datetime(pl.col("medal_awarded_at")),
                _utc_datetime(pl.col("deadline_at")),
            ).alias("result_date"),
        )
        .filter(
            ~pl.col("is_benchmark")
            & pl.col("has_leaderboard")
            & pl.col("final_rank").is_not_null()
            & pl.col("total_teams").is_not_null()
            & pl.col("result_date").is_not_null()
            & (pl.col("result_date") <= pl.lit(cutoff))
            & (pl.col("final_rank") > 0)
            & (pl.col("total_teams") > 0)
            & (pl.col("final_rank") <= pl.col("total_teams"))
        )
        .with_columns(
            (pl.col("final_rank") / pl.col("total_teams")).alias("percentile"),
            (pl.col("team_size") == 1).alias("is_solo"),
        )
        .with_columns(
            (
                (
                    100 * (1 - pl.col("percentile")).pow(2)
                    + pl.when(pl.col("medal") == "Gold")
                    .then(30.0)
                    .when(pl.col("medal") == "Silver")
                    .then(15.0)
                    .when(pl.col("medal") == "Bronze")
                    .then(5.0)
                    .otherwise(0.0)
                )
                * (pl.col("total_teams").clip(lower_bound=10).log(10) / 3).clip(
                    0.5, 1.25
                )
            ).alias("result_score")
        )
        .sort(
            ["kaggle_user_id", "kaggle_competition_id", "final_rank"],
            descending=[False, False, False],
        )
        .unique(subset=["kaggle_user_id", "kaggle_competition_id"], keep="first")
    )
    return joined.select(
        "kaggle_user_id",
        "kaggle_competition_id",
        "kaggle_team_id",
        pl.col("final_rank").cast(pl.Int64),
        pl.col("total_teams").cast(pl.Int64),
        pl.col("percentile").round(10),
        "medal",
        pl.col("team_size").cast(pl.Int64),
        "is_solo",
        pl.col("result_score").round(4),
        "result_date",
    )


def _career_aggregate(
    results: pl.DataFrame, *, solo_only: bool = False
) -> pl.DataFrame:
    selected = results.filter(pl.col("is_solo")) if solo_only else results
    if selected.is_empty():
        return pl.DataFrame(
            schema={
                "kaggle_user_id": pl.Int64,
                "raw": pl.Float64,
                "count": pl.UInt32,
            }
        )

    ranked = selected.with_columns(
        pl.col("result_score")
        .rank(method="ordinal", descending=True)
        .over("kaggle_user_id")
        .alias("result_order")
    )
    return ranked.group_by("kaggle_user_id").agg(
        pl.when(pl.col("result_order") <= 10)
        .then(pl.col("result_score"))
        .otherwise(pl.col("result_score") * 0.25)
        .sum()
        .alias("raw"),
        pl.len().alias("count"),
    )


def _metric_ranking(
    frame: pl.DataFrame,
    *,
    raw_column: str,
    power_column: str,
    rank_column: str,
) -> pl.DataFrame:
    if frame.is_empty():
        return frame.select("kaggle_user_id").with_columns(
            pl.lit(None, dtype=pl.Float64).alias(power_column),
            pl.lit(None, dtype=pl.Int64).alias(rank_column),
        )

    population = frame.height
    ranked = frame.with_columns(
        pl.col(raw_column)
        .rank(method="min", descending=True)
        .cast(pl.Int64)
        .alias(rank_column)
    )
    maximum = frame.get_column(raw_column).max()
    if maximum is None or maximum <= 0:
        power = pl.lit(0.0)
    elif population == 1:
        power = pl.when(pl.col(raw_column) > 0).then(100.0).otherwise(0.0)
    else:
        power = 100 * (1 - (pl.col(rank_column) - 1) / (population - 1))
    return ranked.select(
        "kaggle_user_id",
        power.clip(0, 100).round(3).alias(power_column),
        rank_column,
    )


def calculate_kaggler_scores(
    kagglers: pl.DataFrame,
    results: pl.DataFrame,
    *,
    as_of: datetime | None = None,
) -> pl.DataFrame:
    """Calculate all MVP score families for every target Kaggler."""
    calculation_time = as_of or datetime.now(UTC)
    if calculation_time.tzinfo is None:
        calculation_time = calculation_time.replace(tzinfo=UTC)
    else:
        calculation_time = calculation_time.astimezone(UTC)

    users = kagglers.select("kaggle_user_id").unique()
    career = _career_aggregate(results).rename(
        {"raw": "career_raw", "count": "competition_count"}
    )
    solo = _career_aggregate(results, solo_only=True).rename(
        {"raw": "solo_raw", "count": "solo_competition_count"}
    )

    if results.is_empty():
        consistency = pl.DataFrame(
            schema={"kaggle_user_id": pl.Int64, "consistency_raw": pl.Float64}
        )
        momentum = pl.DataFrame(
            schema={"kaggle_user_id": pl.Int64, "momentum_raw": pl.Float64}
        )
    else:
        consistency = results.group_by("kaggle_user_id").agg(
            (
                (
                    0.4 * (pl.col("percentile") <= 0.10).mean()
                    + 0.3 * (pl.col("percentile") <= 0.25).mean()
                    + 0.3 * (1 - pl.col("percentile").median())
                )
                * (pl.len().cast(pl.Float64) / 10).sqrt().clip(upper_bound=1)
            ).alias("consistency_raw")
        )
        age_days = (pl.lit(calculation_time) - pl.col("result_date")).dt.total_days()
        momentum = (
            results.with_columns(age_days.alias("age_days"))
            .group_by("kaggle_user_id")
            .agg(
                pl.when(pl.col("age_days").is_between(0, MOMENTUM_WINDOW_DAYS))
                .then(
                    pl.col("result_score")
                    * (-pl.col("age_days") / MOMENTUM_DECAY_DAYS).exp()
                )
                .otherwise(0.0)
                .sum()
                .alias("momentum_raw")
            )
        )

    base = (
        users.join(career, on="kaggle_user_id", how="left")
        .join(solo, on="kaggle_user_id", how="left")
        .join(consistency, on="kaggle_user_id", how="left")
        .join(momentum, on="kaggle_user_id", how="left")
        .with_columns(
            pl.col("career_raw").fill_null(0.0),
            pl.col("competition_count").fill_null(0),
            pl.col("solo_competition_count").fill_null(0),
            pl.col("momentum_raw").fill_null(0.0),
        )
    )

    career_ranking = _metric_ranking(
        base,
        raw_column="career_raw",
        power_column="career_power",
        rank_column="career_rank",
    )
    momentum_ranking = _metric_ranking(
        base,
        raw_column="momentum_raw",
        power_column="momentum_score",
        rank_column="momentum_rank",
    )
    solo_ranking = _metric_ranking(
        base.filter(pl.col("solo_competition_count") >= SOLO_MINIMUM),
        raw_column="solo_raw",
        power_column="solo_power",
        rank_column="solo_rank",
    )
    consistency_ranking = _metric_ranking(
        base.filter(pl.col("competition_count") >= CONSISTENCY_MINIMUM),
        raw_column="consistency_raw",
        power_column="consistency_score",
        rank_column="consistency_rank",
    )

    return (
        base.join(career_ranking, on="kaggle_user_id", how="left")
        .join(momentum_ranking, on="kaggle_user_id", how="left")
        .join(solo_ranking, on="kaggle_user_id", how="left")
        .join(consistency_ranking, on="kaggle_user_id", how="left")
        .select(
            "kaggle_user_id",
            pl.lit(SCORE_VERSION).alias("score_version"),
            pl.col("career_raw").round(4),
            "career_power",
            "career_rank",
            pl.col("solo_raw").round(4),
            "solo_power",
            "solo_rank",
            pl.col("consistency_raw").round(4),
            "consistency_score",
            "consistency_rank",
            pl.col("momentum_raw").round(4),
            "momentum_score",
            "momentum_rank",
            pl.col("competition_count").cast(pl.Int64),
            pl.col("solo_competition_count").cast(pl.Int64),
        )
        .sort("career_rank")
    )


def build_ranking_snapshots(
    kagglers: pl.DataFrame,
    scores: pl.DataFrame,
    *,
    snapshot_date: str,
) -> pl.DataFrame:
    return (
        kagglers.select("kaggle_user_id", "official_rank", "official_points")
        .join(
            scores.select("kaggle_user_id", "career_rank", "career_power"),
            on="kaggle_user_id",
            how="left",
        )
        .with_columns(pl.lit(snapshot_date).alias("snapshot_date"))
        .select(
            "snapshot_date",
            "kaggle_user_id",
            "official_rank",
            "official_points",
            "career_rank",
            "career_power",
        )
    )
