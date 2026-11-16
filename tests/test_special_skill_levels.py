import unittest
from pathlib import Path

from generate import load_yaml


ROOT = Path(__file__).resolve().parents[1]


class SpecialSkillLevelsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.skills = {}
        for path in (ROOT / "content" / "professions").glob("*.yaml"):
            profession = load_yaml(path)["profession"]
            for section in profession["sections"]:
                for first in section["entries"]:
                    if (first["level"] == "1" and first.get("skill_id")
                            and "Уровень изучения: 90" in first["specifications"]):
                        cls.skills[path.stem, first["skill_id"]] = [
                            row for row in section["entries"]
                            if row.get("skill_id") == first["skill_id"]
                            and row["branch"] == first["branch"]
                        ]

    def test_special_skills_have_all_five_levels(self):
        self.assertGreaterEqual(len(self.skills), 148)
        for key, rows in self.skills.items():
            with self.subTest(profession=key[0], skill_id=key[1]):
                self.assertEqual([row["level"] for row in rows], ["1", "2", "3", "4", "5"])
                self.assertEqual(len({row["name"] for row in rows}), 1)
                self.assertTrue(all(row["description"] for row in rows))
                self.assertTrue(all("%%" not in row["description"] for row in rows))

    def test_beast_power_has_distinct_confirmed_values(self):
        rows = self.skills["monah", 23846]
        expected = [
            ("10%", "4%", "3", "1000"),
            ("15%", "7%", "6", "2000"),
            ("20%", "10%", "9", "3000"),
            ("22.5%", "11.5%", "10", "3500"),
            ("25%", "13%", "11", "4000"),
        ]
        for row, (attack, defense, speed, recovery) in zip(rows, expected, strict=True):
            with self.subTest(level=row["level"]):
                self.assertIn(
                    f"магическую атаку на {attack}, защиту на {defense}, "
                    f"скорость бега на {speed} и восстановление жизненных сил на {recovery}.",
                    row["description"],
                )
                self.assertIn("сбрасывает откат умений", row["description"])


if __name__ == "__main__":
    unittest.main()
