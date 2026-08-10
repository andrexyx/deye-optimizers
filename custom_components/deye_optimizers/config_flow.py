import voluptuous as vol

from homeassistant import config_entries

DOMAIN = "deye_optimizers"


class DeyeOptimizersConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(
                title="Deye Optimizers",
                data={
                    "token": user_input["token"].strip(),
                    "station_id": user_input["station_id"].strip(),
                },
            )

        schema = vol.Schema(
            {
                vol.Required("token"): str,
                vol.Required(
                    "station_id",
                    default="61599740",
                ): str,
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
        )
