"""Unit tests for coordinator parsing helpers."""

from custom_components.deye_optimizers.coordinator import DeyeOptimizerCoordinator


def test_latest_value_uses_newest_valid_value():
    assert DeyeOptimizerCoordinator._latest_value([{"value": 10}, {"value": "12.5"}]) == 12.5


def test_latest_value_ignores_empty_items():
    assert DeyeOptimizerCoordinator._latest_value([None, {}, {"value": ""}]) is None


def test_device_list_handles_nested_payload():
    payload = {"data": {"data": [{"id": 1, "type": "OPTIMIZER"}, {"id": 2, "type": "INVERTER"}]}}
    assert DeyeOptimizerCoordinator._device_list(payload) == [{"id": 1, "type": "OPTIMIZER"}]

