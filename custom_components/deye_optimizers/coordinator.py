"""Deye Cloud data coordinator."""

from __future__ import annotations

import asyncio
from copy import deepcopy
from datetime import datetime, timedelta
import logging
from typing import Any
from urllib.parse import quote

from aiohttp import ClientError, ClientResponseError, ClientTimeout

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import (
    BASE_URL,
    CONF_SCAN_INTERVAL,
    DEFAULT_RETRIES,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_TIMEOUT,
)

_LOGGER = logging.getLogger(__name__)
SUPPORTED_VALUES = ("DV1", "DC1", "DP1", "Etdy_g1")


class DeyeOptimizerCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Fetch and retain Deye optimizer telemetry."""

    def __init__(self, hass: HomeAssistant, config_entry: ConfigEntry, token: str, station_id: str) -> None:
        self.token = token.split("|")[0].strip()
        self.station_id = str(station_id).strip()
        self.session = async_get_clientsession(hass)
        self.last_successful_update: datetime | None = None
        self.last_partial_error: str | None = None
        interval = config_entry.options.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)
        super().__init__(
            hass,
            _LOGGER,
            name="Deye Optimizers",
            config_entry=config_entry,
            update_interval=timedelta(seconds=interval),
        )

    async def _request(self, url: str) -> Any:
        headers = {"Authorization": f"Bearer {self.token}", "Accept": "application/json"}
        last_error: Exception | None = None

        for attempt in range(DEFAULT_RETRIES + 1):
            try:
                async with self.session.get(
                    url, headers=headers, timeout=ClientTimeout(total=DEFAULT_TIMEOUT)
                ) as response:
                    if response.status in (401, 403):
                        raise ConfigEntryAuthFailed("Deye Cloud token expired or invalid")
                    if response.status != 200:
                        body = await response.text()
                        raise ClientResponseError(
                            response.request_info,
                            response.history,
                            status=response.status,
                            message=body[:160],
                        )
                    return await response.json(content_type=None)
            except ConfigEntryAuthFailed:
                raise
            except (ClientError, asyncio.TimeoutError) as err:
                last_error = err
                if attempt < DEFAULT_RETRIES:
                    await asyncio.sleep(0.75 * (2**attempt))

        raise UpdateFailed(f"Deye Cloud request failed after retries: {last_error}")

    @staticmethod
    def _latest_value(detail_list: Any) -> Any:
        if not isinstance(detail_list, list):
            return None
        for item in reversed(detail_list):
            if isinstance(item, (int, float)):
                return item
            if isinstance(item, str):
                try:
                    return float(item)
                except ValueError:
                    continue
            if not isinstance(item, dict):
                continue
            for key in ("value", "val", "data", "v", "y", "deviceValue", "paramValue"):
                value = item.get(key)
                if value in (None, ""):
                    continue
                try:
                    return float(value)
                except (TypeError, ValueError):
                    return value
        return None

    @staticmethod
    def _device_list(payload: Any) -> list[dict[str, Any]]:
        data = payload.get("data", []) if isinstance(payload, dict) else []
        if isinstance(data, dict):
            data = data.get("data", data.get("content", []))
        if not isinstance(data, list):
            return []
        return [
            item for item in data
            if isinstance(item, dict)
            and str(item.get("type") or item.get("deviceType") or "").upper() == "OPTIMIZER"
        ]

    async def _async_update_data(self) -> dict[str, Any]:
        list_url = (
            f"{BASE_URL}/maintain-s/operating/station/{self.station_id}/common"
            "?page=1&size=200&order.direction=ASC&order.property=device_sn&deviceType=OPTIMIZER"
        )
        devices = self._device_list(await self._request(list_url))
        previous = deepcopy(self.data or {})
        output: dict[str, Any] = {}
        partial_errors: list[str] = []
        today = quote(datetime.now().strftime("%Y/%m/%d"), safe="")

        for optimizer in devices:
            device_id = optimizer.get("id") or optimizer.get("deviceId")
            if not device_id:
                continue
            key = str(device_id)
            serial = str(
                optimizer.get("deviceSn")
                or optimizer.get("devicesn")
                or optimizer.get("serial")
                or key
            )
            old = previous.get(key, {})
            values = dict(old.get("values", {}))
            try:
                stats = await self._request(
                    f"{BASE_URL}/device-s/device/{device_id}/stats/day?day={today}&lan=en"
                )
                if isinstance(stats, dict):
                    stats = stats.get("data", stats)
                if not isinstance(stats, list):
                    stats = []
                for series in stats:
                    if not isinstance(series, dict):
                        continue
                    storage_name = series.get("storageName")
                    if storage_name in SUPPORTED_VALUES:
                        value = self._latest_value(series.get("detailList", []))
                        if value is not None:
                            values[storage_name] = value
            except UpdateFailed as err:
                partial_errors.append(f"{serial}: {err}")

            output[key] = {
                "id": key,
                "serial": serial,
                "site_id": optimizer.get("siteId") or self.station_id,
                "type": optimizer.get("type") or optimizer.get("deviceType") or "OPTIMIZER",
                "status": optimizer.get("status") or optimizer.get("deviceStatus"),
                "values": values,
                "last_update": datetime.now().isoformat(timespec="seconds"),
            }

        if not output and previous:
            raise UpdateFailed("Deye Cloud returned no optimizers; keeping the last valid dataset")

        self.last_successful_update = datetime.now()
        self.last_partial_error = "; ".join(partial_errors) if partial_errors else None
        if partial_errors:
            _LOGGER.warning("Partial optimizer update; retained last valid values: %s", self.last_partial_error)
        return output

