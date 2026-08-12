"""Sensor entities for Deye Optimizers."""

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import UnitOfElectricCurrent, UnitOfElectricPotential, UnitOfEnergy, UnitOfPower
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN

SENSOR_TYPES = {
    "DV1": ("Input Voltage", UnitOfElectricPotential.VOLT, SensorDeviceClass.VOLTAGE, SensorStateClass.MEASUREMENT),
    "DC1": ("Input Current", UnitOfElectricCurrent.AMPERE, SensorDeviceClass.CURRENT, SensorStateClass.MEASUREMENT),
    "DP1": ("Input Power", UnitOfPower.WATT, SensorDeviceClass.POWER, SensorStateClass.MEASUREMENT),
    "Etdy_g1": ("Energy Today", UnitOfEnergy.KILO_WATT_HOUR, SensorDeviceClass.ENERGY, SensorStateClass.TOTAL_INCREASING),
}


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = entry.runtime_data
    known_devices: set[str] = set()

    def add_new_devices() -> None:
        entities = []
        for device_id in set(coordinator.data or {}) - known_devices:
            known_devices.add(device_id)
            entities.extend(
                DeyeOptimizerSensor(coordinator, device_id, key, description)
                for key, description in SENSOR_TYPES.items()
            )
        if entities:
            async_add_entities(entities)

    add_new_devices()
    entry.async_on_unload(coordinator.async_add_listener(add_new_devices))


class DeyeOptimizerSensor(CoordinatorEntity, SensorEntity):
    _attr_has_entity_name = True

    def __init__(self, coordinator, device_id, sensor_key, description):
        super().__init__(coordinator)
        self.device_id = device_id
        self.sensor_key = sensor_key
        device = coordinator.data[device_id]
        serial = device["serial"]
        name, unit, device_class, state_class = description
        self._attr_name = name
        self._attr_unique_id = f"deye_optimizer_{serial}_{sensor_key}"
        self._attr_native_unit_of_measurement = unit
        self._attr_device_class = device_class
        self._attr_state_class = state_class
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, serial)},
            name=f"Deye Optimizer {serial}",
            manufacturer="Deye",
            model="Power Optimizer",
            serial_number=serial,
        )

    @property
    def native_value(self):
        return (self.coordinator.data.get(self.device_id, {}).get("values", {}).get(self.sensor_key))

    @property
    def available(self):
        # A transient cloud failure does not erase the last valid state.
        return self.device_id in (self.coordinator.data or {}) and self.native_value is not None

    @property
    def extra_state_attributes(self):
        device = self.coordinator.data.get(self.device_id, {})
        return {
            "optimizer_id": device.get("id"),
            "serial_number": device.get("serial"),
            "site_id": device.get("site_id"),
            "device_type": device.get("type"),
            "device_status": device.get("status"),
            "last_update": device.get("last_update"),
        }

