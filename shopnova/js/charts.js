/**
 * ShopNova Thailand — กราฟ SVG ขนาดเล็ก (ไม่ใช้ไลบรารี)
 * ทุกกราฟ: เส้นบาง, grid จาง, tooltip ตอน hover, และมี "มุมมองตาราง" เป็นคู่แฝดเสมอ
 * สีอ่านจาก CSS custom properties (--series-1..5) จึงเปลี่ยนตามธีมสว่าง/มืดอัตโนมัติ
 */
const Charts = (() => {
  const esc = (v) => UI.escapeHtml(v);
  const NS = "http://www.w3.org/2000/svg";

  function niceMax(v) {
    if (!v || v <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / exp;
    const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return nice * exp;
  }
  const short = (v) => {
    v = Number(v) || 0;
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(v >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "k";
    return String(Math.round(v));
  };

  /** โครงสร้างการ์ดกราฟ: หัวเรื่อง + สลับกราฟ/ตาราง + พื้นที่วาด + tooltip */
  function frame(el, { title, subtitle, legend = [], table }) {
    el.classList.add("chart");
    el.innerHTML = `
      <div class="chart-head">
        <div>
          <h3>${title}</h3>
          ${subtitle ? `<p class="chart-sub">${subtitle}</p>` : ""}
        </div>
        <div class="chart-tools">
          ${legend.length ? `<div class="legend">${legend.map((s) => `<span class="legend-item"><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("")}</div>` : ""}
          <button class="btn btn-ghost btn-xs chart-toggle" type="button" aria-pressed="false">ตาราง</button>
        </div>
      </div>
      <div class="chart-plot"></div>
      <div class="chart-table" hidden></div>
      <div class="chart-tip" hidden></div>`;
    const plot = el.querySelector(".chart-plot");
    const tableWrap = el.querySelector(".chart-table");
    tableWrap.innerHTML = table;
    const btn = el.querySelector(".chart-toggle");
    btn.addEventListener("click", () => {
      const showTable = tableWrap.hidden;
      tableWrap.hidden = !showTable;
      plot.hidden = showTable;
      btn.textContent = showTable ? "กราฟ" : "ตาราง";
      btn.setAttribute("aria-pressed", String(showTable));
    });
    return { plot, tip: el.querySelector(".chart-tip") };
  }

  function bindTip(el, tip, targets, html) {
    const show = (e, t) => {
      tip.innerHTML = html(t);
      tip.hidden = false;
      const r = el.getBoundingClientRect();
      let x = e.clientX - r.left + 12;
      let y = e.clientY - r.top + 12;
      if (x + tip.offsetWidth > r.width - 8) x = e.clientX - r.left - tip.offsetWidth - 12;
      tip.style.transform = `translate(${x}px, ${y}px)`;
    };
    targets.forEach((t) => {
      t.addEventListener("mousemove", (e) => show(e, t));
      t.addEventListener("mouseleave", () => { tip.hidden = true; });
      t.addEventListener("focus", (e) => { const r = t.getBoundingClientRect(); show({ clientX: r.left + r.width / 2, clientY: r.top }, t); });
      t.addEventListener("blur", () => { tip.hidden = true; });
    });
  }

  /** ความกว้าง viewBox ตามพื้นที่จริงของการ์ด เพื่อให้ตัวอักษรไม่ถูกย่อจนอ่านไม่ออก */
  function plotWidth(plot) {
    const w = plot.clientWidth || plot.parentElement?.clientWidth || 720;
    return Math.max(320, Math.min(w, 1100));
  }

  function svgEl(tag, attrs = {}) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  }

  function dataTable(headers, rows) {
    return `<div class="table-scroll"><table class="table table-compact"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i > 0 ? "num" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  // ---------- แท่งซ้อน (Stacked bars) — หลายซีรีส์ ----------
  function stackedBars(el, { title, subtitle, data, series, formatValue = short, formatLabel = (l) => l }) {
    const table = dataTable(["", ...series.map((s) => s.name), "รวม"], data.map((d) => [
      formatLabel(d.label), ...d.values.map((v) => UI.money(v)), UI.money(d.values.reduce((a, b) => a + b, 0))
    ]));
    const { plot, tip } = frame(el, { title, subtitle, legend: series, table });
    const W = plotWidth(plot), H = 260, padL = 44, padR = 12, padT = 14, padB = 34;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const max = niceMax(Math.max(...data.map((d) => d.values.reduce((a, b) => a + b, 0)), 1));
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart-svg", role: "img", "aria-label": title });

    // grid + แกน Y
    for (let i = 0; i <= 4; i++) {
      const y = padT + innerH - (innerH * i) / 4;
      svg.appendChild(svgEl("line", { x1: padL, x2: W - padR, y1: y, y2: y, class: "grid" }));
      const t = svgEl("text", { x: padL - 6, y: y + 4, class: "axis-label", "text-anchor": "end" });
      t.textContent = short((max * i) / 4);
      svg.appendChild(t);
    }
    const slot = innerW / Math.max(data.length, 1);
    const barW = Math.min(36, slot * 0.62);
    const targets = [];
    data.forEach((d, i) => {
      const x = padL + slot * i + (slot - barW) / 2;
      let yTop = padT + innerH;
      const g = svgEl("g", { class: "bar-group", tabindex: "0" });
      d.values.forEach((v, si) => {
        const h = (v / max) * innerH;
        if (h <= 0) return;
        yTop -= h;
        const rect = svgEl("rect", { x, y: yTop, width: barW, height: Math.max(h - 2, 0), rx: si === d.values.length - 1 ? 3 : 0, style: `fill:${series[si].color}` });
        g.appendChild(rect);
      });
      // hit area ใหญ่กว่าแท่ง
      const hit = svgEl("rect", { x: padL + slot * i, y: padT, width: slot, height: innerH, class: "hit" });
      g.appendChild(hit);
      g.dataset.i = i;
      svg.appendChild(g);
      targets.push(g);
      if ((data.length - 1 - i) % Math.max(1, Math.ceil(52 / slot)) === 0) {
        const lbl = svgEl("text", { x: x + barW / 2, y: H - padB + 18, class: "axis-label", "text-anchor": "middle" });
        lbl.textContent = formatLabel(d.label);
        svg.appendChild(lbl);
      }
    });
    svg.appendChild(svgEl("line", { x1: padL, x2: W - padR, y1: padT + innerH, y2: padT + innerH, class: "axis" }));
    plot.appendChild(svg);
    bindTip(el, tip, targets, (g) => {
      const d = data[g.dataset.i];
      const total = d.values.reduce((a, b) => a + b, 0);
      return `<strong>${esc(formatLabel(d.label, true))}</strong>${series.map((s, si) => `<div class="tip-row"><i style="background:${s.color}"></i>${esc(s.name)}<span>${esc(UI.money(d.values[si]))}</span></div>`).join("")}<div class="tip-row tip-total">รวม<span>${esc(UI.money(total))}</span></div>`;
    });
  }

  // ---------- เส้น (Line) — ซีรีส์เดียว ----------
  function line(el, { title, subtitle, data, color = "var(--series-1)", formatValue = UI.money, formatLabel = (l) => l, area = true }) {
    const table = dataTable(["", title], data.map((d) => [formatLabel(d.label), formatValue(d.value)]));
    const { plot, tip } = frame(el, { title, subtitle, table });
    const W = plotWidth(plot), H = 240, padL = 48, padR = 16, padT = 16, padB = 34;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const max = niceMax(Math.max(...data.map((d) => d.value), 1));
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart-svg", role: "img", "aria-label": title });
    for (let i = 0; i <= 4; i++) {
      const y = padT + innerH - (innerH * i) / 4;
      svg.appendChild(svgEl("line", { x1: padL, x2: W - padR, y1: y, y2: y, class: "grid" }));
      const t = svgEl("text", { x: padL - 6, y: y + 4, class: "axis-label", "text-anchor": "end" });
      t.textContent = short((max * i) / 4);
      svg.appendChild(t);
    }
    const n = data.length;
    const px = (i) => padL + (n > 1 ? (innerW * i) / (n - 1) : innerW / 2);
    const py = (v) => padT + innerH - (v / max) * innerH;
    const pts = data.map((d, i) => [px(i), py(d.value)]);
    if (area) {
      const areaPath = `M${pts[0][0]},${padT + innerH} ` + pts.map((p) => `L${p[0]},${p[1]}`).join(" ") + ` L${pts[pts.length - 1][0]},${padT + innerH} Z`;
      svg.appendChild(svgEl("path", { d: areaPath, style: `fill:${color}`, class: "area" }));
    }
    svg.appendChild(svgEl("path", { d: "M" + pts.map((p) => p.join(",")).join(" L"), style: `stroke:${color}`, class: "line" }));
    const targets = [];
    // ป้ายแกน X: เว้นระยะตามความกว้างจริง (อย่างน้อย ~52px ต่อป้าย) โดยนับถอยหลังจากจุดสุดท้ายให้ป้ายท้ายอยู่เสมอ
    const labelStep = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 52))));
    pts.forEach((p, i) => {
      const g = svgEl("g", { tabindex: "0" });
      g.appendChild(svgEl("circle", { cx: p[0], cy: p[1], r: 4.5, style: `fill:${color}`, class: "dot" }));
      g.appendChild(svgEl("rect", { x: p[0] - (innerW / n) / 2, y: padT, width: innerW / n, height: innerH, class: "hit" }));
      g.dataset.i = i;
      svg.appendChild(g);
      targets.push(g);
      if ((n - 1 - i) % labelStep === 0) {
        const lbl = svgEl("text", { x: p[0], y: H - padB + 18, class: "axis-label", "text-anchor": "middle" });
        lbl.textContent = formatLabel(data[i].label);
        svg.appendChild(lbl);
      }
    });
    // ป้ายค่าปลายเส้น (direct label เฉพาะจุดสุดท้าย)
    const last = pts[pts.length - 1];
    const endLbl = svgEl("text", { x: last[0] - 6, y: last[1] - 10, class: "end-label", "text-anchor": "end" });
    endLbl.textContent = formatValue(data[data.length - 1].value);
    svg.appendChild(endLbl);
    svg.appendChild(svgEl("line", { x1: padL, x2: W - padR, y1: padT + innerH, y2: padT + innerH, class: "axis" }));
    plot.appendChild(svg);
    bindTip(el, tip, targets, (g) => {
      const d = data[g.dataset.i];
      return `<strong>${esc(formatLabel(d.label, true))}</strong><div class="tip-row"><i style="background:${color}"></i>${esc(title)}<span>${esc(formatValue(d.value))}</span></div>${d.extra ? `<div class="tip-note">${d.extra}</div>` : ""}`;
    });
  }

  // ---------- แท่งแนวนอน (Horizontal bars) ----------
  function hbars(el, { title, subtitle, data, color = "var(--series-1)", formatValue = UI.money, colorOf = null }) {
    const table = dataTable(["", title], data.map((d) => [d.label, formatValue(d.value)]));
    const { plot, tip } = frame(el, { title, subtitle, table });
    const W = plotWidth(plot), rowH = 30, labelW = Math.min(200, Math.round(W * 0.34)), padR = 80;
    const H = data.length * rowH + 8;
    const innerW = W - labelW - padR;
    const max = Math.max(...data.map((d) => d.value), 1);
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart-svg chart-svg-h", role: "img", "aria-label": title });
    const targets = [];
    data.forEach((d, i) => {
      const y = 4 + i * rowH;
      const w = Math.max((d.value / max) * innerW, 2);
      const g = svgEl("g", { tabindex: "0" });
      const lbl = svgEl("text", { x: labelW - 10, y: y + rowH / 2 + 4, class: "row-label", "text-anchor": "end" });
      const maxChars = Math.max(12, Math.floor(labelW / 7.2));
      lbl.textContent = d.label.length > maxChars ? d.label.slice(0, maxChars - 1) + "…" : d.label;
      g.appendChild(lbl);
      g.appendChild(svgEl("rect", { x: labelW, y: y + 6, width: w, height: rowH - 12, rx: 3, style: `fill:${colorOf ? colorOf(d) : color}` }));
      const val = svgEl("text", { x: labelW + w + 8, y: y + rowH / 2 + 4, class: "value-label" });
      val.textContent = formatValue(d.value);
      g.appendChild(val);
      g.appendChild(svgEl("rect", { x: 0, y, width: W, height: rowH, class: "hit" }));
      g.dataset.i = i;
      svg.appendChild(g);
      targets.push(g);
    });
    plot.appendChild(svg);
    bindTip(el, tip, targets, (g) => {
      const d = data[g.dataset.i];
      return `<strong>${esc(d.label)}</strong><div class="tip-row">${esc(title)}<span>${esc(formatValue(d.value))}</span></div>${d.extra ? `<div class="tip-note">${d.extra}</div>` : ""}`;
    });
  }

  // ---------- Heatmap (แถว × คอลัมน์, สีเดียวไล่ระดับ) ----------
  function heatmap(el, { title, subtitle, rows, cols, values, formatValue = UI.money }) {
    const table = dataTable(["", ...cols], rows.map((r, ri) => [r, ...cols.map((_, ci) => formatValue(values[ri][ci]))]));
    const { plot, tip } = frame(el, { title, subtitle, table });
    const max = Math.max(...values.flat(), 1);
    const grid = document.createElement("div");
    grid.className = "heat";
    grid.style.gridTemplateColumns = `110px repeat(${cols.length}, 1fr)`;
    grid.innerHTML = `<div></div>${cols.map((c) => `<div class="heat-col">${esc(c)}</div>`).join("")}`;
    const targets = [];
    rows.forEach((r, ri) => {
      grid.insertAdjacentHTML("beforeend", `<div class="heat-row">${esc(r)}</div>`);
      cols.forEach((c, ci) => {
        const v = values[ri][ci];
        const t = v / max;
        const cell = document.createElement("div");
        cell.className = "heat-cell";
        cell.tabIndex = 0;
        cell.style.setProperty("--t", t.toFixed(3));
        cell.innerHTML = `<span class="${t > 0.55 ? "on-dark" : ""}">${v > 0 ? short(v) : "–"}</span>`;
        cell.dataset.r = ri; cell.dataset.c = ci;
        grid.appendChild(cell);
        targets.push(cell);
      });
    });
    plot.appendChild(grid);
    bindTip(el, tip, targets, (cell) => `<strong>${esc(rows[cell.dataset.r])} × ${esc(cols[cell.dataset.c])}</strong><div class="tip-row">รายได้<span>${esc(formatValue(values[cell.dataset.r][cell.dataset.c]))}</span></div>`);
  }

  return { stackedBars, line, hbars, heatmap, short };
})();
