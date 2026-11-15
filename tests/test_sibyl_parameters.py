"""Keep uncertain card values labelled and preserve unknown cells."""
import copy
from pathlib import Path
import unittest

import yaml

from generate import ContentError, validate_sibyl_parameters


class SibylParameterTests(unittest.TestCase):
    def setUp(self):
        self.group = {
            "levels": [{"level": 1}, {"level": 2}],
            "parameters": {
                "verification": "required",
                "columns": ["Урон", "Задержка", "Шанс"],
                "levels": [
                    {"level": 1, "values": ["+2.875%", "-3%", "+1 ед."]},
                    {"level": 2, "values": ["+3,25%", "-4%", None]},
                ],
            },
        }

    def validate(self):
        validate_sibyl_parameters(self.group, Path("cards.yaml"), "groups[0]")

    def test_preserves_signs_precision_units_and_unknowns(self):
        before = copy.deepcopy(self.group)
        self.validate()
        self.assertEqual(self.group, before)

    def test_verification_label_cannot_be_omitted(self):
        for value in (None, "", "verified"):
            with self.subTest(value=value):
                self.group["parameters"]["verification"] = value
                with self.assertRaisesRegex(ContentError, "verification"):
                    self.validate()

    def test_column_and_level_alignment(self):
        self.group["parameters"]["levels"][0]["values"].pop()
        with self.assertRaisesRegex(ContentError, "число значений"):
            self.validate()
        self.setUp()
        self.group["parameters"]["levels"][1]["level"] = 3
        with self.assertRaisesRegex(ContentError, "без пропусков"):
            self.validate()
        self.group["parameters"]["levels"].pop()
        with self.assertRaisesRegex(ContentError, "всех уровней"):
            self.validate()

    def test_unknown_must_be_explicit_null(self):
        for value in ("", " ", 0, True):
            with self.subTest(value=value):
                self.group["parameters"]["levels"][1]["values"][2] = value
                with self.assertRaisesRegex(ContentError, "null"):
                    self.validate()

    def test_supplied_tables_include_level_15_update_and_irregular_values(self):
        path = Path(__file__).resolve().parents[1] / "content/specifications/sibyl-cards.yaml"
        groups = yaml.safe_load(path.read_text("utf-8"))["groups"]
        tables = {group["name"]: group["parameters"] for group in groups if "parameters" in group}
        self.assertEqual(len(tables), 30)
        unknowns = [(name, row["level"], table["columns"][index])
                    for name, table in tables.items() for row in table["levels"]
                    for index, value in enumerate(row["values"]) if value is None]
        self.assertEqual(unknowns, [])
        self.assertEqual(tables["Карта многогранности"]["levels"][-1]["values"][-3:],
                         ["+3 ед.", "+5.625%", "+3.375%"])
        self.assertEqual(tables["Карта живучести"]["levels"][10]["values"][2], "950 ед.")
        self.assertEqual(tables["Карта удачи"]["levels"][6]["values"][2], "+6.5%")
        self.assertEqual(tables["Карта атаки"]["levels"][5]["values"][2], "6%")
        self.assertEqual(tables["Карта молнии"]["levels"][-1]["values"][-1], "+205")
        self.assertEqual(tables["Карта контакта"]["levels"][5]["values"][-2:], ["-17.25%", "+5 750 ед."])
        self.assertEqual(tables["Карта лечения"]["levels"][-1]["values"][-3:],
                         ["+33.75%", "+33.75%", "+11 250 ед."])
        self.assertEqual(tables["Карта регенерации"]["levels"][5]["values"][-2:], ["+0.55%", "+0.55%"])
        self.assertEqual(tables["Карта регенерации"]["levels"][-1]["values"][-2:], ["+1.0%", "+1.0%"])
        self.assertEqual(tables["Карта неуязвимости"]["levels"][5]["values"][-1], "+14 375 ед.")
        self.assertEqual(tables["Карта святости"]["levels"][-1]["values"][-1],
                         "Продлевает «Святой щит», регенерирует HP и CP под его действием")
        self.assertEqual(tables["Карта умелости"]["levels"][10]["values"][-3:], ["18.5%", "11.1%", "9.25%"])
        self.assertEqual(tables["Карта пиявки"]["levels"][7]["values"][-1], "30%")
        self.assertEqual(tables["Карта пиявки"]["levels"][9]["values"][-1], "36%")
        self.assertEqual([row["values"][-1] for row in tables["Карта ментальности"]["levels"]],
                         ["+1 ед."] * 6 + ["+2 ед."] * 8 + ["+3 ед."])
        self.assertEqual(tables["Карта борьбы"]["levels"][5]["values"],
                         ["2,3%", "11,5%", "5,75%", "5,75%", "5,75%", "5,75%", "5,75%"])
        self.assertEqual([tables["Карта предательства"]["levels"][level - 1]["values"][-1]
                          for level in (6, 11, 14)], ["+35%", "+55%", "+62.5%"])
        self.assertEqual(tables["Карта легкости"]["levels"][5]["values"][-3:],
                         ["+5 ед.", "+5 ед.", "+17"])
        self.assertEqual(tables["Карта дистанции"]["levels"][7]["values"][-2:], ["+130", "-15%"])
        self.assertEqual(tables["Карта твердыни"]["levels"][-1]["values"][-3:],
                         ["-90%", "+30%", "+30%"])
        self.assertEqual(tables["Карта добытчика"]["levels"][5]["values"][-2:], ["57 ед.", "35%"])
        self.assertEqual(tables["Карта стабильности"]["levels"][5]["values"][-1], "8.05%")
        self.assertEqual(tables["Карта отклонение"]["levels"][-1]["values"], ["+4,5%", "+22,5%"])
        for name in ("Карта эйфории", "Карта надзора", "Карта элементального боя", "Карта отклонение"):
            with self.subTest(name=name):
                self.assertEqual(len(tables[name]["columns"]), 2)


if __name__ == "__main__":
    unittest.main()
