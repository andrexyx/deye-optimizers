"""Constants for Deye Optimizers."""

from datetime import timedelta

DOMAIN = "deye_optimizers"
PLATFORMS = ["sensor"]

CONF_TOKEN = "token"
CONF_STATION_ID = "station_id"
CONF_SCAN_INTERVAL = "scan_interval"

DEFAULT_SCAN_INTERVAL = 60
MIN_SCAN_INTERVAL = 30
MAX_SCAN_INTERVAL = 900
DEFAULT_TIMEOUT = 20
DEFAULT_RETRIES = 2
DEFAULT_UPDATE_INTERVAL = timedelta(seconds=DEFAULT_SCAN_INTERVAL)

BASE_URL = "https://www.deyecloud.com"

