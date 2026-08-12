(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DeyeTokenAssistant = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const TOKEN_RE = /\b[\w-]{20,}\.[\w-]{10,}\.[\w-]{10,}\b|\b[a-fA-F0-9]{32,}\b/g;

  function clean(value) {
    return String(value || "").replace(/^['"]|['"]$/g, "").trim();
  }

  function tokenFrom(text) {
    const input = String(text || "");
    const bearer = input.match(/(?:authorization\s*:\s*|(?:-H|--header)\s+['"]?Authorization:\s*)Bearer\s+([^'"\s\\]+)/i);
    if (bearer) return clean(bearer[1]);
    const json = input.match(/["'](?:access_?token|token)["']\s*:\s*["']([^"']+)["']/i);
    if (json) return clean(json[1]);
    const candidates = input.match(TOKEN_RE) || [];
    return candidates.sort((a, b) => b.length - a.length)[0] || "";
  }

  function stationsFrom(text) {
    const input = String(text || "");
    const found = new Map();
    const add = (id, name) => {
      id = clean(id);
      if (id && /^\d+$/.test(id)) found.set(id, clean(name) || `Station ${id}`);
    };
    for (const match of input.matchAll(/\/station\/([0-9]+)(?:\/|\?|\s|$)/gi)) add(match[1]);
    for (const match of input.matchAll(/["'](?:stationId|station_id|siteId)["']\s*:\s*["']?([0-9]+)["']?/gi)) add(match[1]);
    try {
      const parsed = JSON.parse(input);
      const visit = (value) => {
        if (Array.isArray(value)) return value.forEach(visit);
        if (!value || typeof value !== "object") return;
        const id = value.stationId || value.station_id || value.siteId || (value.type === "STATION" && value.id);
        if (id) add(id, value.stationName || value.siteName || value.name);
        Object.values(value).forEach(visit);
      };
      visit(parsed);
    } catch (_) {}
    return [...found].map(([id, name]) => ({ id, name }));
  }

  function analyze(text) {
    return { token: tokenFrom(text), stations: stationsFrom(text) };
  }

  return { analyze, tokenFrom, stationsFrom };
});
