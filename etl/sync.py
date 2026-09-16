"""Command-line entry point for the Meta Kaggle sync and score calculation."""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import UTC, datetime
from pathlib import Path

from .contracts import validate_source_directory
from .download import download_meta_kaggle, source_version
from .load import PostgresLoader
from .transform import transform_sources

LOGGER = logging.getLogger("kagglescope.etl")
DEFAULT_DATA_DIR = Path(__file__).parent / "data" / "meta-kaggle"


def _parse_as_of(value: str) -> datetime:
    try:
        return datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=UTC)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("expected YYYY-MM-DD") from exc


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Download, validate, score, and transactionally upsert Meta Kaggle data."
        )
    )
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Use CSV files already present in --data-dir.",
    )
    parser.add_argument(
        "--force-download",
        action="store_true",
        help="Replace locally cached Meta Kaggle files.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and transform without connecting to PostgreSQL.",
    )
    parser.add_argument(
        "--as-of",
        type=_parse_as_of,
        help="Score calculation date in YYYY-MM-DD format (defaults to today).",
    )
    return parser


def _configure_logging() -> Path:
    log_dir = Path(__file__).parent / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / f"sync-{datetime.now(UTC):%Y%m%dT%H%M%SZ}.log"
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")

    LOGGER.setLevel(logging.INFO)
    LOGGER.handlers.clear()
    for handler in (logging.StreamHandler(), logging.FileHandler(log_path)):
        handler.setFormatter(formatter)
        LOGGER.addHandler(handler)
    return log_path


def run(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    log_path = _configure_logging()
    data_dir = args.data_dir.expanduser().resolve()
    calculation_time = args.as_of or datetime.now(UTC)
    LOGGER.info("Starting Meta Kaggle sync (data_dir=%s)", data_dir)

    run_id = None
    loader = None
    try:
        version = source_version(data_dir)
        if not args.skip_download:
            version = download_meta_kaggle(data_dir, force=args.force_download)

        if not args.dry_run:
            loader = PostgresLoader(os.environ.get("DATABASE_URL", ""))
            run_id = loader.start_run(version)

        schemas = validate_source_directory(data_dir)
        LOGGER.info("Validated %d input schemas", len(schemas))
        transformed = transform_sources(data_dir, schemas, as_of=calculation_time)
        LOGGER.info("Transform summary: %s", json.dumps(transformed.counts))

        if args.dry_run:
            LOGGER.info("Dry run complete; PostgreSQL was not modified")
        else:
            assert loader is not None and run_id is not None
            loader.load(transformed, run_id)
            LOGGER.info("PostgreSQL upsert complete (run_id=%s)", run_id)
        LOGGER.info("Log written to %s", log_path)
        return 0
    except Exception:
        LOGGER.exception("Meta Kaggle sync failed")
        if loader is not None and run_id is not None:
            loader.fail_run(run_id, str(sys.exception()))
        LOGGER.error("Log written to %s", log_path)
        return 1


if __name__ == "__main__":
    sys.exit(run())
