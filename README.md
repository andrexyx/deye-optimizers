# Deye Optimizers 2.0

Community Home Assistant integration for Deye Power Optimizers through Deye Cloud. Version 2.0 includes stable optimizer sensors, resilient polling, diagnostics, and the **Deye Optimizer Flow** dashboard card.

> This is not an official Deye integration. Never publish your Deye token.

## Features

- automatic discovery of all `OPTIMIZER` devices in a Deye station;
- voltage, current, power, and daily-energy sensors per optimizer;
- configurable refresh every 30–900 seconds;
- retry, timeout, partial-update handling, and retention of the last valid values;
- stable unique IDs based on optimizer serial numbers;
- diagnostics with credentials redacted;
- included responsive dashboard card with a fixed 1–6 × 1–6 grid;
- global portrait or landscape orientation that does not change on phones.

## Installation with HACS

1. Open **HACS → Integrations**.
2. Open the menu and choose **Custom repositories**.
3. Add `https://github.com/andrexyx/deye-optimizers` as category **Integration**.
4. Install **Deye Optimizers** and restart Home Assistant.
5. Go to **Settings → Devices & services → Add Integration**.
6. Search for **Deye Optimizers**, then enter your token and Station ID.

The illustrated token guide is in [docs/GET_DEYE_TOKEN.md](docs/GET_DEYE_TOKEN.md).

## Refresh interval

Open **Settings → Devices & services → Deye Optimizers → Configure**. Choose a value between 30 and 900 seconds. Start with 60 seconds; aggressive polling can trigger Deye Cloud limits.

## Sensors

Each optimizer exposes:

- `Input Voltage` (V)
- `Input Current` (A)
- `Input Power` (W)
- `Energy Today` (kWh)

Entities also include serial number, optimizer ID, station ID, device status, and last update attributes.

## Install the dashboard card

Copy this repository file:

`custom_components/deye_optimizers/frontend/deye-optimizer-flow-card.js`

to:

`config/www/deye-optimizer-flow-card.js`

Then add a dashboard resource:

```yaml
url: /local/deye-optimizer-flow-card.js?v=2.0.0
type: module
```

After updating the file, reload Lovelace resources or restart Home Assistant and refresh the browser without cache.

## Minimal card configuration

```yaml
type: custom:deye-optimizer-flow-card
columns: 5
rows: 2
orientation: portrait
panels:
  - sensor.deye_optimizer_SERIAL1_input_power
  - sensor.deye_optimizer_SERIAL2_input_power
  - sensor.deye_optimizer_SERIAL3_input_power
  - sensor.deye_optimizer_SERIAL4_input_power
  - sensor.deye_optimizer_SERIAL5_input_power
```

Both `columns` and `rows` accept values from 1 to 6. The card never changes them based on the viewport; it scales its contents instead. Capacity is `columns × rows`; additional panel entries are not displayed.

## Card options

| Option | Default | Description |
|---|---:|---|
| `columns` | `5` | Fixed number of columns, 1–6 |
| `rows` | automatic | Fixed number of rows, 1–6 |
| `orientation` | `portrait` | `portrait` or `landscape`, applied to the entire grid |
| `rated_power` | `550` | Default nominal panel power in Wp |
| `gap` | `6` | Maximum gap in pixels |
| `show_header` | `true` | Show title and total power |
| `show_total_power` | `true` | Show total visible power |
| `show_percent` | `true` | Show production percentage |
| `show_empty_slots` | `false` | Render unused positions as muted slots |
| `color_100`, `color_60`, `color_20`, `color_0` | included | Production colors |

Each panel may be a simple entity string or an object with `entity`, `name`, and optional per-panel `rated_power`. Complete portrait and landscape files are in [`examples/`](examples/).

## Troubleshooting

- `401`/`403`: get a fresh Deye token and re-add the integration.
- No optimizers: verify the Station ID and confirm the station contains `OPTIMIZER` devices.
- Old card remains visible: increment the resource query version and clear the browser cache.
- Temporary Deye outage: 2.0 keeps the last valid values; check the integration diagnostics for the partial error.

## HACS publication readiness

The repository contains HACS and Hassfest workflows, `hacs.json`, version metadata, documentation, examples, and a changelog. After field testing, create release `v2.0.0` and submit the repository for inclusion in the HACS default list.

