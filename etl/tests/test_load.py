from datetime import UTC, datetime
from pathlib import Path

from etl.contracts import validate_source_directory
from etl.load import PostgresLoader
from etl.transform import transform_sources

FIXTURES = Path(__file__).parent / "fixtures" / "meta-kaggle"


class PlaceholderCheckingCursor:
    def __init__(self) -> None:
        self.batch_count = 0

    def executemany(self, statement: str, rows: list[tuple[object, ...]]) -> None:
        placeholder_count = statement.count("%s")
        assert rows
        assert all(len(row) == placeholder_count for row in rows)
        self.batch_count += 1


def test_all_upsert_batches_match_their_sql_placeholders() -> None:
    data = transform_sources(
        FIXTURES,
        validate_source_directory(FIXTURES),
        as_of=datetime(2024, 2, 15, tzinfo=UTC),
    )
    cursor = PlaceholderCheckingCursor()

    PostgresLoader._upsert_kagglers(cursor, data)
    PostgresLoader._upsert_competitions(cursor, data)
    PostgresLoader._upsert_teams(cursor, data)
    PostgresLoader._upsert_team_members(cursor, data)
    PostgresLoader._upsert_competition_results(cursor, data)
    PostgresLoader._upsert_kaggler_scores(cursor, data)
    PostgresLoader._upsert_ranking_snapshots(cursor, data)

    assert cursor.batch_count == 7
