#!/usr/bin/env python3
"""Download skill icons referenced by the local BSFG export from Wayback."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path, PurePosixPath
from urllib.parse import quote


DEFAULT_CAPTURE = "20250807133944"
SOURCE_ORIGIN = "https://db.bsfg.ru"
WAYBACK_REPLAY = "https://web.archive.org/web/{capture}id_/{origin}{path}"


def is_image(data: bytes) -> bool:
    jpeg = data.startswith(b"\xff\xd8\xff") and data.endswith(b"\xff\xd9")
    png = data.startswith(b"\x89PNG\r\n\x1a\n") and data.endswith(b"IEND\xaeB\x60\x82")
    gif = data.startswith((b"GIF87a", b"GIF89a")) and data.endswith(b";")
    webp = (
        len(data) >= 12
        and data[:4] == b"RIFF"
        and data[8:12] == b"WEBP"
        and int.from_bytes(data[4:8], "little") + 8 == len(data)
    )
    return jpeg or png or gif or webp


def icon_paths(data_dir: Path) -> list[str]:
    paths: set[str] = set()
    for source in sorted(data_dir.glob("*.json")):
        payload = json.loads(source.read_text(encoding="utf-8"))
        for section in payload["profession"]["sections"]:
            for entry in section["entries"]:
                value = entry.get("icon", "")
                if not value.startswith("/icon/"):
                    continue
                relative = PurePosixPath(value.removeprefix("/icon/"))
                if relative.is_absolute() or ".." in relative.parts:
                    continue
                paths.add("/icon/" + relative.as_posix())
    return sorted(paths)


def download_batch(
    paths: list[str],
    *,
    output: Path,
    capture: str,
    parallel: int,
    retries: int,
    force: bool,
) -> list[tuple[str, str, int]]:
    results: list[tuple[str, str, int]] = []
    pending: list[tuple[str, Path, str]] = []
    for path in paths:
        target = output / path.removeprefix("/icon/")
        if target.is_file() and target.stat().st_size and not force:
            results.append((path, "cached", target.stat().st_size))
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_name(target.name + ".part")
        temporary.unlink(missing_ok=True)
        replay = WAYBACK_REPLAY.format(
            capture=capture,
            origin=SOURCE_ORIGIN,
            path=quote(path, safe="/"),
        )
        pending.append((path, target, replay))

    if pending:
        command = [
            "curl", "--silent", "--show-error", "--location", "--fail",
            "--remove-on-error", "--parallel", "--parallel-immediate",
            "--parallel-max", str(max(1, parallel)),
            "--connect-timeout", "5", "--max-time", "18",
            "--retry", str(max(0, retries - 1)), "--retry-all-errors",
            "--user-agent", "Mozilla/5.0 (compatible; BSFG archive importer)",
            "--header", "Accept: image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
        ]
        for _, target, replay in pending:
            command.extend(["--output", str(target.with_name(target.name + ".part")), replay])
        subprocess.run(
            command,
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    for path, target, _ in pending:
        temporary = target.with_name(target.name + ".part")
        if not temporary.is_file():
            results.append((path, "missing", 0))
            continue
        body = temporary.read_bytes()
        if not is_image(body):
            temporary.unlink(missing_ok=True)
            results.append((path, "not-image", len(body)))
            continue
        temporary.replace(target)
        results.append((path, "downloaded", len(body)))
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=Path("site/data/professions"))
    parser.add_argument("--output", type=Path, default=Path("site/assets/icons"))
    parser.add_argument("--capture", default=DEFAULT_CAPTURE)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    paths = icon_paths(args.data_dir)
    args.output.mkdir(parents=True, exist_ok=True)
    print(f"ICONS={len(paths)}", flush=True)
    results = download_batch(
        paths,
        output=args.output,
        capture=args.capture,
        parallel=max(1, args.workers),
        retries=max(1, args.retries),
        force=args.force,
    )
    print(f"PROGRESS={len(results)}/{len(paths)}", flush=True)

    counts: dict[str, int] = {}
    for _, status, _ in results:
        counts[status] = counts.get(status, 0) + 1
    manifest = {
        "capture": args.capture,
        "source_origin": SOURCE_ORIGIN,
        "icon_count": len(paths),
        "status_counts": counts,
        "files": [
            {"path": path, "status": status, "bytes": size}
            for path, status, size in sorted(results)
        ],
    }
    (args.output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("RESULT=" + json.dumps(counts, ensure_ascii=False, sort_keys=True), flush=True)
    return 0 if counts.get("downloaded", 0) + counts.get("cached", 0) else 1


if __name__ == "__main__":
    raise SystemExit(main())
