#!/usr/bin/env python3
"""Validate editable YAML content and build browser-friendly JSON files."""

from __future__ import annotations

import argparse
import copy
import json
import re
from pathlib import Path
from typing import Any

import yaml


ROOT = Path(__file__).resolve().parent
DEFAULT_CONTENT = ROOT / "content"
DEFAULT_OUTPUT = ROOT / "site" / "data"
SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
KNOWN_BRANCHES = {"base", "one", "two", "three"}
CLIENT_RELEASE_PATTERN = re.compile(r"\d{4}\.\d{2}\.\d{2}\.\d{6}")


class ContentError(ValueError):
    """A validation error with a contributor-friendly location."""


BaseSafeLoader = getattr(yaml, "CSafeLoader", yaml.SafeLoader)


class ContentLoader(BaseSafeLoader):
    """Safe YAML loader that keeps ISO timestamps as strings."""


ContentLoader.yaml_implicit_resolvers = copy.deepcopy(
    BaseSafeLoader.yaml_implicit_resolvers
)
for first_character, resolvers in ContentLoader.yaml_implicit_resolvers.items():
    ContentLoader.yaml_implicit_resolvers[first_character] = [
        (tag, regexp)
        for tag, regexp in resolvers
        if tag != "tag:yaml.org,2002:timestamp"
    ]


def fail(path: Path, location: str, message: str) -> None:
    raise ContentError(f"{path}:{location}: {message}")


