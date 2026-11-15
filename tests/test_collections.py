"""Reject broken collection links and quantities before they reach the website."""
import copy
import unittest
from pathlib import Path
from unittest.mock import patch

from generate import ContentError, load_collections


class CollectionContentTests(unittest.TestCase):
    def setUp(self):
        self.data = {
            "client_release": "2026.11.11.220300",
            "characteristics": [{"id": 2, "name": "Атака"}, {"id": 5, "name": "Точность"}],
            "items": [{"id": 10, "name": "Рубашка Империи", "icon": "/icon/shirt.png"},
                      {"id": 20, "name": "Рубашка Альянса", "icon": "/icon/shirt.png"}],
            "collections": [{
                "id": 1, "name": "Пример",
                "purchase_gold": 20000,
                "effects": [
                    {"id": 1, "characteristic_id": 2, "value": 0.5, "unit": "percent"},
                    {"id": 2, "characteristic_id": 5, "value": -5, "unit": "flat"},
                ],
                "variants": [
                    {"id": 0, "label": "Империя", "items": [{"item_id": 10, "count": 2}]},
                    {"id": 1, "label": "Альянс", "items": [{"item_id": 20, "count": 3}]},
                ],
            }],
        }

    def load(self):
        with patch("generate.load_yaml", return_value=copy.deepcopy(self.data)):
            return load_collections(Path("content"))

    def test_keeps_alternatives_quantities_and_negative_effect(self):
        row = self.load()["collections"][0]
        self.assertEqual([v["items"] for v in row["variants"]], [
            [{"item_id": 10, "count": 2}], [{"item_id": 20, "count": 3}],
        ])
        self.assertEqual(row["effects"][1]["value"], -5)
        self.assertEqual(row["effects"][0]["value"], 0.5)

    def test_unknown_items_in_normal_and_relic_composition(self):
        self.data["collections"][0]["variants"][0]["items"][0]["item_id"] = 999
        with self.assertRaisesRegex(ContentError, "variants.*item_id"):
            self.load()
        self.data["collections"][0]["variants"][0]["items"][0]["item_id"] = 10
        self.data["collections"][0]["relic_items"] = [{"item_id": 999, "count": 1}]
        with self.assertRaisesRegex(ContentError, "relic_items.*item_id"):
            self.load()

    def test_bad_quantities(self):
        for count in (0, -1, 0.5, True, "2"):
            with self.subTest(count=count):
                self.data["collections"][0]["variants"][0]["items"][0]["count"] = count
                with self.assertRaisesRegex(ContentError, "count"):
                    self.load()

    def test_unknown_characteristic(self):
        self.data["collections"][0]["effects"][0]["characteristic_id"] = 999
        with self.assertRaisesRegex(ContentError, "characteristic_id"):
            self.load()

    def test_invalid_effect_values_and_units(self):
        effect = self.data["collections"][0]["effects"][0]
        for value in (True, "1", float("nan"), float("inf")):
            with self.subTest(value=value):
                effect["value"] = value
                with self.assertRaisesRegex(ContentError, "value"):
                    self.load()
        effect.update(value=0.5, unit="flat")
        with self.assertRaisesRegex(ContentError, "целым"):
            self.load()
        effect.update(value=1, unit="unknown")
        with self.assertRaisesRegex(ContentError, "unit"):
            self.load()

    def test_duplicate_variant_ids(self):
        self.data["collections"][0]["variants"][1]["id"] = 0
        with self.assertRaisesRegex(ContentError, "variants.*id"):
            self.load()

    def test_duplicate_item_within_variant(self):
        items = self.data["collections"][0]["variants"][0]["items"]
        items.append(copy.deepcopy(items[0]))
        with self.assertRaisesRegex(ContentError, "повторяться"):
            self.load()

    def test_empty_composition(self):
        self.data["collections"][0]["variants"][0]["items"] = []
        with self.assertRaisesRegex(ContentError, "состав не должен быть пустым"):
            self.load()

    def test_invalid_purchase_prices(self):
        row = self.data["collections"][0]
        row["relic_items"] = [{"item_id": 10, "count": 1}]
        for field in ("purchase_gold", "relic_purchase_gold"):
            for value in (None, 0, -1, 0.5, True, "20000"):
                with self.subTest(field=field, value=value):
                    row[field] = value
                    with self.assertRaisesRegex(ContentError, field):
                        self.load()
            row[field] = 50000000
        self.assertEqual(self.load()["collections"][0]["relic_purchase_gold"], 50000000)

    def test_relic_price_requires_relic_variant(self):
        self.data["collections"][0]["relic_purchase_gold"] = 50000000
        with self.assertRaisesRegex(ContentError, "подтверждённого реликтового"):
            self.load()

    def test_every_item_requires_a_local_icon(self):
        item = self.data["items"][0]
        for value in (None, "", "https://example.com/icon.png", "/icon/../secret.png"):
            with self.subTest(value=value):
                item["icon"] = value
                with self.assertRaisesRegex(ContentError, "icon"):
                    self.load()


if __name__ == "__main__":
    unittest.main()
