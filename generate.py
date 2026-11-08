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
PROFESSION_ICON_DIR = ROOT / "site" / "assets" / "profession-icons"
SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
KNOWN_BRANCHES = {"base", "one", "two", "three"}
CLIENT_RELEASE_PATTERN = re.compile(r"\d{4}\.\d{2}\.\d{2}\.\d{6}")
ENCHANTMENT_PAGES = ("enchant-skills", "enchant-weapon")
PROGRESSION_PAGES = {
    "banners": "item_id",
    "dragon-relics": "item_id",
    "equipment-properties": "effect_id",
    "military-service": None,
}
SERVICE_SLOTS = {"critical-power", "critical-chance", "attack", "speed"}
CLASS_SKILL_LABELS = {
    "класс чародеев": "Чародеи",
    "класс тяжелых воинов": "Тяжёлые воины",
    "класс легких воинов": "Лёгкие воины",
    "класс магов": "Маги",
    "класс мастеров войны": "Мастера войны",
    "класс рыцарей": "Рыцари",
    "класс убийц": "Убийцы",
    "класс стрелков": "Стрелки",
    "класс лекарей": "Лекари",
    "класс менталистов": "Менталисты",
}


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


def validate_enchant_effects(row: dict[str, Any], path: Path, location: str) -> None:
    effects = require_string_list(row, "effects", path, location)
    if not effects or any(not effect.strip() for effect in effects):
        fail(path, f"{location}.effects", "нужен хотя бы один непустой эффект")


def load_enchantments(content: Path, page: str) -> dict[str, Any] | None:
    path = content / "specifications" / f"{page}.yaml"
    if not path.is_file():
        return None
    data = require_mapping(load_yaml(path), path, page)
    source = require_string(data, "source", path, page)
    if not source.startswith("https://"):
        fail(path, f"{page}.source", "ожидалась ссылка HTTPS")
    categories = require_list(data.get("categories"), path, "categories")
    if not categories:
        fail(path, "categories", "нужен хотя бы один тип заточки")
    for i, category_value in enumerate(categories):
        category_path = f"categories[{i}]"
        category = require_mapping(category_value, path, category_path)
        require_string(category, "title", path, category_path)
        skills = require_list(category.get("skills"), path, f"{category_path}.skills")
        if not skills:
            fail(path, f"{category_path}.skills", "нужно хотя бы одно умение")
        for j, skill_value in enumerate(skills):
            skill_path = f"{category_path}.skills[{j}]"
            skill = require_mapping(skill_value, path, skill_path)
            require_string(skill, "name", path, skill_path)
            require_string(skill, "icon", path, skill_path, allow_empty=True)
            if page == "enchant-weapon":
                require_string(skill, "description", path, skill_path)
                validate_enchant_effects(skill, path, skill_path)
                continue
            if "description" in skill:
                require_string(skill, "description", path, skill_path)
            levels = require_list(skill.get("levels"), path, f"{skill_path}.levels")
            if not levels:
                fail(path, f"{skill_path}.levels", "нужен хотя бы один уровень")
            previous_level = 0
            for k, level_value in enumerate(levels):
                level_path = f"{skill_path}.levels[{k}]"
                level = require_mapping(level_value, path, level_path)
                number = level.get("level")
                if type(number) is not int or number <= previous_level:
                    fail(path, f"{level_path}.level", "уровни должны быть положительными и идти по возрастанию")
                previous_level = number
                if "description" not in skill or "description" in level:
                    require_string(level, "description", path, level_path)
                validate_enchant_effects(level, path, level_path)
    return data


