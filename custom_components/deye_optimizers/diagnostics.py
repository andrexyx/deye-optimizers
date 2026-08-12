"""Diagnostics for Deye Optimizers."""

from homeassistant.components.diagnostics import async_redact_data

TO_REDACT = {"token"}


async def async_get_config_entry_diagnostics(hass, entry):
    coordinator = entry.runtime_data
    return {
        "config_entry": async_redact_data(dict(entry.data), TO_REDACT),
        "options": dict(entry.options),
        "last_successful_update": (
            coordinator.last_successful_update.isoformat()
            if coordinator.last_successful_update else None
        ),
        "last_partial_error": coordinator.last_partial_error,
        "optimizer_count": len(coordinator.data or {}),
        "optimizers": list((coordinator.data or {}).values()),
    }

