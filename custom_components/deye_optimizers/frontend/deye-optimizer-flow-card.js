class DeyeOptimizerFlowCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Config lipsă");
    }

    if (!Array.isArray(config.panels)) {
      throw new Error("Trebuie definită lista panels");
    }

    const defaults = {
      title: "",
      rated_power: 510,

      // GRILA PANOURILOR
      grid_columns: 5,
      grid_rows: 2,
      gap: 5,

      // ORIENTAREA GLOBALĂ
      orientation: "portrait",

      // RAPORTUL PANOURILOR
      panel_ratio: 1.7,

      // DIMENSIUNI
      panel_scale: 0.94,
      module_scale: 0.68,

      // CONTUR
      border_radius: 4,

      // CELULELE DIN PANOU
      cell_columns: 4,
      cell_rows: 6,

      show_total_power: true,
      show_percent: true,
      show_capacity: true,
      show_today_energy: true,

      // CULORI
      color_100: "#37d67a",
      color_50: "#f7c948",
      color_20: "#ff9800",
      color_0: "#ff4d4f",

      inactive_cell_color: "#294b78",

      ...config,
    };

    // Compatibilitate cu vechile denumiri
    defaults.grid_columns = Math.max(
      1,
      parseInt(
        config.grid_columns ??
        config.columns ??
        defaults.grid_columns,
        10
      )
    );

    defaults.grid_rows = Math.max(
      1,
      parseInt(
        config.grid_rows ??
        config.rows ??
        defaults.grid_rows,
        10
      )
    );

    defaults.cell_columns = Math.max(
      1,
      parseInt(
        config.cell_columns ??
        config.cell_cols ??
        defaults.cell_columns,
        10
      )
    );

    defaults.cell_rows = Math.max(
      1,
      parseInt(
        config.cell_rows ??
        defaults.cell_rows,
        10
      )
    );

    defaults.orientation =
      String(defaults.orientation).toLowerCase() === "landscape"
        ? "landscape"
        : "portrait";

    this.config = defaults;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    const rows = Number(this.config?.grid_rows || 2);
    return Math.max(3, rows * 2);
  }

  getPanelPower(panel) {
    const stateObj = this._hass?.states?.[panel.entity];

    if (!stateObj) {
      return 0;
    }

    const raw = String(stateObj.state).replace(",", ".");
    const value = parseFloat(raw);

    return Number.isFinite(value) ? value : 0;
  }

  getRatedPower(panel) {
    const value = Number(
      panel.rated_power ??
      this.config.rated_power ??
      510
    );

    return Number.isFinite(value) && value > 0
      ? value
      : 510;
  }

  getPanelPercent(panel) {
    const rated = this.getRatedPower(panel);

    if (!rated) {
      return 0;
    }

    return (
      this.getPanelPower(panel) /
      rated
    ) * 100;
  }

  getPanelColor(percent) {
    const p = Number(percent) || 0;

    if (p >= 100) {
      return this.config.color_100;
    }

    if (p >= 50) {
      return this.config.color_50;
    }

    if (p >= 20) {
      return this.config.color_20;
    }

    return this.config.color_0;
  }

  formatPanelPower(value) {
    return Math.round(Number(value) || 0);
  }

  formatTotalPower(value) {
    const power = Number(value) || 0;

    if (power >= 1000) {
      return `${(power / 1000).toFixed(2)} kW`;
    }

    return `${Math.round(power)} W`;
  }

  getPanelEnergyToday(panel) {
    const entity =
      panel.energy_entity ??
      String(panel.entity ?? "").replace(
        /_input_power$/,
        "_energy_today"
      );

    const stateObj = this._hass?.states?.[entity];
    const value = Number(
      String(stateObj?.state ?? "").replace(",", ".")
    );

    if (!Number.isFinite(value)) {
      return 0;
    }

    const unit = String(
      stateObj?.attributes?.unit_of_measurement ?? "kWh"
    ).toLowerCase();

    if (unit === "wh") {
      return value / 1000;
    }

    if (unit === "mwh") {
      return value * 1000;
    }

    return value;
  }

  formatTodayEnergy(value) {
    const energy = Number(value) || 0;
    return `${energy.toFixed(2)} kWh`;
  }

  truncateText(text, max = 14) {
    const value = String(text ?? "");

    return value.length > max
      ? `${value.slice(0, max)}…`
      : value;
  }

  escapeHtml(text) {
    return String(text ?? "").replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]
    );
  }

  /*
   * ====================================================
   * CELULE
   * ====================================================
   *
   * cell_columns și cell_rows NU se inversează.
   *
   * cell_columns: 1
   * cell_rows: 5
   *
   * rămâne 1 coloană x 5 rânduri
   * atât portrait cât și landscape.
   */

  buildCells({
    x,
    y,
    width,
    height,
    columns,
    rows,
    percent,
    activeColor
  }) {
    const totalCells = columns * rows;

    const normalized = Math.min(
      Math.max(percent / 100, 0),
      1
    );

    const activeCells = Math.round(
      totalCells * normalized
    );

    const gapX = Math.min(
      3.2,
      width / Math.max(columns * 7, 1)
    );

    const gapY = Math.min(
      3.2,
      height / Math.max(rows * 7, 1)
    );

    const cellWidth =
      (
        width -
        gapX * (columns - 1)
      ) / columns;

    const cellHeight =
      (
        height -
        gapY * (rows - 1)
      ) / rows;

    let html = "";
    let activeIndex = 0;

    /*
     * Colorare de jos în sus.
     */
    for (
      let row = rows - 1;
      row >= 0;
      row--
    ) {
      for (
        let col = 0;
        col < columns;
        col++
      ) {
        const cellX =
          x +
          col * (
            cellWidth +
            gapX
          );

        const cellY =
          y +
          row * (
            cellHeight +
            gapY
          );

        const isActive =
          activeIndex < activeCells;

        html += `
          <rect
            x="${cellX.toFixed(2)}"
            y="${cellY.toFixed(2)}"
            width="${cellWidth.toFixed(2)}"
            height="${cellHeight.toFixed(2)}"
            rx="1"
            fill="${
              isActive
                ? activeColor
                : this.config.inactive_cell_color
            }"
            stroke="#bdd0ff"
            stroke-width="1.1"
          />
        `;

        activeIndex++;
      }
    }

    return html;
  }

  /*
   * ====================================================
   * DESEN PANOU
   * ====================================================
   */

  getPanelSvg(panel, percent, color, index) {
    const orientation = this.config.orientation;

    const ratio = Math.max(
      1,
      Number(this.config.panel_ratio || 1.7)
    );

    const cellColumns = Math.max(
      1,
      Number(this.config.cell_columns || 4)
    );

    const cellRows = Math.max(
      1,
      Number(this.config.cell_rows || 6)
    );

    const name =
      String(panel.name ?? "").trim();

    const safeName =
      this.escapeHtml(
        this.truncateText(name, 14)
      );

    let viewWidth;
    let viewHeight;

    if (orientation === "landscape") {
      viewWidth = 100 * ratio;
      viewHeight = 100;
    } else {
      viewWidth = 100;
      viewHeight = 100 * ratio;
    }

    const outerMargin = 5;
    const innerMargin = 11;

    /*
     * Dacă nu există nume,
     * nu se rezervă spațiu pentru el.
     */
    const nameHeight =
      name ? 17 : 0;

    const cellsX = innerMargin;

    const cellsY =
      innerMargin +
      nameHeight;

    const cellsWidth =
      viewWidth -
      innerMargin * 2;

    const cellsHeight =
      viewHeight -
      cellsY -
      innerMargin;

    const cells = this.buildCells({
      x: cellsX,
      y: cellsY,

      width: cellsWidth,
      height: cellsHeight,

      columns: cellColumns,
      rows: cellRows,

      percent,
      activeColor: color
    });

    const gradientId =
      `deye-panel-bg-${index}`;

    return `
      <svg
        viewBox="0 0 ${viewWidth} ${viewHeight}"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >

        <defs>

          <linearGradient
            id="${gradientId}"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >

            <stop
              offset="0%"
              stop-color="#355b96"
            />

            <stop
              offset="100%"
              stop-color="#19345d"
            />

          </linearGradient>

        </defs>

        <!-- PANOU -->

        <rect
          x="${outerMargin}"
          y="${outerMargin}"
          width="${viewWidth - outerMargin * 2}"
          height="${viewHeight - outerMargin * 2}"
          rx="3"
          fill="url(#${gradientId})"
          stroke="#c9d8ff"
          stroke-width="2.2"
        />

        <!-- RAMĂ INTERIOARĂ -->

        <rect
          x="8"
          y="8"
          width="${viewWidth - 16}"
          height="${viewHeight - 16}"
          rx="2"
          fill="none"
          stroke="rgba(255,255,255,0.20)"
          stroke-width="0.9"
        />

        ${
          name
            ? `
              <rect
                x="${innerMargin}"
                y="${innerMargin - 2}"
                width="${viewWidth - innerMargin * 2}"
                height="15"
                rx="1.5"
                fill="rgba(5,15,35,0.58)"
              />

              <text
                x="${viewWidth / 2}"
                y="${innerMargin + 5.5}"
                text-anchor="middle"
                dominant-baseline="middle"
                fill="#ffffff"
                font-size="7.5"
                font-weight="600"
                font-family="Arial, sans-serif"
              >
                ${safeName}
              </text>
            `
            : ""
        }

        ${cells}

      </svg>
    `;
  }

  render() {
    if (!this.config || !this._hass) {
      return;
    }

    const allPanels =
      this.config.panels || [];

    const gridColumns = Math.max(
      1,
      Number(this.config.grid_columns || 5)
    );

    const gridRows = Math.max(
      1,
      Number(this.config.grid_rows || 2)
    );

    const capacity =
      gridColumns *
      gridRows;

    const panels =
      allPanels.slice(
        0,
        capacity
      );

    const gap = Math.max(
      0,
      Number(this.config.gap || 0)
    );

    const panelScale = Math.min(
      1,
      Math.max(
        0.30,
        Number(
          this.config.panel_scale ??
          0.94
        )
      )
    );

    const moduleScale = Math.min(
      0.95,
      Math.max(
        0.25,
        Number(
          this.config.module_scale ??
          0.68
        )
      )
    );

    const borderRadius = Math.max(
      0,
      Number(
        this.config.border_radius ??
        4
      )
    );

    const totalPower =
      panels.reduce(
        (sum, panel) =>
          sum +
          this.getPanelPower(panel),
        0
      );

    const totalRated =
      panels.reduce(
        (sum, panel) =>
          sum +
          this.getRatedPower(panel),
        0
      );

    const totalPercent =
      totalRated > 0
        ? (
            totalPower /
            totalRated
          ) * 100
        : 0;

    const todayEnergy =
      panels.reduce(
        (sum, panel) =>
          sum +
          this.getPanelEnergyToday(panel),
        0
      );

    const panelItems =
      panels.map(
        (panel, index) => {

          const power =
            this.getPanelPower(panel);

          const percent =
            this.getPanelPercent(panel);

          const color =
            this.getPanelColor(percent);

          const svg =
            this.getPanelSvg(
              panel,
              percent,
              color,
              index
            );

          return `
            <div
              class="
                grid-cell
                ${this.config.orientation}
              "
            >

              <div
                class="panel-tile"
                data-entity="${this.escapeHtml(panel.entity)}"
                style="
                  --status-color:${color};
                  --panel-scale:${panelScale};
                  --module-scale:${moduleScale};
                  --tile-radius:${borderRadius}px;
                "
              >

                <div class="panel-inner">

                  <div class="module">
                    ${svg}
                  </div>

                  <div class="panel-data">

                    <div class="panel-power">

                      ${this.formatPanelPower(
                        power
                      )}

                      <span>W</span>

                    </div>

                    ${
                      this.config.show_percent
                        ? `
                          <div class="panel-percent">
                            ${percent.toFixed(1)}%
                          </div>
                        `
                        : ""
                    }

                  </div>

                </div>

              </div>

            </div>
          `;
        }
      );

    /*
     * Păstrează forma exactă a grilei
     * dacă sunt mai puține panouri.
     */
    while (
      panelItems.length <
      capacity
    ) {
      panelItems.push(`
        <div class="grid-cell empty"></div>
      `);
    }

    const title =
      String(
        this.config.title ?? ""
      ).trim();

    this.shadowRoot.innerHTML = `
      <style>

        :host {
          display: block;
        }

        ha-card {

          background:
            radial-gradient(
              circle at top left,
              rgba(33,59,110,0.20),
              transparent 35%
            ),

            linear-gradient(
              180deg,
              #101826 0%,
              #0f1723 100%
            );

          border-radius: 18px;

          padding: 12px;

          overflow: hidden;

          box-shadow:
            0 0 18px
              rgba(50,90,160,0.18),

            inset
              0 0 18px
              rgba(80,130,220,0.08);
        }

        .wrap {

          display: flex;

          flex-direction: column;

          gap: 10px;
        }

        /* =================================
           HEADER
           ================================= */

        .header {

          display: flex;

          justify-content:
            space-between;

          align-items:
            flex-start;

          gap: 10px;

          min-height: 0;
        }

        .title {

          color: #eef3fb;

          font-size:
            clamp(
              13px,
              1.45vw,
              19px
            );

          font-weight: 550;

          line-height: 1.1;

          letter-spacing: 0.1px;
        }

        .today {
          margin-top: 3px;
          color: #c8d2e3;
          font-size: clamp(8px, 0.78vw, 11px);
          font-weight: 500;
          line-height: 1.1;
        }

        /*
         * DREAPTA:
         *
         * producție
         * procent
         * capacitate
         */

        .summary {

          margin-left: auto;

          flex-shrink: 0;

          text-align: right;
        }

        .summary-power {

          color: #eef3fb;

          font-size:
            clamp(
              14px,
              1.65vw,
              22px
            );

          font-weight: 600;

          line-height: 1;
        }

        .summary-meta {

          margin-top: 3px;

          display: flex;

          flex-direction: column;

          align-items:
            flex-end;

          gap: 2px;

          color: #c8d2e3;

          font-size:
            clamp(
              8px,
              0.78vw,
              11px
            );

          font-weight: 500;

          line-height: 1.1;
        }

        /* =================================
           GRID FIX
           ================================= */

        .grid {

          display: grid;

          grid-template-columns:
            repeat(
              ${gridColumns},
              minmax(0, 1fr)
            );

          grid-template-rows:
            repeat(
              ${gridRows},
              auto
            );

          gap: ${gap}px;

          width: 100%;

          align-items: start;
        }

        .grid-cell {

          min-width: 0;

          width: 100%;

          display: flex;

          justify-content: center;

          align-items: flex-start;
        }

        .grid-cell.empty {

          visibility: hidden;

          pointer-events: none;
        }

        /* =================================
           CASETA EXTERIOARĂ
           ================================= */

        .panel-tile {

          width:
            calc(
              100% *
              var(--panel-scale)
            );

          box-sizing: border-box;

          border:
            2px solid
            var(--status-color);

          border-radius:
            var(--tile-radius);

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.032),
              rgba(255,255,255,0.012)
            );

          overflow: hidden;

          cursor: pointer;
        }

        /* =================================
           PORTRAIT
           ================================= */

        .portrait
        .panel-inner {

          box-sizing: border-box;

          width: 100%;

          padding:
            clamp(
              4px,
              0.55vw,
              8px
            );

          display: flex;

          flex-direction: column;

          align-items: center;
        }

        .portrait
        .module {

          width:
            calc(
              100% *
              var(--module-scale)
            );

          aspect-ratio:
            1 / ${this.config.panel_ratio};

          flex: none;
        }

        .portrait
        .module svg {

          display: block;

          width: 100%;

          height: 100%;
        }

        .portrait
        .panel-data {

          width: 100%;

          margin-top:
            clamp(
              2px,
              0.3vw,
              5px
            );

          text-align: center;
        }

        /* =================================
           LANDSCAPE
           ================================= */

        .landscape
        .panel-inner {

          box-sizing: border-box;

          width: 100%;

          padding:
            clamp(
              3px,
              0.45vw,
              7px
            );

          display: grid;

          grid-template-columns:
            minmax(0, 70fr)
            minmax(0, 30fr);

          align-items: center;

          gap:
            clamp(
              2px,
              0.35vw,
              6px
            );
        }

        .landscape
        .module {

          width: 100%;

          aspect-ratio:
            ${this.config.panel_ratio} / 1;
        }

        .landscape
        .module svg {

          display: block;

          width: 100%;

          height: 100%;
        }

        .landscape
        .panel-data {

          min-width: 0;

          display: flex;

          flex-direction: column;

          justify-content: center;

          align-items: center;

          text-align: center;
        }

        /* =================================
           TEXTE PANOURI - MAI FINE
           ================================= */

        .panel-power {

          color: #eef3fb;

          font-size:
            clamp(
              9px,
              1.35vw,
              20px
            );

          font-weight: 600;

          line-height: 1;

          white-space: nowrap;
        }

        .panel-power span {

          font-size: 0.58em;

          font-weight: 500;
        }

        .panel-percent {

          margin-top:
            clamp(
              2px,
              0.22vw,
              4px
            );

          color: #dfe6f1;

          font-size:
            clamp(
              7px,
              0.82vw,
              11px
            );

          font-weight: 500;

          line-height: 1;
        }

        /* =================================
           TELEFON
           
           GRIDUL NU SE SCHIMBĂ
           ================================= */

        @media (max-width: 700px) {

          ha-card {

            padding: 7px;

            border-radius: 13px;
          }

          .wrap {

            gap: 7px;
          }

          .title {

            font-size:
              clamp(
                11px,
                3vw,
                15px
              );

            font-weight: 550;
          }

          .summary-power {

            font-size:
              clamp(
                12px,
                3.4vw,
                17px
              );

            font-weight: 600;
          }

          .summary-meta {

            font-size:
              clamp(
                7px,
                2vw,
                10px
              );

            font-weight: 500;
          }

          .panel-tile {

            border-width: 1px;
          }

          .portrait
          .panel-inner,

          .landscape
          .panel-inner {

            padding: 2px;
          }

          .landscape
          .panel-inner {

            grid-template-columns:
              minmax(0, 68fr)
              minmax(0, 32fr);

            gap: 1px;
          }

          .panel-power {

            font-size:
              clamp(
                7px,
                2.25vw,
                12px
              );

            font-weight: 600;
          }

          .panel-percent {

            font-size:
              clamp(
                6px,
                1.55vw,
                9px
              );

            font-weight: 500;
          }
        }

      </style>

      <ha-card>

        <div class="wrap">

          <div class="header">

            ${
              title
                ? `
                  <div>
                    <div class="title">
                      ${this.escapeHtml(title)}
                    </div>
                    ${
                      this.config.show_today_energy
                        ? `
                          <div class="today">
                            Today: ${this.formatTodayEnergy(todayEnergy)}
                          </div>
                        `
                        : ""
                    }
                  </div>
                `
                : `
                  <div></div>
                `
            }

            ${
              this.config.show_total_power
                ? `
                  <div class="summary">

                    <div class="summary-power">
                      ${this.formatTotalPower(
                        totalPower
                      )}
                    </div>

                    <div class="summary-meta">

                      ${
                        this.config.show_percent
                          ? `
                            <div>
                              ${totalPercent.toFixed(1)}%
                            </div>
                          `
                          : ""
                      }

                      ${
                        this.config.show_capacity
                          ? `
                            <div>
                              ${(
                                totalRated /
                                1000
                              ).toFixed(2)} kWp
                            </div>
                          `
                          : ""
                      }

                    </div>

                  </div>
                `
                : ""
            }

          </div>

          <div class="grid">
            ${panelItems.join("")}
          </div>

        </div>

      </ha-card>
    `;

    this.shadowRoot
      .querySelectorAll(".panel-tile[data-entity]")
      .forEach(tile => {
        tile.addEventListener("click", () => {
          this.dispatchEvent(
            new CustomEvent("hass-more-info", {
              detail: {
                entityId: tile.dataset.entity,
              },
              bubbles: true,
              composed: true,
            })
          );
        });
      });
  }
}

if (!customElements.get("deye-optimizer-flow-card")) {
  customElements.define(
    "deye-optimizer-flow-card",
    DeyeOptimizerFlowCard
  );
}