def require_mapping(value: Any, path: Path, location: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(path, location, "ожидался объект YAML")
    return value


def require_list(value: Any, path: Path, location: str) -> list[Any]:
    if not isinstance(value, list):
        fail(path, location, "ожидался список YAML")
    return value


def require_string(
    mapping: dict[str, Any],
    key: str,
    path: Path,
    location: str,
    *,
    allow_empty: bool = False,
) -> str:
    value = mapping.get(key)
    if not isinstance(value, str):
        fail(path, f"{location}.{key}", "ожидалась строка")
    if not allow_empty and not value.strip():
        fail(path, f"{location}.{key}", "строка не должна быть пустой")
    return value


def require_string_list(
    mapping: dict[str, Any], key: str, path: Path, location: str
) -> list[str]:
    values = require_list(mapping.get(key), path, f"{location}.{key}")
    for index, value in enumerate(values):
        if not isinstance(value, str):
            fail(path, f"{location}.{key}[{index}]", "ожидалась строка")
    return values


def validate_optional_id(mapping: dict[str, Any], key: str, path: Path, location: str) -> None:
    if key in mapping:
        value = mapping[key]
        if type(value) is not int or value < 1:
            fail(path, f"{location}.{key}", "ID должен быть положительным целым числом")


def load_yaml(path: Path) -> Any:
    try:
        with path.open("r", encoding="utf-8") as source:
            return yaml.load(source, Loader=ContentLoader)
    except yaml.YAMLError as error:
        raise ContentError(f"{path}: некорректный YAML: {error}") from error


def validate_metadata(path: Path, value: Any) -> dict[str, str]:
    metadata = require_mapping(value, path, "metadata")
    snapshot = require_string(metadata, "snapshot", path, "metadata")
    captured_at = require_string(metadata, "captured_at", path, "metadata")
    source_list = require_string(metadata, "source_list", path, "metadata")
    return {
        "snapshot": snapshot,
        "captured_at": captured_at,
        "source_list": source_list,
    }


def validate_entry(
    row: Any, path: Path, location: str
) -> dict[str, Any]:
    entry = require_mapping(row, path, location)
    branch = require_string(entry, "branch", path, location)
    if branch not in KNOWN_BRANCHES:
        fail(path, f"{location}.branch", f"неизвестная ветка: {branch}")
    level = require_string(entry, "level", path, location)
    if not level.isdigit() or int(level) < 1:
        fail(path, f"{location}.level", "уровень должен быть положительным числом в кавычках")

    require_string(entry, "name", path, location)
    require_string(entry, "icon", path, location, allow_empty=True)
    require_string(entry, "description", path, location, allow_empty=True)
    require_string(entry, "selection_id", path, location, allow_empty=True)
    validate_optional_id(entry, "skill_id", path, location)
    validate_optional_id(entry, "branch_group_id", path, location)
    if "effects_from_archive" in entry and type(entry["effects_from_archive"]) is not bool:
        fail(path, f"{location}.effects_from_archive", "ожидалось логическое значение")
    require_string_list(entry, "specifications", path, location)

    effects = require_list(entry.get("effects"), path, f"{location}.effects")
    for effect_index, effect_value in enumerate(effects):
        effect_location = f"{location}.effects[{effect_index}]"
        effect = require_mapping(effect_value, path, effect_location)
        kind = require_string(effect, "kind", path, effect_location)
        if kind not in {"value", "group"}:
            fail(path, f"{effect_location}.kind", f"неизвестный тип эффекта: {kind}")
        require_string(effect, "text", path, effect_location)
    return entry


def validate_profession(path: Path, slug: str, value: Any) -> dict[str, Any]:
    document = require_mapping(value, path, "document")
    source = require_mapping(document.get("source"), path, "source")
    if "client_release" in source:
        release = require_string(source, "client_release", path, "source")
        if not CLIENT_RELEASE_PATTERN.fullmatch(release):
            fail(path, "source.client_release", "ожидался номер релиза клиента")
    if "client_release" not in source or {"data_sha256", "original_url"} & source.keys():
        data_sha256 = require_string(source, "data_sha256", path, "source")
        if not re.fullmatch(r"[0-9a-f]{64}", data_sha256):
            fail(path, "source.data_sha256", "ожидалась SHA-256 сумма из 64 символов")
        require_string(source, "original_url", path, "source")

    profession = require_mapping(document.get("profession"), path, "profession")
    profession_slug = require_string(profession, "slug", path, "profession")
    if profession_slug != slug:
        fail(path, "profession.slug", f"slug должен совпадать с именем файла: {slug}")
    require_string(profession, "title", path, "profession")
    validate_optional_id(profession, "class_id", path, "profession")
    require_string(profession, "url", path, "profession")
    require_string(profession, "photo", path, "profession", allow_empty=True)
    require_string(profession, "parser_version", path, "profession")
    if not isinstance(profession.get("schema_version"), int):
        fail(path, "profession.schema_version", "ожидалось целое число")
    require_string_list(profession, "title_classes", path, "profession")
    descriptions = require_string_list(profession, "descriptions", path, "profession")
    if not descriptions:
        fail(path, "profession.descriptions", "нужно хотя бы одно описание")

    sections = require_list(profession.get("sections"), path, "profession.sections")
    if not sections:
        fail(path, "profession.sections", "нужен хотя бы один раздел")
    section_ids: set[str] = set()
    for section_index, section_value in enumerate(sections):
        section_location = f"profession.sections[{section_index}]"
        section = require_mapping(section_value, path, section_location)
        section_id = require_string(section, "id", path, section_location)
        if section_id in section_ids:
            fail(path, f"{section_location}.id", f"повторяющийся id раздела: {section_id}")
        section_ids.add(section_id)
        require_string(section, "title", path, section_location)
        entries = require_list(section.get("entries"), path, f"{section_location}.entries")
        for entry_index, row in enumerate(entries):
            validate_entry(row, path, f"{section_location}.entries[{entry_index}]")
    return document


def load_content(content: Path) -> tuple[dict[str, str], list[tuple[str, dict[str, Any]]]]:
    metadata_path = content / "metadata.yaml"
    professions_path = content / "professions"
    if not metadata_path.is_file():
        raise ContentError(f"Не найден файл {metadata_path}")
    if not professions_path.is_dir():
        raise ContentError(f"Не найден каталог {professions_path}")

    metadata = validate_metadata(metadata_path, load_yaml(metadata_path))
    documents: list[tuple[str, dict[str, Any]]] = []
    titles: dict[str, str] = {}
    class_ids: dict[int, str] = {}
    for path in sorted(professions_path.glob("*.yaml")):
        slug = path.stem
        if not SLUG_PATTERN.fullmatch(slug):
            fail(path, "filename", "имя файла может содержать только a-z, 0-9, _ и -")
        document = validate_profession(path, slug, load_yaml(path))
        title_key = document["profession"]["title"].casefold()
        if title_key in titles:
            fail(path, "profession.title", f"название уже используется в {titles[title_key]}")
        titles[title_key] = str(path)
        class_id = document["profession"].get("class_id")
        if class_id is not None:
            if class_id in class_ids:
                fail(path, "profession.class_id", f"ID уже используется в {class_ids[class_id]}")
            class_ids[class_id] = str(path)
        documents.append((slug, document))
    if not documents:
        raise ContentError(f"В {professions_path} нет YAML-файлов профессий")
    return metadata, documents


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(
        value, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ).encode("utf-8")
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(encoded)
    temporary.replace(path)


def build(content: Path, output: Path) -> tuple[int, int]:
    metadata, documents = load_content(content)
    catalog: list[dict[str, Any]] = []
    total_records = 0
    expected_files: set[str] = set()

    for slug, document in documents:
        profession = document["profession"]
        source = document["source"]
        record_count = sum(len(section["entries"]) for section in profession["sections"])
        skill_count = sum(
            len({row["name"] for row in section["entries"]})
            for section in profession["sections"]
        )
        total_records += record_count
        filename = f"{slug}.json"
        expected_files.add(filename)
        exported = {"profession": profession}
        if "data_sha256" in source:
            exported["archive"] = {
                "snapshot": metadata["snapshot"],
                "captured_at": metadata["captured_at"],
                "data_sha256": source["data_sha256"],
                "original_url": source["original_url"],
            }
        if "client_release" in source:
            exported["client_release"] = source["client_release"]
        write_json(output / "professions" / filename, exported)
        catalog.append({
            "slug": slug,
            "title": profession["title"],
            "classes": profession["title_classes"],
            "description": profession["descriptions"][0],
            "photo": profession["photo"],
            "skill_count": skill_count,
            "record_count": record_count,
        })

    professions_output = output / "professions"
    for stale_path in professions_output.glob("*.json"):
        if stale_path.name not in expected_files:
            stale_path.unlink()

    catalog.sort(key=lambda item: item["title"].casefold())
    write_json(output / "index.json", {
        "snapshot": metadata["snapshot"],
        "captured_at": metadata["captured_at"],
        "source_list": metadata["source_list"],
        "profession_count": len(catalog),
        "record_count": total_records,
        "professions": catalog,
    })
    return len(catalog), total_records

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--content", type=Path, default=DEFAULT_CONTENT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--validate-only", action="store_true",
        help="Validate YAML without writing site/data",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.validate_only:
            _, documents = load_content(args.content.resolve())
            print(f"VALID professions={len(documents)} content={args.content.resolve()}")
            return 0
        profession_count, record_count = build(
            args.content.resolve(), args.output.resolve()
        )
    except ContentError as error:
        raise SystemExit(f"CONTENT ERROR: {error}") from error
    print(
        f"RESULT professions={profession_count} records={record_count} "
        f"output={args.output.resolve()}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