def load_pit_jewelry(content: Path) -> dict[str, Any] | None:
    path = content / "items" / "pit-boss-jewelry.yaml"
    if not path.is_file():
        return None
    data = require_mapping(load_yaml(path), path, "jewelry")
    source = require_string(data, "source", path, "jewelry")
    if not source.startswith("https://"):
        fail(path, "jewelry.source", "ожидалась ссылка HTTPS")
    release = require_string(data, "client_release", path, "jewelry")
    if not re.fullmatch(r"\d{4}\.\d{2}\.\d{2}\.\d{6}", release):
        fail(path, "jewelry.client_release", "ожидался номер релиза клиента")
    ranks = require_list(data.get("ranks"), path, "ranks")
    seen_ranks: set[str] = set()
    seen_items: set[int] = set()
    for i, rank_value in enumerate(ranks):
        rank_path = f"ranks[{i}]"
        rank = require_mapping(rank_value, path, rank_path)
        label = require_string(rank, "rank", path, rank_path)
        if label not in {"EL", "MA"} or label in seen_ranks:
            fail(path, f"{rank_path}.rank", "ожидался уникальный ранг EL или MA")
        seen_ranks.add(label)
        bosses = require_list(rank.get("bosses"), path, f"{rank_path}.bosses")
        if not bosses:
            fail(path, f"{rank_path}.bosses", "нужен хотя бы один пит-босс")
        variants = {"epic", "relic"}
        if label == "EL":
            variants.add("normal")
        for j, boss_value in enumerate(bosses):
            boss_path = f"{rank_path}.bosses[{j}]"
            boss = require_mapping(boss_value, path, boss_path)
            require_string(boss, "name", path, boss_path)
            items = require_list(boss.get("items"), path, f"{boss_path}.items")
            if not items:
                fail(path, f"{boss_path}.items", "нужно хотя бы одно украшение")
            for k, item_value in enumerate(items):
                item_path = f"{boss_path}.items[{k}]"
                item = require_mapping(item_value, path, item_path)
                item_id = item.get("item_id")
                if type(item_id) is not int or item_id <= 0 or item_id in seen_items:
                    fail(path, f"{item_path}.item_id", "ожидался уникальный положительный ID предмета")
                seen_items.add(item_id)
                require_string(item, "name", path, item_path)
                require_string(item, "icon", path, item_path, allow_empty=True)
                variant = require_string(item, "variant", path, item_path)
                if variant not in variants:
                    fail(path, f"{item_path}.variant", "неизвестный вариант для этого ранга")
                defense = item.get("magic_defense")
                if type(defense) is not int or defense < 0:
                    fail(path, f"{item_path}.magic_defense", "ожидалось целое неотрицательное число")
                if item.get("gear_level") is not None:
                    level = require_string(item, "gear_level", path, item_path)
                    if not re.fullmatch(r"\d+(?:\.\d+)?", level):
                        fail(path, f"{item_path}.gear_level", "ожидался уровень экипировки")
                require_string_list(item, "effects", path, item_path)
    if seen_ranks != {"EL", "MA"}:
        fail(path, "ranks", "нужны оба ранга EL и MA")
    return data


def load_progression(content: Path, page: str) -> dict[str, Any]:
    path = content / "specifications" / f"{page}.yaml"
    data = require_mapping(load_yaml(path), path, page)
    release = require_string(data, "client_release", path, page)
    if not CLIENT_RELEASE_PATTERN.fullmatch(release):
        fail(path, "client_release", "ожидался номер релиза клиента")
    groups = require_list(data.get("groups"), path, "groups")
    if not groups:
        fail(path, "groups", "нужна хотя бы одна группа")
    military = page == "military-service"
    slots: set[tuple[str, str]] = set()
    group_keys: set[str | int] = set()
    record_ids: set[int] = set()
    id_key = PROGRESSION_PAGES[page]
    if military and (type(data.get("rank_limit")) is not int or data["rank_limit"] < 1):
        fail(path, "rank_limit", "ожидался положительный целый ранг")
    if military:
        rank_icons = require_mapping(data.get("rank_icons"), path, "rank_icons")
        for kind in ("order", "insignia", "medal"):
            require_string(rank_icons, kind, path, "rank_icons")
    for index, value in enumerate(groups):
        location = f"groups[{index}]"
        group = require_mapping(value, path, location)
        name = require_string(group, "name", path, location)
        key: str | int = name
        if "icon" in group:
            require_string(group, "icon", path, location)
        if military:
            key = group.get("skill_id")
            if type(key) is not int or key < 1:
                fail(path, f"{location}.skill_id", "ожидался положительный ID умения")
            kind = require_string(group, "kind", path, location)
            if kind not in {"award", "medal"}:
                fail(path, f"{location}.kind", "ожидались награды или медали")
            if "slot" in group:
                slot = require_string(group, "slot", path, location)
                if slot not in SERVICE_SLOTS or (kind, slot) in slots:
                    fail(path, f"{location}.slot", "неизвестная или повторная ветка")
                slots.add((kind, slot))
        if key in group_keys:
            fail(path, location, "повторная группа")
        group_keys.add(key)
        levels = require_list(group.get("levels"), path, f"{location}.levels")
        if not levels:
            fail(path, f"{location}.levels", "нужен хотя бы один уровень")
        for level, value in enumerate(levels, start=1):
            row_path = f"{location}.levels[{level - 1}]"
            row = require_mapping(value, path, row_path)
            if type(row.get("level")) is not int or row["level"] != level:
                fail(path, f"{row_path}.level", "ожидались уровни от 1 без пропусков")
            require_string(row, "effect", path, row_path)
            if id_key:
                record_id = row.get(id_key)
                if type(record_id) is not int or record_id < 1 or record_id in record_ids:
                    fail(path, f"{row_path}.{id_key}", "ожидался уникальный положительный ID")
                record_ids.add(record_id)
    if military and slots != {(kind, slot) for kind in ("award", "medal") for slot in SERVICE_SLOTS}:
        fail(path, "groups", "для обоих типов нужны четыре ветки калькулятора")
    return data


