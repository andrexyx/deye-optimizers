"""Config flow for Deye Optimizers."""

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback

from .const import (
    CONF_SCAN_INTERVAL,
    CONF_STATION_ID,
    CONF_TOKEN,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    MAX_SCAN_INTERVAL,
    MIN_SCAN_INTERVAL,
)


class DeyeOptimizersConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle the Deye Optimizers config flow."""

    VERSION = 2

    async def async_step_user(self, user_input=None):
        """Create an entry from a Deye token and station ID."""
        if user_input is not None:
            station_id = user_input[CONF_STATION_ID].strip()
            await self.async_set_unique_id(station_id)
            self._abort_if_unique_id_configured()
            return self.async_create_entry(
                title=f"Deye Optimizers {station_id}",
                data={
                    CONF_TOKEN: user_input[CONF_TOKEN].split("|")[0].strip(),
                    CONF_STATION_ID: station_id,
                },
            )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_TOKEN): str,
                    vol.Required(CONF_STATION_ID): str,
                }
            ),
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return DeyeOptimizersOptionsFlow()


class DeyeOptimizersOptionsFlow(config_entries.OptionsFlow):
    """Configure polling options."""

    async def async_step_init(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.All(
                        vol.Optional(
                            CONF_SCAN_INTERVAL,
                            default=self.config_entry.options.get(
                                CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL
                            ),
                        ),
                        vol.Coerce(int),
                        vol.Range(min=MIN_SCAN_INTERVAL, max=MAX_SCAN_INTERVAL),
                    ): int
                }
            ),
        )

