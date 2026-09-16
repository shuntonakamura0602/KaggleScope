from pathlib import Path

from etl.contracts import validate_source_directory
from etl.transform import transform_sources

FIXTURES = Path(__file__).parent / "fixtures" / "meta-kaggle"


def test_transforms_only_competition_expert_and_above() -> None:
    result = transform_sources(FIXTURES, validate_source_directory(FIXTURES))

    assert set(result.kagglers["username"].to_list()) == {
        "expert_one",
        "master_two",
    }
    assert result.counts == {
        "kagglers": 2,
        "competitions": 2,
        "teams": 2,
        "team_members": 3,
        "competition_results": 2,
        "kaggler_scores": 2,
        "ranking_snapshots": 2,
    }


def test_normalizes_medals_and_calculates_full_team_size() -> None:
    result = transform_sources(FIXTURES, validate_source_directory(FIXTURES))
    teams = {row["kaggle_team_id"]: row for row in result.teams.to_dicts()}

    assert teams[100]["medal"] == "Gold"
    assert teams[100]["team_size"] == 1
    assert teams[101]["medal"] == "Silver"
    assert teams[101]["team_size"] == 3
