"""Input contracts for the subset of Meta Kaggle used by Part 4."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import polars as pl


class SchemaValidationError(ValueError):
    """Raised when a Meta Kaggle CSV no longer satisfies its contract."""


@dataclass(frozen=True)
class CsvContract:
    filename: str
    required: frozenset[str]
    optional: frozenset[str] = frozenset()


CONTRACTS = {
    "users": CsvContract(
        "Users.csv",
        frozenset({"Id", "UserName"}),
        frozenset({"DisplayName", "RegisterDate", "PerformanceTier"}),
    ),
    "achievements": CsvContract(
        "UserAchievements.csv",
        frozenset({"UserId", "AchievementType", "Tier"}),
        frozenset(
            {
                "CurrentRanking",
                "HighestRanking",
                "Points",
                "TotalGold",
                "TotalSilver",
                "TotalBronze",
            }
        ),
    ),
    "competitions": CsvContract(
        "Competitions.csv",
        frozenset({"Id", "Slug", "Title"}),
        frozenset(
            {
                "Subtitle",
                "EnabledDate",
                "DeadlineDate",
                "TotalTeams",
                "TotalCompetitors",
                "CompetitionTypeId",
                "HostSegmentTitle",
                "CanQualifyTiers",
            }
        ),
    ),
    "teams": CsvContract(
        "Teams.csv",
        frozenset({"Id", "CompetitionId"}),
        frozenset(
            {
                "TeamName",
                "PrivateLeaderboardRank",
                "PublicLeaderboardRank",
                "Medal",
                "MedalAwardDate",
                "IsBenchmark",
            }
        ),
    ),
    "memberships": CsvContract(
        "TeamMemberships.csv",
        frozenset({"TeamId", "UserId"}),
    ),
}


def validate_csv(path: Path, contract: CsvContract) -> set[str]:
    """Read only the header and return its columns after contract validation."""
    if not path.is_file():
        raise SchemaValidationError(f"Required Meta Kaggle file is missing: {path}")

    try:
        columns = set(pl.scan_csv(path, infer_schema_length=0).collect_schema().names())
    except Exception as exc:  # Polars includes the useful parser detail.
        message = f"Could not read CSV header for {path}: {exc}"
        raise SchemaValidationError(message) from exc

    missing = contract.required - columns
    if missing:
        expected = ", ".join(sorted(contract.required))
        actual = ", ".join(sorted(columns))
        raise SchemaValidationError(
            f"{contract.filename} schema mismatch; missing {sorted(missing)}. "
            f"Expected at least [{expected}], got [{actual}]"
        )
    return columns


def validate_source_directory(data_dir: Path) -> dict[str, set[str]]:
    return {
        name: validate_csv(data_dir / contract.filename, contract)
        for name, contract in CONTRACTS.items()
    }
