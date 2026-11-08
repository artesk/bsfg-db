#!/usr/bin/env python3
"""Import a verified BSFG snapshot into the editable YAML content layer."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent
DEFAULT_OUTPUT = ROOT / "content"


BaseSafeDumper = getattr(yaml, "CSafeDumper", yaml.SafeDumper)


class ContentDumper(BaseSafeDumper):
    def ignore_aliases(self, data: object) -> bool:
        return True


def read_gzip(path: Path) -> bytes:
    with gzip.open(path, "rb") as source:
        return source.read()


def write_yaml(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = yaml.dump(
        value,
        Dumper=ContentDumper,
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
        width=100,
    )
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(encoded, encoding="utf-8")
    temporary.replace(path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--snapshot", type=Path, required=True,
        help="Path to a completed snapshot directory",
    )
    parser.add_argument(
        "--output", type=Path, default=DEFAULT_OUTPUT,
        help="Destination content directory",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Allow overwriting an existing editable content layer",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    snapshot = args.snapshot.resolve()
    output = args.output.resolve()
    professions_output = output / "professions"
    existing = list(professions_output.glob("*.yaml"))
    if existing and not args.force:
        raise SystemExit(
            f"Refusing to overwrite {len(existing)} editable YAML files; use --force"
        )

    manifest = json.loads((snapshot / "manifest.json").read_text(encoding="utf-8"))
    professions = json.loads(
        (snapshot / "professions.json").read_text(encoding="utf-8")
    )
    entries = manifest.get("entries", [])
    expected = manifest.get("profession_count")
    if manifest.get("error_count") != 0 or manifest.get("ok_count") != expected:
        raise SystemExit("Refusing to import an incomplete snapshot")
    if len(entries) != expected or len(professions) != expected:
        raise SystemExit("Snapshot indexes disagree on profession count")

    entry_by_slug = {entry["slug"]: entry for entry in entries}
    expected_files: set[str] = set()
    for item in professions:
        slug = item["slug"]
        entry = entry_by_slug.get(slug)
        if not entry or entry.get("status") != "ok":
            raise SystemExit(f"Missing completed manifest entry: {slug}")
        compressed_path = snapshot / "data" / f"{slug}.json.gz"
        raw = read_gzip(compressed_path)
        if hashlib.sha256(raw).hexdigest() != entry["data_sha256"]:
            raise SystemExit(f"Hash mismatch: {compressed_path}")
        profession = json.loads(raw)
        filename = f"{slug}.yaml"
        expected_files.add(filename)
        write_yaml(professions_output / filename, {
            "source": {
                "data_sha256": entry["data_sha256"],
                "original_url": entry["url"],
            },
            "profession": profession,
        })

    write_yaml(output / "metadata.yaml", {
        "snapshot": manifest["snapshot"],
        "captured_at": manifest["finished_at"],
        "source_list": manifest["source_list"],
    })

    if args.force:
        for stale_path in professions_output.glob("*.yaml"):
            if stale_path.name not in expected_files:
                stale_path.unlink()

    print(
        f"IMPORTED snapshot={manifest['snapshot']} professions={len(expected_files)} "
        f"output={output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
