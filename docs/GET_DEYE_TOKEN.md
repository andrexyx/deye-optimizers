# How to get your Deye Cloud token

This guide explains how to copy the Deye Cloud access token used by the **Deye Optimizers** Home Assistant custom integration.

> [!IMPORTANT]
> Your Deye token is a credential. **Do not post it in GitHub Issues, screenshots, forums, Discord, Reddit, or public logs.**
> Anyone with a valid token may be able to access data available to your Deye Cloud account.

## Requirements

- A working Deye Cloud account
- Google Chrome, Microsoft Edge, or another Chromium-based browser
- You must already be logged in to Deye Cloud

## 1. Open Deye Cloud and Developer Tools

1. Open Deye Cloud in your browser and sign in.
2. Open the station that contains your optimizer concentrator / power optimizers.
3. Press **F12**.
4. Select the **Console** tab.

![Open Deye Cloud Console](images/01-open-console-and-find-token.jpg)

## 2. Copy the token safely

Paste this command into the browser Console and press **Enter**:

```javascript
copy(localStorage.getItem('deyeTokenKey').split('|')[0])
```

The Console normally returns:

```text
undefined
```

That is **normal**. `copy(...)` places the token directly on your clipboard without printing the full token on screen.

You can now paste the token into the **Token** field when adding the **Deye Optimizers** integration in Home Assistant.

![Deye token key redacted](images/02-token-key-redacted.jpg)

### If `deyeTokenKey` is empty

Run:

```javascript
localStorage.getItem('deyeTokenKey')
```

If the result is `null`, make sure you are logged in to Deye Cloud and reload the page. Then repeat the copy command.

## 3. Find the Station ID

The Station ID is visible in Deye Cloud URLs and API requests. For example, a URL may contain:

```text
/station/61599740/
```

In that example, the Station ID is:

```text
61599740
```

Use **your own** Station ID in Home Assistant.

A quick Console command that can help show station-related requests is:

```javascript
performance.getEntriesByType('resource')
  .map(x => x.name)
  .filter(x => x.includes('/maintain-s/operating/station/'))
  .forEach(x => console.log(x))
```

## 4. Add the integration to Home Assistant

After installing **Deye Optimizers**:

1. Go to **Settings → Devices & services**.
2. Click **Add Integration**.
3. Search for **Deye Optimizers**.
4. Paste the token into **Token**.
5. Enter your **Station ID**.
6. Submit the form.

The integration discovers Deye devices of type `OPTIMIZER` and creates sensors for each optimizer.

Current sensor set:

- Input Voltage — V
- Input Current — A
- Input Power — W
- Energy Today — kWh

New optimizers added to the Deye station can be discovered automatically by the integration.

## 5. Optional: verify that Deye Cloud returns optimizers

This is only for troubleshooting.

In the Deye Cloud Console, you can inspect network resources used by the page:

```javascript
performance.getEntriesByType('resource')
  .map(x => x.name)
  .filter(x => /optimizer|device-s|concentrator/i.test(x))
  .forEach(x => console.log(x))
```

A successful optimizer-list request should return a structure similar to:

```text
{ total: 10, data: Array(10) }
```

The number depends on how many optimizers are registered in your Deye Cloud station.

![Deye API optimizer list](images/03-api-check-optimizers.jpg)

## Token expiration

The token is issued by Deye Cloud and can expire or become invalid after logout, account/session changes, or Deye-side authentication changes.

Typical symptoms include:

```text
HTTP 401
unauthorized
Full authentication is required to access this resource
```

If that happens:

1. Sign in to Deye Cloud again.
2. Repeat the token-copy command.
3. Update/reconfigure the Home Assistant integration with the new token.

## Security notes

- Never commit the token to GitHub.
- Never put it inside `manifest.json`, `configuration.yaml`, README examples, screenshots, or issue reports.
- If you accidentally publish a token, log out of Deye Cloud and sign in again to invalidate/replace the session where possible.
- When sharing logs, remove `Authorization: Bearer ...` values.

## Tested with

This procedure was developed while integrating a Deye optimizer concentrator with Deye Power Optimizers into Home Assistant through Deye Cloud.

The Deye Cloud device types observed during development included:

```text
OPTIMIZER
OPTIMIZER_CONCENTRATOR
```

The integration is community-developed and is not an official Deye integration.
