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

PARAMETERS = {
    "DV1": "Input Voltage",
    "DC1": "Input Current",
    "DP1": "Input Power",
    "Etdy_g1": "Energy Today",
}


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
        """Request JSON from Deye Cloud."""

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
                        f"Deye Cloud HTTP {response.status}: "
