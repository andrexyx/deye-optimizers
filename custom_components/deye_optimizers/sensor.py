from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import (
    UnitOfElectricCurrent,
    UnitOfElectricPotential,
    UnitOfEnergy,
    UnitOfPower,
)
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

DOMAIN = "deye_optimizers"


SENSOR_TYPES = {
    "DV1": {
        "name": "Input Voltage",
        "unit": UnitOfElectricPotential.VOLT,
        "device_class": SensorDeviceClass.VOLTAGE,
        "state_class": SensorStateClass.MEASUREMENT,
    },
    "DC1": {
        "name": "Input Current",
        "unit": UnitOfElectricCurrent.AMPERE,
        "device_class": SensorDeviceClass.CURRENT,
        "state_class": SensorStateClass.MEASUREMENT,
    },
    "DP1": {
        "name": "Input Power",
        "unit": UnitOfPower.WATT,
        "device_class": SensorDeviceClass.POWER,
        "state_class": SensorStateClass.MEASUREMENT,
    },
    "Etdy_g1": {
        "name": "Energy Today",
        "unit": UnitOfEnergy.KILO_WATT_HOUR,
        "device_class": SensorDeviceClass.ENERGY,
        "state_class": SensorStateClass.TOTAL_INCREASING,
    },
}


async def async_setup_entry(
    hass,
    entry,
    async_add_entities,
):
    """Set up Deye Optimizer sensors."""

    coordinator = entry.runtime_data

    known_devices = set()

    def check_new_devices():
        """Add sensors for newly discovered optimizers."""

        if not coordinator.data:
            return

        current_devices = set(coordinator.data.keys())

        new_devices = current_devices - known_devices

        if not new_devices:
            return

        entities = []

        for device_id in new_devices:

            known_devices.add(device_id)

            for sensor_key, description in SENSOR_TYPES.items():

                entities.append(
                    DeyeOptimizerSensor(
                        coordinator=coordinator,
                        device_id=device_id,
                        sensor_key=sensor_key,
                        description=description,
                    )
                )

        async_add_entities(entities)

    # Create sensors for optimizers already detected
    check_new_devices()

    # Automatically create sensors for optimizers added later
    entry.async_on_unload(
        coordinator.async_add_listener(
            check_new_devices
        )
    )


class DeyeOptimizerSensor(
    CoordinatorEntity,
    SensorEntity,
):
    """Representation of a Deye Optimizer sensor."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator,
        device_id,
        sensor_key,
        description,
    ):
        super().__init__(coordinator)

        self.device_id = device_id
        self.sensor_key = sensor_key

        device = coordinator.data[device_id]
        serial = device["serial"]

        self._attr_name = description["name"]

        self._attr_unique_id = (
            f"deye_optimizer_{serial}_{sensor_key}"
        )

        self._attr_native_unit_of_measurement = (
            description["unit"]
        )

        self._attr_device_class = (
            description["device_class"]
        )

        self._attr_state_class = (
            description["state_class"]
        )

        self._attr_device_info = DeviceInfo(
            identifiers={
                (DOMAIN, serial)
            },
            name=f"Deye Optimizer {serial}",
            manufacturer="Deye",
            model="Power Optimizer",
        )

    @property
    def native_value(self):
        """Return current sensor value."""

        device = self.coordinator.data.get(
            self.device_id
        )

        if not device:
            return None

        values = device.get("values", {})

        return values.get(
            self.sensor_key
        )

    @property
    def available(self):
        """Return sensor availability."""

        return (
            super().available
            and self.device_id
            in self.coordinator.data
        )

    @property
    def extra_state_attributes(self):
        """Return additional optimizer information."""

        device = self.coordinator.data.get(
            self.device_id
        )

        if not device:
            return {}

        return {
            "optimizer_id": device.get("id"),
            "serial_number": device.get("serial"),
            "site_id": device.get("site_id"),
            "device_type": device.get("type"),
        }
