# Deye Token Assistant

The Deye Token Assistant is a local browser tool that extracts the Deye bearer token and station ID from a request you copy from Deye Cloud. It does **not** log in for you and never needs your Deye username or password.

## Quick start

1. Download the repository and open `tools/token-assistant.html` in a modern browser.
2. Sign in to Deye Cloud in a separate tab.
3. Open the browser Developer Tools (`F12`) and select **Network**.
4. Reload the Deye station page.
5. Select a request whose URL contains `/station/`.
6. Right-click it and select **Copy → Copy as cURL**.
7. Paste it into Deye Token Assistant and select **Analyze**.
8. Copy the detected token and station ID into the Deye Optimizers configuration form in Home Assistant.
9. Select **Clear sensitive data** and close the assistant tab.

## If the station is not detected

Open a Deye request whose URL contains a numeric station path, such as:

```text
/maintain-s/operating/station/123456/common
```

Alternatively, copy a station-list API JSON response into the assistant. It recognizes `stationId`, `station_id`, and `siteId` fields.

## Security design

- Processing happens only in the current browser tab.
- The page has no analytics, cookies, remote scripts, forms, or network requests.
- Nothing is written to local storage or session storage.
- The token is hidden by default and can be revealed for only eight seconds.
- The clear button removes the pasted request, token, and station list from the page.

The copied cURL command can contain a live authorization token and other headers. Do not paste it into GitHub issues, chats, screenshots, or online cURL converters.

## What the tool accepts

- `Copy as cURL` output containing `Authorization: Bearer …`;
- JSON containing `access_token` or `token`;
- station URLs containing `/station/<numeric-id>/`;
- station-list JSON responses.

## Troubleshooting

- **Token not found:** verify that the selected request includes an `Authorization: Bearer` request header.
- **Station not found:** choose a request with `/station/<id>/` in its URL or paste the station-list response.
- **401/403 in Home Assistant:** the Deye token has expired; capture a fresh request.
- **Clipboard button blocked:** select the field and copy it manually; some browsers restrict clipboard access for local files.
