const DEYE_FILTER = {urls: ["https://*.deyecloud.com/*"]};

function stationFromUrl(url) {
  const match = String(url || "").match(/\/station\/([0-9]+)(?:\/|\?|$)/i);
  return match ? match[1] : "";
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  async (details) => {
    const header = (details.requestHeaders || []).find(h => h.name.toLowerCase() === "authorization");
    const token = String(header?.value || "").replace(/^Bearer\s+/i, "").trim();
    const stationId = stationFromUrl(details.url);
    if (!token && !stationId) return;
    const previous = await chrome.storage.session.get(["token", "stations"]);
    const stations = new Set(previous.stations || []);
    if (stationId) stations.add(stationId);
    await chrome.storage.session.set({
      token: token || previous.token || "",
      stations: [...stations],
      capturedAt: Date.now()
    });
  },
  DEYE_FILTER,
  ["requestHeaders", "extraHeaders"]
);

chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type === "clear") chrome.storage.session.clear().then(() => respond({ok: true}));
  if (message?.type === "openDeye") chrome.tabs.create({url: "https://www.deyecloud.com/"}).then(() => respond({ok: true}));
  return true;
});
