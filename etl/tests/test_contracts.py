from pathlib import Path

import pytest
from etl.contracts import CONTRACTS, SchemaValidationError, validate_csv


def test_missing_required_columns_are_reported(tmp_path: Path) -> None:
    path = tmp_path / "Users.csv"
    path.write_text("Id,DisplayName\n1,Missing username\n", encoding="utf-8")

    with pytest.raises(SchemaValidationError, match="UserName"):
        validate_csv(path, CONTRACTS["users"])
