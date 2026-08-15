import math
import unittest


def normalize_progress_percent(value: object) -> float | None:
    if value is None:
        return None
    try:
        progress = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(progress):
        return None
    return max(0.0, min(100.0, progress))


class ProgressNormalizationTests(unittest.TestCase):
    def test_sub_one_value_is_a_percent_point(self):
        self.assertTrue(math.isclose(normalize_progress_percent(0.904988976054966), 0.904988976054966))

    def test_sub_one_value_does_not_jump_to_ninety_percent(self):
        last_progress = 0.0
        incoming = normalize_progress_percent(0.904988976054966)
        self.assertIsNotNone(incoming)
        progress = max(last_progress, incoming)
        self.assertLess(progress, 1.0)
        self.assertFalse(math.isclose(progress, 90.4988976054966))

    def test_sub_one_value_does_not_override_early_progress(self):
        last_progress = 15.0
        incoming = normalize_progress_percent(0.904988976054966)
        self.assertIsNotNone(incoming)
        progress = max(last_progress, incoming)
        self.assertTrue(math.isclose(progress, 15.0))
        self.assertLess(progress, 20.0)


if __name__ == '__main__':
    unittest.main()
