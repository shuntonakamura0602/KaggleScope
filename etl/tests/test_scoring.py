from datetime import UTC, datetime

import polars as pl
import pytest
from etl.scoring import build_competition_results, calculate_kaggler_scores


def test_result_uses_private_rank_and_applies_v01_formula() -> None:
    competitions = pl.DataFrame(
        {
            "kaggle_competition_id": [10, 11],
            "total_teams": [100, 100],
            "has_leaderboard": [True, False],
            "deadline_at": ["2025-01-01", "2025-01-01"],
        }
    )
    teams = pl.DataFrame(
        {
            "kaggle_team_id": [100, 101, 102, 103],
            "kaggle_competition_id": [10, 10, 11, 10],
            "private_rank": [5, None, 1, None],
            "public_rank": [4, 10, 1, 20],
            "medal": ["Gold", None, "Gold", None],
            "medal_awarded_at": [None, None, None, None],
            "team_size": [1, 1, 1, 1],
            "is_benchmark": [False, True, False, False],
        }
    )
    members = pl.DataFrame(
        {
            "kaggle_team_id": [100, 101, 102, 103],
            "kaggle_user_id": [1, 1, 1, 2],
        }
    )

    results = build_competition_results(
        competitions,
        teams,
        members,
        as_of=datetime(2025, 1, 2, tzinfo=UTC),
    )

    assert results.height == 2
    row = results.filter(pl.col("kaggle_user_id") == 1).row(0, named=True)
    assert row["final_rank"] == 5
    assert row["percentile"] == pytest.approx(0.05)
    assert row["result_score"] == pytest.approx(80.1667)
    assert row["is_solo"] is True
    fallback = results.filter(pl.col("kaggle_user_id") == 2).row(0, named=True)
    assert fallback["final_rank"] == 20


def test_score_thresholds_and_top_ten_weighting() -> None:
    result_date = datetime(2025, 1, 1, tzinfo=UTC)
    results = pl.DataFrame(
        {
            "kaggle_user_id": [1] * 11 + [2],
            "result_score": [10.0] * 11 + [20.0],
            "percentile": [0.10] * 11 + [0.50],
            "is_solo": [True] * 12,
            "result_date": [result_date] * 12,
        }
    )
    kagglers = pl.DataFrame({"kaggle_user_id": [1, 2, 3]})

    scores = calculate_kaggler_scores(
        kagglers,
        results,
        as_of=datetime(2025, 1, 10, tzinfo=UTC),
    )
    by_user = {row["kaggle_user_id"]: row for row in scores.to_dicts()}

    assert by_user[1]["career_raw"] == pytest.approx(102.5)
    assert by_user[1]["solo_raw"] == pytest.approx(102.5)
    assert by_user[1]["career_rank"] == 1
    assert by_user[1]["career_power"] == pytest.approx(100.0)
    assert by_user[1]["consistency_raw"] == pytest.approx(0.97)
    assert by_user[1]["consistency_score"] == pytest.approx(100.0)

    assert by_user[2]["career_rank"] == 2
    assert by_user[2]["solo_power"] is None
    assert by_user[2]["consistency_score"] is None
    assert by_user[3]["career_raw"] == 0
    assert by_user[3]["career_power"] == pytest.approx(0.0)


def test_users_without_results_receive_zero_core_scores() -> None:
    kagglers = pl.DataFrame({"kaggle_user_id": [1, 2]})
    results = pl.DataFrame(
        schema={
            "kaggle_user_id": pl.Int64,
            "result_score": pl.Float64,
            "percentile": pl.Float64,
            "is_solo": pl.Boolean,
            "result_date": pl.Datetime(time_zone="UTC"),
        }
    )

    scores = calculate_kaggler_scores(
        kagglers,
        results,
        as_of=datetime(2025, 1, 10, tzinfo=UTC),
    )

    assert scores["career_raw"].to_list() == [0.0, 0.0]
    assert scores["career_power"].to_list() == [0.0, 0.0]
    assert scores["momentum_score"].to_list() == [0.0, 0.0]
    assert scores["solo_power"].null_count() == 2
    assert scores["consistency_score"].null_count() == 2
