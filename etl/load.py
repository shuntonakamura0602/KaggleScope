"""Transactional, idempotent PostgreSQL loading for transformed Meta Kaggle rows."""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import Any
from uuid import UUID, uuid4

from .transform import TransformedData


class DatabaseConfigurationError(RuntimeError):
    """Raised when a database-backed sync has no connection URL."""


def _rows(frame: Any, columns: Sequence[str]) -> list[tuple[Any, ...]]:
    return [tuple(row[column] for column in columns) for row in frame.to_dicts()]


def _executemany(cursor: Any, statement: str, rows: Iterable[tuple[Any, ...]]) -> None:
    values = list(rows)
    if values:
        cursor.executemany(statement, values)


class PostgresLoader:
    def __init__(self, database_url: str):
        if not database_url:
            raise DatabaseConfigurationError(
                "DATABASE_URL is required unless --dry-run is used."
            )
        self.database_url = database_url

    def start_run(self, meta_kaggle_version: str | None) -> UUID:
        import psycopg

        run_id = uuid4()
        with psycopg.connect(self.database_url) as connection:
            connection.execute(
                """
                INSERT INTO etl_runs (id, status, meta_kaggle_version)
                VALUES (%s, 'running', %s)
                """,
                (run_id, meta_kaggle_version),
            )
        return run_id

    def load(self, data: TransformedData, run_id: UUID) -> None:
        import psycopg

        with psycopg.connect(self.database_url) as connection:
            with connection.cursor() as cursor:
                self._upsert_kagglers(cursor, data)
                self._upsert_competitions(cursor, data)
                self._upsert_teams(cursor, data)
                self._upsert_team_members(cursor, data)
                self._upsert_competition_results(cursor, data)
                self._upsert_kaggler_scores(cursor, data)
                self._upsert_ranking_snapshots(cursor, data)
                cursor.execute(
                    """
                    UPDATE etl_runs
                    SET status = 'succeeded', finished_at = now(),
                        users_processed = %s, competitions_processed = %s,
                        results_processed = %s, error_message = NULL
                    WHERE id = %s
                    """,
                    (
                        data.kagglers.height,
                        data.competitions.height,
                        data.competition_results.height,
                        run_id,
                    ),
                )

    def fail_run(self, run_id: UUID, message: str) -> None:
        import psycopg

        safe_message = message[:4_000]
        try:
            with psycopg.connect(self.database_url) as connection:
                connection.execute(
                    """
                    UPDATE etl_runs
                    SET status = 'failed', finished_at = now(), error_message = %s
                    WHERE id = %s
                    """,
                    (safe_message, run_id),
                )
        except Exception:
            # Preserve the original load exception; the file log still contains it.
            pass

    @staticmethod
    def _upsert_kagglers(cursor: Any, data: TransformedData) -> None:
        columns = (
            "kaggle_user_id",
            "username",
            "display_name",
            "registered_at",
            "competition_tier",
            "official_points",
            "official_rank",
            "highest_rank",
            "gold_count",
            "silver_count",
            "bronze_count",
        )
        _executemany(
            cursor,
            """
            INSERT INTO kagglers (
                kaggle_user_id, username, display_name, registered_at,
                competition_tier, official_points, official_rank, highest_rank,
                gold_count, silver_count, bronze_count
            ) VALUES (%s, %s, %s, %s::timestamptz, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (kaggle_user_id) DO UPDATE SET
                username = EXCLUDED.username,
                display_name = EXCLUDED.display_name,
                registered_at = EXCLUDED.registered_at,
                competition_tier = EXCLUDED.competition_tier,
                official_points = EXCLUDED.official_points,
                official_rank = EXCLUDED.official_rank,
                highest_rank = EXCLUDED.highest_rank,
                gold_count = EXCLUDED.gold_count,
                silver_count = EXCLUDED.silver_count,
                bronze_count = EXCLUDED.bronze_count,
                updated_at = now()
            """,
            _rows(data.kagglers, columns),
        )

    @staticmethod
    def _upsert_competitions(cursor: Any, data: TransformedData) -> None:
        columns = (
            "kaggle_competition_id",
            "slug",
            "title",
            "subtitle",
            "enabled_at",
            "deadline_at",
            "total_teams",
            "total_competitors",
            "competition_type",
            "can_qualify_tiers",
            "has_leaderboard",
            "host_name",
        )
        _executemany(
            cursor,
            """
            INSERT INTO competitions (
                kaggle_competition_id, slug, title, subtitle, enabled_at,
                deadline_at, total_teams, total_competitors, competition_type,
                can_qualify_tiers, has_leaderboard, host_name
            ) VALUES (
                %s, %s, %s, %s, %s::timestamptz, %s::timestamptz,
                %s, %s, %s, %s, %s, %s
            )
            ON CONFLICT (kaggle_competition_id) DO UPDATE SET
                slug = EXCLUDED.slug,
                title = EXCLUDED.title,
                subtitle = EXCLUDED.subtitle,
                enabled_at = EXCLUDED.enabled_at,
                deadline_at = EXCLUDED.deadline_at,
                total_teams = EXCLUDED.total_teams,
                total_competitors = EXCLUDED.total_competitors,
                competition_type = EXCLUDED.competition_type,
                can_qualify_tiers = EXCLUDED.can_qualify_tiers,
                has_leaderboard = EXCLUDED.has_leaderboard,
                host_name = EXCLUDED.host_name,
                updated_at = now()
            """,
            _rows(data.competitions, columns),
        )

    @staticmethod
    def _upsert_teams(cursor: Any, data: TransformedData) -> None:
        columns = (
            "kaggle_team_id",
            "kaggle_competition_id",
            "team_name",
            "private_rank",
            "public_rank",
            "medal",
            "medal_awarded_at",
            "team_size",
            "is_benchmark",
        )
        _executemany(
            cursor,
            """
            INSERT INTO teams (
                kaggle_team_id, competition_id, team_name, private_rank,
                public_rank, medal, medal_awarded_at, team_size, is_benchmark
            )
            SELECT %s, competitions.id, %s, %s, %s, %s, %s::timestamptz, %s, %s
            FROM competitions WHERE kaggle_competition_id = %s
            ON CONFLICT (kaggle_team_id) DO UPDATE SET
                competition_id = EXCLUDED.competition_id,
                team_name = EXCLUDED.team_name,
                private_rank = EXCLUDED.private_rank,
                public_rank = EXCLUDED.public_rank,
                medal = EXCLUDED.medal,
                medal_awarded_at = EXCLUDED.medal_awarded_at,
                team_size = EXCLUDED.team_size,
                is_benchmark = EXCLUDED.is_benchmark
            """,
            (
                (
                    row[0],
                    row[2],
                    row[3],
                    row[4],
                    row[5],
                    row[6],
                    row[7],
                    row[8],
                    row[1],
                )
                for row in _rows(data.teams, columns)
            ),
        )

    @staticmethod
    def _upsert_team_members(cursor: Any, data: TransformedData) -> None:
        _executemany(
            cursor,
            """
            INSERT INTO team_members (team_id, kaggler_id)
            SELECT teams.id, kagglers.id
            FROM teams, kagglers
            WHERE teams.kaggle_team_id = %s AND kagglers.kaggle_user_id = %s
            ON CONFLICT (team_id, kaggler_id) DO NOTHING
            """,
            _rows(data.team_members, ("kaggle_team_id", "kaggle_user_id")),
        )

    @staticmethod
    def _upsert_competition_results(cursor: Any, data: TransformedData) -> None:
        columns = (
            "kaggle_user_id",
            "kaggle_competition_id",
            "kaggle_team_id",
            "final_rank",
            "total_teams",
            "percentile",
            "medal",
            "team_size",
            "is_solo",
            "result_score",
            "result_date",
        )
        _executemany(
            cursor,
            """
            INSERT INTO competition_results (
                kaggler_id, competition_id, team_id, final_rank, total_teams,
                percentile, medal, team_size, is_solo, result_score, result_date
            )
            SELECT kagglers.id, competitions.id, teams.id,
                   %s, %s, %s, %s, %s, %s, %s, %s
            FROM kagglers, competitions, teams
            WHERE kagglers.kaggle_user_id = %s
              AND competitions.kaggle_competition_id = %s
              AND teams.kaggle_team_id = %s
            ON CONFLICT (kaggler_id, competition_id) DO UPDATE SET
                team_id = EXCLUDED.team_id,
                final_rank = EXCLUDED.final_rank,
                total_teams = EXCLUDED.total_teams,
                percentile = EXCLUDED.percentile,
                medal = EXCLUDED.medal,
                team_size = EXCLUDED.team_size,
                is_solo = EXCLUDED.is_solo,
                result_score = EXCLUDED.result_score,
                result_date = EXCLUDED.result_date,
                updated_at = now()
            """,
            (
                (
                    row[3],
                    row[4],
                    row[5],
                    row[6],
                    row[7],
                    row[8],
                    row[9],
                    row[10],
                    row[0],
                    row[1],
                    row[2],
                )
                for row in _rows(data.competition_results, columns)
            ),
        )

    @staticmethod
    def _upsert_kaggler_scores(cursor: Any, data: TransformedData) -> None:
        columns = (
            "kaggle_user_id",
            "score_version",
            "career_raw",
            "career_power",
            "career_rank",
            "solo_raw",
            "solo_power",
            "solo_rank",
            "consistency_raw",
            "consistency_score",
            "consistency_rank",
            "momentum_raw",
            "momentum_score",
            "momentum_rank",
            "competition_count",
            "solo_competition_count",
        )
        _executemany(
            cursor,
            """
            INSERT INTO kaggler_scores (
                kaggler_id, score_version, career_raw, career_power, career_rank,
                solo_raw, solo_power, solo_rank, consistency_raw,
                consistency_score, consistency_rank, momentum_raw,
                momentum_score, momentum_rank, competition_count,
                solo_competition_count, calculated_at
            )
            SELECT kagglers.id, %s, %s, %s, %s, %s, %s, %s, %s,
                   %s, %s, %s, %s, %s, %s, %s, now()
            FROM kagglers WHERE kagglers.kaggle_user_id = %s
            ON CONFLICT (kaggler_id) DO UPDATE SET
                score_version = EXCLUDED.score_version,
                career_raw = EXCLUDED.career_raw,
                career_power = EXCLUDED.career_power,
                career_rank = EXCLUDED.career_rank,
                solo_raw = EXCLUDED.solo_raw,
                solo_power = EXCLUDED.solo_power,
                solo_rank = EXCLUDED.solo_rank,
                consistency_raw = EXCLUDED.consistency_raw,
                consistency_score = EXCLUDED.consistency_score,
                consistency_rank = EXCLUDED.consistency_rank,
                momentum_raw = EXCLUDED.momentum_raw,
                momentum_score = EXCLUDED.momentum_score,
                momentum_rank = EXCLUDED.momentum_rank,
                competition_count = EXCLUDED.competition_count,
                solo_competition_count = EXCLUDED.solo_competition_count,
                calculated_at = now()
            """,
            (tuple(row[1:]) + (row[0],) for row in _rows(data.kaggler_scores, columns)),
        )

    @staticmethod
    def _upsert_ranking_snapshots(cursor: Any, data: TransformedData) -> None:
        columns = (
            "snapshot_date",
            "kaggle_user_id",
            "official_rank",
            "official_points",
            "career_rank",
            "career_power",
        )
        _executemany(
            cursor,
            """
            INSERT INTO ranking_snapshots (
                snapshot_date, kaggler_id, official_rank, official_points,
                career_rank, career_power
            )
            SELECT %s::date, kagglers.id, %s, %s, %s, %s
            FROM kagglers WHERE kagglers.kaggle_user_id = %s
            ON CONFLICT (snapshot_date, kaggler_id) DO UPDATE SET
                official_rank = EXCLUDED.official_rank,
                official_points = EXCLUDED.official_points,
                career_rank = EXCLUDED.career_rank,
                career_power = EXCLUDED.career_power
            """,
            (
                (row[0], row[2], row[3], row[4], row[5], row[1])
                for row in _rows(data.ranking_snapshots, columns)
            ),
        )