def build(content: Path, output: Path) -> tuple[int, int]:
    metadata, documents = load_content(content)
    enchantments = {page: load_enchantments(content, page) for page in ENCHANTMENT_PAGES}
    progression = {page: load_progression(content, page) for page in PROGRESSION_PAGES}
    pit_jewelry = load_pit_jewelry(content)
    icons = {
        path.stem: f"assets/profession-icons/{path.name}"
        for path in sorted(PROFESSION_ICON_DIR.glob("*"))
        if path.is_file() and path.suffix in {".jpg", ".png", ".gif", ".webp"}
    }
    catalog: list[dict[str, Any]] = []
    catalog_categories: set[str] = set()
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
        skill_names = {
            row["name"].casefold().replace("ё", "е")
            for section in profession["sections"]
            for row in section["entries"]
        }
        categories = [label for name, label in CLASS_SKILL_LABELS.items() if name in skill_names]
        catalog_categories.update(categories)
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
            "categories": categories,
            "description": profession["descriptions"][0],
            "photo": profession["photo"],
            "icon": icons.get(slug, ""),
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
        "categories": [label for label in CLASS_SKILL_LABELS.values() if label in catalog_categories],
        "professions": catalog,
    })
    icon_dir = ROOT / "site" / "assets" / "icons"
    available_icons = {
        f"/icon/{path.relative_to(icon_dir).as_posix()}"
        for path in icon_dir.rglob("*") if path.is_file()
    }
    for page, data in enchantments.items():
        enchant_output = output / "specifications" / f"{page}.json"
        if data is not None:
            for category in data["categories"]:
                for skill in category["skills"]:
                    if skill["icon"] not in available_icons:
                        skill["icon"] = ""
            write_json(enchant_output, data)
        else:
            enchant_output.unlink(missing_ok=True)
    for page, data in progression.items():
        for group in data["groups"]:
            if group.get("icon") not in available_icons:
                group.pop("icon", None)
        write_json(output / "specifications" / f"{page}.json", data)
    jewelry_output = output / "items" / "pit-boss-jewelry.json"
    if pit_jewelry is not None:
        for rank in pit_jewelry["ranks"]:
            for boss in rank["bosses"]:
                for item in boss["items"]:
                    if item["icon"] not in available_icons:
                        item["icon"] = ""
        write_json(jewelry_output, pit_jewelry)
    else:
        jewelry_output.unlink(missing_ok=True)
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
            for page in ENCHANTMENT_PAGES:
                load_enchantments(args.content.resolve(), page)
            for page in PROGRESSION_PAGES:
                load_progression(args.content.resolve(), page)
            load_pit_jewelry(args.content.resolve())
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

