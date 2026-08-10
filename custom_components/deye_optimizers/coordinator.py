import logging
from datetime import datetime, timedelta
from urllib.parse import quote

from aiohttp import ClientError, ClientTimeout

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator,
    UpdateFailed,
)

_LOGGER = logging.getLogger(__name__)

BASE_URL = "https://www.deyecloud.com"


class DeyeOptimizerCoordinator(DataUpdateCoordinator):
    """Coordinator for Deye Power Optimizers."""

    def __init__(
        self,
        hass: HomeAssistant,
        config_entry: ConfigEntry,
        token: str,
        station_id: str,
    ) -> None:
        self.token = token.split("|")[0].strip()
        self.station_id = str(station_id).strip()
        self.session = async_get_clientsession(hass)

        super().__init__(
            hass,
            _LOGGER,
            name="Deye Optimizers",
            config_entry=config_entry,
            update_interval=timedelta(minutes=5),
        )

    async def _request(self, url: str):
        """Get JSON from Deye Cloud."""

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/json",
        }

        try:
            async with self.session.get(
                url,
                headers=headers,
                timeout=ClientTimeout(total=30),
            ) as response:

                if response.status == 401:
                    raise ConfigEntryAuthFailed(
                        "Deye Cloud token expired or invalid"
                    )

                if response.status != 200:
                    text = await response.text()
                    raise UpdateFailed(
                        f"Deye Cloud HTTP {response.status}: {text[:200]}"
                    )

                return await response.json(content_type=None)

        except ConfigEntryAuthFailed:
            raise

        except ClientError as err:
            raise UpdateFailed(
                f"Communication error with Deye Cloud: {err}"
            ) from err

    @staticmethod
    def _latest_value(detail_list):
        """Return the newest usable value from a Deye detailList."""

        if not detail_list:
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

            for key in (
                "value",
                "val",
                "data",
                "v",
                "y",
                "deviceValue",
                "paramValue",
            ):
                value = item.get(key)

                if value in (None, ""):
                    continue

                try:
                    return float(value)
                except (TypeError, ValueError):
                    return value

        return None

    async def _async_update_data(self):
        """Fetch optimizer list and telemetry."""

        list_url = (
            f"{BASE_URL}/maintain-s/operating/station/"
            f"{self.station_id}/common"
            "?page=1"
            "&size=50"
            "&order.direction=ASC"
            "&order.property=device_sn"
            "&deviceType=OPTIMIZER"
        )

        result = await self._request(list_url)

        devices = result.get("data", [])

        if isinstance(devices, dict):
            devices = devices.get("data", [])

        if not isinstance(devices, list):
            devices = []

        optimizers = [
            device
            for device in devices
            if str(device.get("type", "")).upper() == "OPTIMIZER"
        ]

        today = quote(
            datetime.now().strftime("%Y/%m/%d"),
            safe="",
        )

        output = {}

        for optimizer in optimizers:

            device_id = optimizer.get("id")

            if not device_id:
                continue

            serial = (
                optimizer.get("deviceSn")
                or optimizer.get("devicesn")
                or optimizer.get("serial")
                or str(device_id)
            )

            stats_url = (
                f"{BASE_URL}/device-s/device/"
                f"{device_id}/stats/day"
                f"?day={today}&lan=en"
            )

            stats = await self._request(stats_url)

            if isinstance(stats, dict):
                stats = stats.get("data", stats)

            if not isinstance(stats, list):
                stats = []

            values = {}

            for series in stats:

                storage_name = series.get("storageName")

                if storage_name not in (
                    "DV1",
                    "DC1",
                    "DP1",
                    "Etdy_g1",
                ):
                    continue

                values[storage_name] = self._latest_value(
                    series.get("detailList", [])
                )

            output[str(device_id)] = {
                "id": str(device_id),
                "serial": str(serial),
                "site_id": optimizer.get("siteId"),
                "type": optimizer.get("type"),
                "values": values,
            }

        return output
