# Beginner guide: automatic token capture

The browser extension is the easiest way to configure Deye Optimizers. You do not need Developer Tools and you never enter your Deye password into the extension.

## Chrome

1. Download `deye-token-assistant-extension.zip` from the latest GitHub release and extract it.
2. Open `chrome://extensions`.
3. Enable **Developer mode** in the upper-right corner.
4. Select **Load unpacked** and choose the extracted `browser-extension` folder.
5. Pin **Deye Token Assistant** from the browser Extensions menu.
6. Open the extension and select **Open Deye Cloud**.
7. Sign in on the official Deye page and open your station.
8. Open the extension again; select **Copy token**, then **Copy station ID**.
9. Paste both values into Home Assistant's Deye Optimizers setup form.
10. Select **Clear captured data** and optionally remove the extension.

## Microsoft Edge

Use the same steps, but open `edge://extensions` in step 2.

## Privacy

The extension has access only to HTTPS pages under `*.deyecloud.com`. It observes the authorization header and numeric station ID, stores them only in browser session memory, and contains no analytics or external communication. Closing the browser clears session storage. The explicit clear button removes it immediately.

## If automatic capture does not finish

Open your Deye station and refresh the page once. If it still does not work, use the [manual Token Assistant](https://andrexyx.github.io/deye-optimizers/tools/token-assistant.html).
