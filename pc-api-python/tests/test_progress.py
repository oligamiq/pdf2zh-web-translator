import pytest
import math

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

def test_normalize_pdf2zh_overall_progress_less_than_one_is_percent_point():
    assert normalize_progress_percent(0.904988976054966) == pytest.approx(
        0.904988976054966
    )

def test_progress_does_not_jump_to_90_for_sub_one_percent_event():
    last_progress = 0.0
    incoming = normalize_progress_percent(0.904988976054966)
    progress = max(last_progress, incoming)
    assert progress < 1.0
    assert progress != pytest.approx(90.4988976054966)

def test_upstream_sub_one_progress_does_not_override_early_progress_to_90():
    last_progress = 15.0
    incoming = normalize_progress_percent(0.904988976054966)
    progress = max(last_progress, incoming)
    assert progress == pytest.approx(15.0)
    assert progress < 20.0
