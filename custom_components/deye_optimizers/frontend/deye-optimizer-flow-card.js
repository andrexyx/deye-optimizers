class DeyeOptimizerFlowCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }

  setConfig(config) {
    if (!config || !Array.isArray(config.panels)) throw new Error("Define panels as a list");
    const columns = Math.max(1, Math.min(6, Number(config.columns || 5)));
    const rows = Math.max(1, Math.min(6, Number(config.rows || Math.ceil(config.panels.length / columns) || 1)));
    this.config = {
      title: "Deye Optimizer Flow", rated_power: 550, columns, rows,
      orientation: "portrait", gap: 6, show_header: true,
      show_total_power: true, show_today_energy: true, today_energy_label: "Produced today",
      show_percent: true, show_empty_slots: false,
      color_100: "#37d67a", color_60: "#f7c948", color_20: "#ff9800",
      color_0: "#ff4d4f", color_unavailable: "#687384", ...config,
      columns, rows,
    };
    if (!["portrait", "landscape"].includes(this.config.orientation)) throw new Error("orientation must be portrait or landscape");
  }

  set hass(hass) { this._hass = hass; this.render(); }
  getCardSize() { return Math.max(3, Number(this.config?.rows || 1) * 2); }
  escape(value) { const d = document.createElement("div"); d.textContent = String(value ?? ""); return d.innerHTML; }
  panelConfig(panel) { return typeof panel === "string" ? { entity: panel } : panel; }
  value(panel) { const state = this._hass?.states?.[panel.entity]; const value = Number(state?.state); return Number.isFinite(value) ? value : null; }
  energyValue(panel) {
    const entity = panel.energy_entity || String(panel.entity || "").replace(/_input_power$/, "_energy_today");
    if (!entity || entity === panel.entity) return null;
    const value = Number(this._hass?.states?.[entity]?.state);
    return Number.isFinite(value) ? value : null;
  }
  openHistory(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      bubbles: true, composed: true, detail: { entityId },
    }));
  }
  color(percent, available) {
    if (!available) return this.config.color_unavailable;
    if (percent >= 100) return this.config.color_100;
    if (percent >= 60) return this.config.color_60;
    if (percent >= 20) return this.config.color_20;
    return this.config.color_0;
  }

  render() {
    if (!this._hass || !this.config) return;
    const { columns, rows } = this.config;
    const capacity = columns * rows;
    const panels = this.config.panels.slice(0, capacity).map((p) => this.panelConfig(p));
    const total = panels.reduce((sum, p) => sum + (this.value(p) || 0), 0);
    const todayValues = panels.map((panel) => this.energyValue(panel)).filter((value) => value !== null);
    const todayTotal = todayValues.reduce((sum, value) => sum + value, 0);
    const cells = Array.from({ length: 24 }, () => '<i class="cell"></i>').join("");
    const cards = panels.map((panel, index) => {
      const power = this.value(panel); const rated = Number(panel.rated_power || this.config.rated_power || 550);
      const percent = power === null ? 0 : Math.max(0, power / rated * 100);
      const color = this.color(percent, power !== null);
      return `<div class="optimizer" style="--color:${color}" data-entity="${this.escape(panel.entity)}">
        <div class="visual"><div class="solar"><div class="fill" style="height:${Math.min(100, percent)}%"></div><div class="cells">${cells}</div><b>${this.escape(panel.name || `P${index + 1}`)}</b></div></div>
        <div class="power">${power === null ? "--" : Math.round(power)}<small> W</small></div>
        ${this.config.show_percent ? `<div class="percent">${power === null ? "--" : percent.toFixed(1) + "%"}</div>` : ""}
      </div>`;
    }).join("");
    const empties = Array.from({ length: Math.max(0, capacity - panels.length) }, () => `<div class="empty"></div>`).join("");
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;width:100%;container-type:inline-size}*{box-sizing:border-box}ha-card{padding:clamp(6px,2cqw,16px);overflow:hidden;background:linear-gradient(145deg,#0d1a2e,#091321);color:var(--primary-text-color);border-radius:18px}
      header{display:flex;justify-content:space-between;align-items:end;margin-bottom:clamp(5px,1.5cqw,12px);gap:8px}h2{margin:0;font-size:clamp(15px,4cqw,27px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.today{display:block;margin-top:2px;color:var(--secondary-text-color,#a9b7ca);font-size:clamp(9px,2.4cqw,14px);font-weight:400}.total{font-size:clamp(16px,4.5cqw,30px);font-weight:900;white-space:nowrap}
      .grid{display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));grid-template-rows:repeat(${rows},auto);gap:min(${Math.max(0, Number(this.config.gap))}px,1.1cqw);align-items:start}
      .optimizer,.empty{min-width:0;overflow:hidden;border:clamp(1px,.35cqw,2px) solid var(--color,#27364a);border-radius:clamp(4px,1cqw,8px);padding:clamp(1px,.55cqw,5px);background:#101e31}.portrait .optimizer,.portrait .empty{aspect-ratio:1/1.7}.landscape .optimizer,.landscape .empty{aspect-ratio:1.7/1}.empty{visibility:${this.config.show_empty_slots ? "visible" : "hidden"}}
      .visual{height:76%;display:flex;justify-content:center;align-items:stretch;min-height:0}.solar{position:relative;height:100%;max-width:100%;aspect-ratio:${this.config.orientation === "landscape" ? "1.7/1" : "1/1.7"};overflow:hidden;border:1px solid #b7c7e8;border-radius:3px;background:#20395f}.fill{position:absolute;inset:auto 0 0;background:var(--color);opacity:.82}.cells{position:absolute;inset:2px;display:grid;grid-template-columns:repeat(${this.config.orientation === "landscape" ? 6 : 4},1fr);grid-template-rows:repeat(${this.config.orientation === "landscape" ? 4 : 6},1fr);gap:1px}.cell{border:.5px solid rgba(220,232,255,.85)}.solar b{position:absolute;z-index:3;top:1px;left:50%;transform:translateX(-50%);max-width:90%;overflow:hidden;text-overflow:ellipsis;font-size:clamp(5px,2.3cqw,12px);background:#19304ccc;padding:0 2px;border-radius:2px;white-space:nowrap}.power{text-align:center;font-size:clamp(7px,4.2cqw,24px);font-weight:900;line-height:1.05;margin-top:2px}.power small{font-size:50%}.percent{text-align:center;font-size:clamp(6px,2.5cqw,14px);font-weight:700}
      @container(max-width:500px){ha-card{padding:5px}.grid{gap:min(${Math.max(0, Number(this.config.gap))}px,.8cqw)}header{margin-bottom:5px}}
    </style><ha-card>${this.config.show_header ? `<header><h2>${this.escape(this.config.title)}${this.config.show_today_energy && todayValues.length ? `<span class="today">${this.escape(this.config.today_energy_label)}: ${todayTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh</span>` : ""}</h2>${this.config.show_total_power ? `<div class="total">${Math.round(total)} W</div>` : ""}</header>` : ""}<div class="grid ${this.config.orientation}">${cards}${empties}</div></ha-card>`;
    this.shadowRoot.querySelectorAll(".optimizer").forEach((panel) => {
      panel.addEventListener("click", () => this.openHistory(panel.dataset.entity));
    });
  }
}

if (!customElements.get("deye-optimizer-flow-card")) customElements.define("deye-optimizer-flow-card", DeyeOptimizerFlowCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "deye-optimizer-flow-card")) window.customCards.push({type:"deye-optimizer-flow-card",name:"Deye Optimizer Flow",description:"Fixed 1–6 row and column optimizer grid",preview:false});

