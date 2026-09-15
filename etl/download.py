"""Download the minimal Meta Kaggle source set through Kaggle's official CLI."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

from .contracts import CONTRACTS

DATASET = "kaggle/meta-kaggle"
MANIFEST = "manifest.json"


class DownloadError(RuntimeError):
    """Raised when Kaggle cannot supply a required source file."""


def download_meta_kaggle(data_dir: Path, *, force: bool = False) -> str:
    data_dir.mkdir(parents=True, exist_ok=True)
    for contract in CONTRACTS.values():
        command = [
            sys.executable,
            "-m",
            "kaggle",
            "datasets",
            "download",
            DATASET,
            "--file",
            contract.filename,
            "--path",
            str(data_dir),
            "--unzip",
        ]
        if force:
            command.append("--force")
        try:
            subprocess.run(command, check=True)
        except (OSError, subprocess.CalledProcessError) as exc:
            raise DownloadError(
                f"Failed to download {contract.filename}. Configure KAGGLE_API_TOKEN "
                "or KAGGLE_USERNAME/KAGGLE_KEY (or ~/.kaggle/kaggle.json), then retry."
            ) from exc

    downloaded_at = datetime.now(UTC).isoformat()
    manifest = {
        "dataset": DATASET,
        "downloaded_at": downloaded_at,
        "files": [contract.filename for contract in CONTRACTS.values()],
    }
    (data_dir / MANIFEST).write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    return downloaded_at


def source_version(data_dir: Path) -> str | None:
    manifest_path = data_dir / MANIFEST
    if not manifest_path.is_file():
        return None
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        return str(manifest.get("downloaded_at") or "") or None
    except (OSError, json.JSONDecodeError):
        return None
