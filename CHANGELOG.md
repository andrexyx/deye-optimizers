# Changelog

## 2.1.2

- Open the standard Home Assistant entity history dialog by clicking or using the keyboard on a panel.
- Show the summed daily energy produced by the visible panels below the card title.
- Support an explicit `energy_entity` per panel when custom entity IDs are used.

## 2.1.1

- Added a beginner-friendly Chrome/Edge extension that captures the token and station automatically after normal Deye Cloud sign-in.
- Removed Developer Tools from the recommended setup path.
- Added Chrome and Edge installation instructions and a downloadable extension package.

## 2.1.0

- Added the privacy-first Deye Token Assistant.
- Extracts bearer tokens and station IDs locally from copied cURL or JSON.
- Added a complete token-assistant guide, security notes, and automated parser tests.
- Added direct documentation links from the installation guide.

## 2.0.0

- Configurable 30–900 second refresh interval.
- Controlled timeout, retry, and exponential backoff for Deye Cloud requests.
- Last valid telemetry is retained during partial cloud failures.
- More robust optimizer discovery and stable entity IDs.
- Diagnostics with token redaction and useful update metadata.
- Included Deye Optimizer Flow Lovelace card.
- Fixed grids with independently configurable 1–6 columns and 1–6 rows.
- Portrait and landscape layouts plus minimal and advanced YAML examples.
- Full installation and configuration tutorial.
