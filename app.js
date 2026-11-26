/* ABD Enterprise Platform - demo SPA. Pure static: no build, no backend. Data from data.js (mock). */
(function () {
  const D = window.D, CATS = D.CATS, CC = D.CCOL;
  const st = { mi: D.cur, cat: 'All', tab: {}, sort: {} };
  const $ = s => document.querySelector(s);
  const fmt = (n, d = 0) => (n == null || isNaN(n)) ? '–' : n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  const sum = (a, f, t) => { let s = 0; for (let i = f; i <= t; i++) s += a[i]; return s; };
  const avg = (a, f, t) => sum(a, f, t) / (t - f + 1);
  const pc = (a, b) => (a / b - 1) * 100;
  const ytd = i => i >= 12 ? [12, i] : [0, i];
  const py = i => i >= 12 ? [0, i - 12] : null;
  const catSeries = k => st.cat === 'All' ? D.total[k] : D.cats[st.cat][k];
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const lastN = (a, i, n = 12) => a.slice(Math.max(0, i - n + 1), i + 1);

  /* ---------- small UI parts ---------- */
  function dl(p, goodUp = true, suf = 'vs PY', unit = '%') {
    if (p == null || isNaN(p)) return '<div class="d nu">–</div>';
    const up = p >= 0, good = (up === goodUp);
    return `<div class="d ${Math.abs(p) < .05 ? 'nu' : good ? 'up' : 'dn'}">${up ? '▲' : '▼'} ${fmt(Math.abs(p), unit === '%' ? 1 : 2)}${unit === '%' ? '%' : ' ' + unit} ${suf}</div>`;
  }
  function spark(a, c = '#1d5fb4') {
    const w = 200, h = 46, mn = Math.min(...a), mx = Math.max(...a), r = mx - mn || 1;
    const pts = a.map((v, i) => [i * (w - 8) / Math.max(1, a.length - 1) + 4, h - 6 - (v - mn) / r * (h - 14)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    const l = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d}L${l[0]} ${h}L4 ${h}Z" fill="${c}" opacity=".09"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="${l[0]}" cy="${l[1]}" r="3" fill="${c}"/></svg>`;
  }
  function kpi(o) {
    return `<div class="card kpi"><div class="l">${o.l}${o.tag ? `<span class="tag lake" title="${esc(o.tag)}">Lake</span>` : ''}</div><div class="v">${o.v}<small>${o.u || ''}</small></div>${o.d || ''}${o.s ? spark(o.s, o.c) : ''}</div>`;
  }
  const pill = (t, k) => `<span class="pill ${k}">${t}</span>`;
  const card = (title, body, o = {}) => `<div class="card ${o.cls || ''}"><div class="ch"><h2>${title}</h2><span class="sp"></span>${o.tag ? `<span class="tag lake" title="${esc(o.tag)}">Lake</span>` : ''}${o.right || ''}</div>${body}${o.note ? `<div class="note">${o.note}</div>` : ''}</div>`;
  const niceMax = m => { if (m <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(m))), f = m / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; };
  const legend = s => `<div class="leg">${s.map(x => `<span><i style="background:${x.c}"></i>${x.n}</span>`).join('')}</div>`;

  function lineChart(o) {
    const W = 640, H = o.h || 230, pl = 46, pr = 12, pt = 10, pb = 26, n = o.labels.length;
    const all = o.series.flatMap(s => s.d.filter(v => v != null));
    let mn = o.zero === false ? Math.min(...all) : 0, mx = Math.max(...all);
    if (o.zero === false) { const pad = (mx - mn) * .15 || 1; mn -= pad; mx += pad; } else mx = niceMax(mx * 1.05);
    const X = i => pl + i * (W - pl - pr) / Math.max(1, n - 1), Y = v => pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb);
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = mn + (mx - mn) * k / 4, y = Y(v); g += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="#e8edf4"/><text x="${pl - 6}" y="${y + 4}" text-anchor="end">${(o.fy || fmt)(v)}</text>`; }
    const step = Math.ceil(n / 12);
    o.labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) g += `<text x="${X(i)}" y="${H - 6}" text-anchor="middle">${l}</text>`; });
    o.series.forEach(s => {
      let d = ''; s.d.forEach((v, i) => { if (v != null) d += (d && s.d[i - 1] != null ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); });
      g += `<path d="${d}" fill="none" stroke="${s.c}" stroke-width="2.4" ${s.dash ? 'stroke-dasharray="5 4"' : ''} stroke-linejoin="round"/>`;
    });
    if (o.mark != null) g += `<line x1="${X(o.mark)}" x2="${X(o.mark)}" y1="${pt}" y2="${H - pb}" stroke="#94a3b8" stroke-dasharray="3 3"/>`;
    const bw = (W - pl - pr) / Math.max(1, n - 1);
    o.labels.forEach((l, i) => { const t = l + '\n' + o.series.filter(s => s.d[i] != null).map(s => s.n + ': ' + (o.ft || o.fy || fmt)(s.d[i])).join('\n'); g += `<rect x="${X(i) - bw / 2}" y="0" width="${bw}" height="${H}" fill="transparent" data-tip="${esc(t)}"/>`; });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>${o.noleg ? '' : legend(o.series)}`;
  }
  function colChart(o) {
    const W = 640, H = o.h || 230, pl = 46, pr = 8, pt = 10, pb = 26, n = o.labels.length;
    const tot = o.labels.map((_, i) => o.stack ? o.series.reduce((a, s) => a + s.d[i], 0) : Math.max(...o.series.map(s => s.d[i])));
    const mx = niceMax(Math.max(...tot) * 1.05), Y = v => pt + (1 - v / mx) * (H - pt - pb), cw = (W - pl - pr) / n;
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = mx * k / 4, y = Y(v); g += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="#e8edf4"/><text x="${pl - 6}" y="${y + 4}" text-anchor="end">${(o.fy || fmt)(v)}</text>`; }
    const step = Math.ceil(n / 12);
    o.labels.forEach((l, i) => {
      const x0 = pl + i * cw + cw * .14, bw = cw * .72; let acc = 0;
      const tip = l + '\n' + o.series.map(s => s.n + ': ' + (o.ft || o.fy || fmt)(s.d[i])).join('\n') + (o.stack ? '\nTotal: ' + (o.ft || o.fy || fmt)(tot[i]) : '');
      if (o.stack) o.series.forEach(s => { const h = s.d[i] / mx * (H - pt - pb); acc += h; g += `<rect x="${x0}" y="${H - pb - acc}" width="${bw}" height="${h}" fill="${s.c}"/>`; });
      else { const k = o.series.length, w = bw / k; o.series.forEach((s, j) => { const h = s.d[i] / mx * (H - pt - pb); g += `<rect x="${x0 + j * w}" y="${H - pb - h}" width="${w - 1}" height="${h}" fill="${s.c}" rx="2"/>`; }); }
      if (i % step === 0 || i === n - 1) g += `<text x="${x0 + bw / 2}" y="${H - 6}" text-anchor="middle">${l}</text>`;
      if (o.mark === i) g += `<rect x="${pl + i * cw}" y="${pt}" width="${cw}" height="${H - pt - pb}" fill="#1d5fb4" opacity=".07"/>`;
      g += `<rect x="${pl + i * cw}" y="0" width="${cw}" height="${H}" fill="transparent" data-tip="${esc(tip)}"/>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>${o.noleg ? '' : legend(o.series)}`;
  }
  function donut(items, centre, sub) {
    const tot = items.reduce((a, x) => a + x.v, 0), r = 52, C = 2 * Math.PI * r; let off = 0, s = '';
    items.forEach(x => { const l = x.v / tot * C; s += `<circle r="${r}" cx="70" cy="70" fill="none" stroke="${x.c}" stroke-width="20" stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)" data-tip="${esc(x.n + ': ' + (x.t || fmt(x.v)) + ' (' + fmt(x.v / tot * 100, 1) + '%)')}"/>`; off += l; });
    return `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 140 140" width="150" height="150">${s}<text x="70" y="68" text-anchor="middle" style="font-size:20px;font-weight:700;fill:#0f1b2d">${centre}</text><text x="70" y="85" text-anchor="middle" style="font-size:10px;fill:#5d6b82">${sub || ''}</text></svg><div class="leg" style="flex-direction:column;gap:6px;margin:0">${items.map(x => `<span><i style="background:${x.c}"></i>${x.n} · <b style="color:#0f1b2d">${x.t || fmt(x.v / tot * 100, 1) + '%'}</b></span>`).join('')}</div></div>`;
  }
  function hbars(items, f = fmt, max) {
    const m = max || Math.max(...items.map(x => x.v));
    return items.map(x => `<div class="hb"><span>${x.n}</span><span class="t"><i style="width:${x.v / m * 100}%;background:${x.c || '#1d5fb4'}"></i></span><span>${x.t || f(x.v)}</span></div>`).join('');
  }
  function table(id, cols, rows, o = {}) {
    let s = st.sort[id] || (o.def ? { k: o.def, d: -1 } : null), r = rows.slice();
    if (s) { const c = cols.find(c => c.k === s.k); const g = c.sv || (x => x[c.k]); r.sort((a, b) => { const A = g(a), B = g(b); return (A > B ? 1 : A < B ? -1 : 0) * s.d; }); }
    if (o.limit) r = r.slice(0, o.limit);
    return `<div class="scroll"><table><thead><tr>${cols.map(c => `<th class="${c.n ? 'n' : ''}" data-sort="${id}|${c.k}">${c.l}${s && s.k === c.k ? (s.d > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody>${r.map(x => `<tr>${cols.map(c => `<td class="${c.n ? 'n' : ''}">${c.f ? c.f(x) : x[c.k]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  const tabs = (route, list) => { const cur = st.tab[route] || list[0]; return `<div class="tabs">${list.map(t => `<button class="${t === cur ? 'on' : ''}" data-tab="${route}|${t}">${t}</button>`).join('')}</div>`; };
  const curTab = (route, list) => st.tab[route] || list[0];
  const V = {};
  function head(title, sapApp, o = {}) {
    return `<div class="head"><h1>${title}</h1>
      <select data-set="mi" aria-label="Month">${D.months.map(m => `<option value="${m.i}" ${m.i === st.mi ? 'selected' : ''}>${m.long}${m.i === D.cur ? ' (latest)' : ''}</option>`).join('')}</select>
      ${o.cat ? `<select data-set="cat" aria-label="Category"><option>All</option>${CATS.map(c => `<option ${c === st.cat ? 'selected' : ''}>${c}</option>`).join('')}</select>` : ''}
      <span class="chip">● Data as of ${D.asOf}</span>
      <button class="btn" data-export="1">⤓ Export CSV</button>
      ${sapApp ? `<button class="btn pri" data-go="${sapApp}">↗ Go to app · ${sapApp}</button>` : ''}</div>${o.ins ? insights(o.ins) : ''}`;
  }
  const INS = {
    exec: ['ICONiQ White volume is up 31% on last year, led by Telangana and Andhra Pradesh.', 'Premium and above is now the largest source of revenue growth; mass whisky is flat.', 'Rangeela vodka crossed 0.35 lakh cases in its first full year: Karnataka and Delhi lead.', 'Export orders to the Gulf are 14% ahead of plan.'],
    finance: ['Glass and grain inflation cut gross margin by about 1.1 pts over 12 months.', 'DSO rose 3 days this month: 2 customers in Uttar Pradesh account for most of it.', 'Excise ledger and e-challan differ by ₹6.2 Cr in Maharashtra: review before close.', 'Interest cover is healthy; net debt is falling about ₹4 Cr a month.'],
    projects: ['Zero-liquid-discharge retrofit at Rangapur is 54 days late and is the one red project.', 'Malaysia unit is technically complete: awaiting final licences before release.', 'Both new distilleries are on budget, but permits for Moradabad are the main schedule risk.'],
    supply: ['Glass 750 ml cover is 9 days against a minimum of 14: festive peak is 3 weeks away.', 'Molasses is below minimum, typical before the crushing season; 5 POs are open.', 'Grain price index is up 4 pts in 2 months: consider forward cover.'],
    production: ['Dhanbad OEE fell 9 pts since July: filler jams are the top cause.', 'Aurangabad alcohol yield has been under target for 4 months.', 'Kochi lost 18 line-hours this month to glass defects.'],
    distribution: ['Uttar Pradesh has 7 depots out of stock on Officer’s Choice Blue 180 ml.', 'Maharashtra has 12 transport permits pending: oldest is 5 days.', 'Distributors in Telangana are selling faster than they buy: expect higher orders.'],
    quality: ['Rangapur spent-wash COD is trending towards the consent limit.', 'Batches held for ABV deviation are concentrated in 3 plants.', 'Complaints per million bottles are at a 12-month low.'],
    hr: ['Attrition is highest among bottling-line operators in the east: 3 plants above 14%.', 'Overtime cost is 18% above plan at Hapur and Jodhpur during festive build-up.', 'Safety training is below 85% at 4 plants.']
  };
  function insights(k) { const a = INS[k] || []; return `<details class="card" style="border-top:3px solid #d9892b;margin-bottom:14px;padding:12px 16px"><summary style="cursor:pointer;font-weight:600">✨ AI insights <span class="sub" style="font-weight:400">· ${a.length} signals detected</span></summary><div class="list" style="margin-top:8px">${a.map(x => `<div class="it"><span class="dot warn"></span><div>${x}</div></div>`).join('')}</div><div class="note">Generated from the lake by rules and models; a person confirms before anything is acted on in SAP.</div></details>`; }
  function exportCSV() {
    const tb = document.querySelector('#view table'); if (!tb) { toast('No table on this page to export.'); return; }
    const csv = [...tb.rows].map(r => [...r.cells].map(c => '"' + c.innerText.replace(/\s+/g, ' ').replace(/"/g, '""').trim() + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = (location.hash.slice(2) || 'home') + '.csv'; a.click();
  }
  function tileMap(i) {
    const sc = stateCases(i), mx = Math.max(...sc.map(x => x.v)), T = 74;
    return `<svg class="chart" viewBox="0 0 ${7 * T + 10} ${6 * T + 10}">${D.states.map(s => { const [c, r] = TILES[s.code], v = sc.find(x => x.s.code === s.code).v, x = D.stat.find(y => y.code === s.code), a = .15 + .75 * v / mx, pl = D.plants.filter(p => p.st === s.code).length;
      return `<g data-tip="${esc(s.name + '\n' + fmt(v, 2) + ' lakh cases\n' + pl + ' plant(s) · ' + x.stockouts + ' stock-outs · ' + x.permits + ' permits open')}"><rect x="${c * T + 4}" y="${r * T + 4}" width="${T - 6}" height="${T - 6}" rx="10" fill="#1d5fb4" fill-opacity="${a}"/><text x="${c * T + T / 2 + 1}" y="${r * T + T / 2 + 2}" text-anchor="middle" style="font-size:14px;font-weight:700;fill:${a > .5 ? '#fff' : '#0f1b2d'}">${s.code}</text>${pl ? `<text x="${c * T + T / 2 + 1}" y="${r * T + T / 2 + 17}" text-anchor="middle" style="font-size:10px;fill:${a > .5 ? '#fff' : '#5d6b82'}">⚙ ${pl}</text>` : ''}${x.stockouts >= 4 ? `<circle cx="${c * T + T - 12}" cy="${r * T + 14}" r="6" fill="#d6453d"/>` : ''}${x.permits >= 8 ? `<circle cx="${c * T + 14}" cy="${r * T + 14}" r="6" fill="#d9892b"/>` : ''}</g>`; }).join('')}</svg><div class="leg"><span><i style="background:#1d5fb4"></i>Darker = more cases</span><span><i style="background:#d6453d;border-radius:50%"></i>Stock-out alert</span><span><i style="background:#d9892b;border-radius:50%"></i>Permits pending</span><span>⚙ = plants</span></div>`;
  }

  V.projects = () => {
    const rows = PROJ, tb = rows.reduce((a, p) => a + p.bud, 0), ts = rows.reduce((a, p) => a + p.bud * p.spent / 100, 0), avgH = rows.reduce((a, p) => a + p.health, 0) / rows.length;
    return head('Capex & Projects Dashboard', 'SAP S/4HANA PS', { ins: 'projects' }) + `<div class="grid g4" style="margin-bottom:14px">
      ${kpi({ l: 'Projects in view', v: rows.length, u: '', d: `<div class="d nu">${rows.filter(p => p.st !== 'CLSD').length} live</div>`, tag: 'PROJ, PRPS' })}
      ${kpi({ l: 'Budget', v: fmt(tb, 0), u: '₹ Cr', d: `<div class="d nu">Booked ₹${fmt(ts, 0)} Cr · ${fmt(ts / tb * 100, 0)}%</div>`, s: [2, 3, 3.5, 4, 4.4, 4.9, ts / 100], c: '#b45309', tag: 'COSP, COEP' })}
      ${kpi({ l: 'Past planned finish', v: rows.filter(p => p.late > 0).length, u: 'projects', d: '<div class="d dn">avg 33 days late</div>', s: [3, 3, 4, 5, 5, 6, rows.filter(p => p.late > 0).length], c: '#c0262d', tag: 'Milestones' })}
      ${kpi({ l: 'Average health score', v: fmt(avgH, 1), u: '/ 100', d: `<div class="d nu">${rows.filter(p => p.rag === 'bad').length} red · ${rows.filter(p => p.rag === 'warn').length} amber · ${rows.filter(p => p.rag === 'good').length} green</div>`, s: [74, 72, 73, 70, 71, 69, avgH], c: '#0f766e' })}</div>
      <div class="grid g32" style="margin-bottom:14px">${card('Budget vs cost booked (₹ Cr)', colChart({ labels: rows.map(p => p.n.split(',')[0].split(' ').slice(0, 2).join(' ')), series: [{ n: 'Budget', c: '#cbd5e1', d: rows.map(p => p.bud) }, { n: 'Cost booked', c: '#1d5fb4', d: rows.map(p => p.bud * p.spent / 100) }], ft: v => '₹' + fmt(v, 0) + ' Cr', h: 240 }), { tag: 'COSP, COEP' })}
      ${card('Health index', donut([{ n: 'Green', v: rows.filter(p => p.rag === 'good').length, c: '#2e9d57', t: rows.filter(p => p.rag === 'good').length }, { n: 'Amber', v: rows.filter(p => p.rag === 'warn').length, c: '#d9892b', t: rows.filter(p => p.rag === 'warn').length }, { n: 'Red', v: rows.filter(p => p.rag === 'bad').length, c: '#d6453d', t: rows.filter(p => p.rag === 'bad').length }], fmt(avgH, 0), 'avg score'), { note: 'Score blends schedule slip, spend ahead of progress and overdue milestones.' })}</div>
      ${card('Project register', table('proj', [{ k: 'n', l: 'Project', f: r => `<b>${r.n}</b><div class="sub" style="font-size:11.5px">${r.cat} · ${r.owner}</div>` }, { k: 'bud', l: 'Budget ₹ Cr', n: 1 }, { k: 'spent', l: 'Cost booked', n: 1, f: r => r.spent + '%' }, { k: 'prog', l: 'Physical progress', n: 1, f: r => `<div style="display:flex;align-items:center;gap:8px;justify-content:flex-end"><span class="bar" style="width:80px"><i style="left:0;width:${r.prog}%;background:#1d5fb4"></i></span>${r.prog}%</div>` }, { k: 'fin', l: 'Planned finish' }, { k: 'late', l: 'Days late', n: 1, f: r => r.late ? `<span style="color:var(--bad);font-weight:600">${r.late}</span>` : '0' }, { k: 'st', l: 'SAP status', f: r => pill(r.st, 'mute') }, { k: 'health', l: 'Health', n: 1, f: r => pill(r.health + ' ' + ({ good: 'Green', warn: 'Amber', bad: 'Red' })[r.rag], r.rag) }], rows, { def: 'late' }), { tag: 'PROJ, PRPS, COSP', note: 'New distilleries in Andhra Pradesh and Uttar Pradesh, Malaysia and PET expansion come from abdindia.com; budgets and progress are invented.' })}`;
  };

  V.hr = () => {
    const TL = ['Workforce', 'Plants'], t = curTab('hr', TL), hc = HRP.reduce((a, p) => a + p.hc, 0), cn = HRP.reduce((a, p) => a + p.con, 0), i = st.mi;
    const fn = [['Manufacturing', .46], ['Sales & distribution', .24], ['Supply chain', .1], ['Quality & EHS', .06], ['Finance & IT', .06], ['Corporate', .04]], cols = ['#1d5fb4', '#b45309', '#0f766e', '#7c3aed', '#c0262d', '#64748b'];
    let body;
    if (t === 'Workforce') {
      const ser = D.months.map(m => hc * (.93 + .0045 * m.i + D.hr('hcm', m.i) * .01));
      body = `<div class="grid g4" style="margin-bottom:14px">${kpi({ l: 'Employees', v: fmt(hc, 0), u: '', d: dl(4.2, true, 'vs last year'), s: lastN(ser, i), tag: 'PA / SuccessFactors' })}${kpi({ l: 'Contract workforce', v: fmt(cn, 0), u: '', d: '<div class="d nu">on-site today</div>', s: [8.9, 9.1, 9.3, 9.2, 9.5, 9.7, cn / 1000], c: '#0f766e', tag: 'Contractor registry' })}${kpi({ l: 'Annualised attrition', v: fmt(avg(HRP.map(p => p.attr), 0, HRP.length - 1), 1), u: '%', d: '<div class="d nu">target under 12%</div>', s: [12.4, 12.1, 12.6, 12.2, 11.9, 12.0, 11.8], c: '#c0262d' })}${kpi({ l: 'Open vacancies', v: HRP.reduce((a, p) => a + p.vac, 0), u: '', d: '<div class="d nu">across 19 sites</div>', s: [80, 84, 77, 75, 79, 73, 71], c: '#7c3aed' })}</div>
        <div class="grid g2">${card('Headcount by function', hbars(fn.map((f, k) => ({ n: f[0], v: f[1] * hc, c: cols[k], t: fmt(f[1] * hc, 0) }))), { tag: 'Org assignment' })}${card('Headcount trend', lineChart({ labels: D.months.map(m => m.label), mark: i, zero: false, fy: v => fmt(v, 0), series: [{ n: 'Employees', c: '#1d5fb4', d: ser }], noleg: true }), { tag: 'Headcount snapshots' })}</div>`;
    } else {
      body = card('Plant workforce scorecard', table('hr', [{ k: 'n', l: 'Plant', f: r => `<b>${r.n}</b>` }, { k: 'st', l: 'State' }, { k: 'hc', l: 'Employees', n: 1 }, { k: 'con', l: 'Contract', n: 1 }, { k: 'att', l: 'Attendance', n: 1, f: r => fmt(r.att, 1) + '%' }, { k: 'ot', l: 'Overtime hrs', n: 1, f: r => fmt(r.ot, 0) }, { k: 'attr', l: 'Attrition', n: 1, f: r => r.attr > 14 ? pill(fmt(r.attr, 1) + '%', 'bad') : fmt(r.attr, 1) + '%' }, { k: 'vac', l: 'Vacancies', n: 1 }, { k: 'tr', l: 'Safety training', n: 1, f: r => r.tr < 85 ? pill(fmt(r.tr, 0) + '%', 'warn') : fmt(r.tr, 0) + '%' }], HRP, { def: 'attr' }), { tag: 'Time + attendance, PA', note: 'Contract labour is large in bottling: shown separately because it never appears in the payroll headcount.' });
    }
    return head('People & Workforce Dashboard', 'SAP SuccessFactors', { ins: 'hr' }) + tabs('hr', TL) + body;
  };

  V.ai = () => {
    const ag = [['Stock-out Early Warning', 'Distribution', 612, 92, 'Recommend only', 'Active'], ['Duplicate Invoice Agent', 'Procurement / AP', 2210, 98, 'Auto-block + review', 'Active'], ['Excise Variance Agent', 'Finance / Excise', 340, 94, 'Recommend only', 'Active'], ['Demand Forecast Agent', 'Sales', 128, 88, 'Recommend only', 'Active'], ['Predictive Maintenance Agent', 'Plant Ops', 860, 89, 'Draft notifications', 'In review'], ['Variance Explanation Agent', 'Finance', 412, 96, 'Recommend only', 'Active'], ['Yield Anomaly Agent', 'Distillery', 205, 91, 'Advisory', 'Active'], ['Effluent Risk Agent', 'EHS', 97, 93, 'Advisory (interlocked)', 'Active']].map(a => ({ n: a[0], dom: a[1], runs: a[2], acc: a[3], lvl: a[4], s: a[5] }));
    return `<div class="head"><h1>AI Control Center</h1><span class="chip">AI-001</span><button class="btn pri" data-go="AI platform">↗ Go to app · ABD AI</button></div><div class="sub" style="margin:-8px 0 14px">Agents, insight and governance. All inference runs inside ABD’s own cloud tenant.</div>
    <div class="grid g4" style="margin-bottom:14px">${kpi({ l: 'Active agents', v: 8, u: '', d: '<div class="d nu">6 domains</div>' })}${kpi({ l: 'Recommendations (30d)', v: '4,864', u: '', d: dl(18, true, 'vs prior 30d'), s: [3.1, 3.4, 3.6, 3.9, 4.1, 4.5, 4.86], c: '#7c3aed' })}${kpi({ l: 'Accepted by users', v: '73', u: '%', d: '<div class="d up">▲ 4 pts</div>', s: [66, 68, 69, 70, 71, 72, 73], c: '#0f766e' })}${kpi({ l: 'Human approval needed', v: '100', u: '%', d: '<div class="d nu">for any posting in SAP</div>' })}</div>
    <div class="hero"><div style="font-size:26px">✨</div><div class="q"><b>What do you want to get done?</b><input id="askq" placeholder="Ask in plain language…" autocomplete="off"><div class="chips">${['Which plants are in the watch band?', 'Which materials are below minimum cover?', 'Which states have excise permits pending?', 'Summarize this month'].map(q => `<button data-ask="${q}">${q}</button>`).join('')}</div><div id="ans"></div></div></div>
    <div class="grid g32">${card('Agent registry & governance', table('ag', [{ k: 'n', l: 'Agent', f: r => `<b>${r.n}</b>` }, { k: 'dom', l: 'Domain' }, { k: 'runs', l: 'Runs (30d)', n: 1, f: r => fmt(r.runs, 0) }, { k: 'acc', l: 'Acceptance', n: 1, f: r => r.acc + '%' }, { k: 'lvl', l: 'Autonomy' }, { k: 's', l: 'Status', f: r => pill(r.s, r.s === 'Active' ? 'good' : 'warn') }], ag, { def: 'runs' }), { note: 'Agents shown are examples for the demo; none are connected.' })}
    ${card('Guardrails', `<div class="list">${[['Data stays in ABD’s tenant', 'Prompts, data and models are not sent to public AI services.'], ['AI proposes, people approve', 'Approved actions run through fixed SAP interfaces.'], ['Safety interlocks', 'No AI approval of permits, isolations or statutory filings.'], ['Full audit trail', 'Every recommendation, its evidence and the decision is logged.']].map(x => `<div class="it"><span class="dot good"></span><div><b>${x[0]}</b><div class="sub">${x[1]}</div></div></div>`).join('')}</div>`)}</div>`;
  };

  /* ---------- derived numbers ---------- */
  const F = D.fin;
  function revY(i) { const [a, b] = ytd(i), p = py(i); return { cur: sum(catSeries('rev'), a, b), prev: p ? sum(catSeries('rev'), p[0], p[1]) : null }; }
  function stateCases(i) { // lakh cases per state in month i (respecting category filter)
    return D.states.map(s => ({ s, v: (st.cat === 'All' ? CATS : [st.cat]).reduce((a, c) => a + D.cats[c].cases[i] * s.share[c], 0) }));
  }
  const plantRows = i => D.plants.map(p => Object.assign({ p, n: p.n, st: p.st, t: p.t }, D.plantMonth(p, i)));
  function matStatus(m, i) { const c = m.cover * (1 + (D.hr(m.n, i) - .5) * (i === D.cur ? 0 : .3)); return { c, s: c < m.min ? 'bad' : c > m.max ? 'warn' : 'good' }; }
  function qmetrics(i) {
    return D.plants.map(p => { const b = Math.round(40 + D.plantMonth(p, i).bottled * 40 * (p.dist ? 1.4 : 1)), hold = Math.round(b * (.012 + D.hr(p.id, i, 'h') * .03)), rej = Math.round(b * (.002 + D.hr(p.id, i, 'r') * .012)); return { n: p.n, b, hold, rej, fpy: 100 - (hold + rej) / b * 100, abv: (D.hr(p.id, i, 'a') - .5) * .35, cod: 150 + D.hr(p.id, i, 'c') * 120 + (p.id === 'RAN' && i === D.cur ? 40 : 0), dist: p.dist }; });
  }
  const mat = D.mats;
  function statuses(i) {
    const rev = F.rev[i], bud = F.budget[i], rv = pc(rev, bud);
    const pr = plantRows(i), low = pr.filter(r => r.oee < 66).length;
    const below = mat.filter(m => matStatus(m, i).s === 'bad').length;
    const so = D.stat.reduce((a, s) => a + s.stockouts, 0), perm = D.stat.reduce((a, s) => a + s.permits, 0);
    const q = qmetrics(i), hold = q.reduce((a, x) => a + x.hold, 0), bt = q.reduce((a, x) => a + x.b, 0), codHi = q.filter(x => x.dist && x.cod > 200).length;
    const hi = D.finEx.filter(x => x.sev === 'High').length;
    return {
      exec: { s: rv < -1 ? 'warn' : 'good', msg: rv < -1 ? `Revenue ${fmt(Math.abs(rv), 1)}% below budget` : `Revenue ${fmt(rv, 1)}% vs budget`, mini: [[fmt(F.rev[i], 0), 'Net rev ₹ Cr'], [fmt(D.total.cases[i], 1), 'Lakh cases'], [fmt(F.ebitda[i] / rev * 100, 1) + '%', 'EBITDA']] },
      fin: { s: hi >= 3 ? 'warn' : 'good', msg: `${hi} high-severity exceptions; close 3 of 8 steps done`, mini: [[D.finEx.length, 'Exceptions'], ['38%', 'Close P07'], ['4/5', 'Banks rec.']] },
      prod: { s: low >= 3 ? 'bad' : low ? 'warn' : 'good', msg: `${low} plants below OEE 66% (watch band)`, mini: [[fmt(avg(pr.map(r => r.oee), 0, pr.length - 1), 1) + '%', 'Avg OEE'], [low, 'Watch'], [fmt(pr.reduce((a, r) => a + r.down, 0) / pr.length, 0), 'Down hrs avg']] },
      sup: { s: below >= 2 ? 'bad' : below ? 'warn' : 'good', msg: `${below} materials under minimum cover`, mini: [[fmt(F.inv[i], 0), 'Stock ₹ Cr'], [below, 'Below min'], [fmt(F.dio[i], 0), 'DIO days']] },
      dist: { s: so > 30 || perm > 60 ? 'warn' : 'good', msg: `${so} stock-outs, ${perm} excise permits pending`, mini: [[fmt(D.states.reduce((a, s) => a + s.outlets, 0) / 1000, 0) + 'k', 'Outlets'], [so, 'Stock-outs'], [perm, 'Permits open']] },
      proj: { s: PROJ.filter(p => p.rag === 'bad').length ? 'bad' : 'warn', msg: `${PROJ.filter(p => p.late > 0).length} of ${PROJ.length} projects behind plan`, mini: [[PROJ.length, 'Projects'], [PROJ.filter(p => p.late > 0).length, 'Late'], ['₹' + fmt(PROJ.reduce((a, p) => a + p.bud, 0), 0), 'Budget Cr']] },
      hr: { s: 'good', msg: 'Attrition steady; 71 open vacancies', mini: [[fmt(HRP.reduce((a, p) => a + p.hc, 0), 0), 'Employees'], [fmt(HRP.reduce((a, p) => a + p.con, 0), 0), 'Contract'], [fmt(avg(HRP.map(p => p.attr), 0, HRP.length - 1), 1) + '%', 'Attrition']] },
      qa: { s: codHi ? 'warn' : 'good', msg: `${codHi} distillery effluent reading near limit`, mini: [[fmt(100 - hold / bt * 100, 1) + '%', 'First pass'], [hold, 'Batches held'], [codHi, 'ETP alerts']] }
    };
  }
  const APPS = [
    { id: 'exec', r: 'exec', n: 'Sales & Brand Intelligence', sub: 'Executive BI', ic: '▦', sap: 'SAP S/4HANA SD' },
    { id: 'fin', r: 'finance', n: 'Finance Intelligence', sub: 'SAP S/4HANA FICO', ic: '₹', sap: 'SAP S/4HANA FICO' },
    { id: 'proj', r: 'projects', n: 'Capex & Projects', sub: 'SAP PS project controls', ic: '▲', sap: 'SAP S/4HANA PS' },
    { id: 'prod', r: 'production', n: 'Plant & Distillery Ops', sub: 'SAP PP / PM', ic: '⚙', sap: 'SAP S/4HANA PP' },
    { id: 'sup', r: 'supply', n: 'Supply & Inventory', sub: 'SAP MM / maturation', ic: '▣', sap: 'SAP S/4HANA MM' },
    { id: 'dist', r: 'distribution', n: 'Distribution & Excise', sub: 'State compliance', ic: '⚑', sap: 'SAP S/4HANA SD' },
    { id: 'qa', r: 'quality', n: 'Quality & EHS', sub: 'SAP QM / effluent', ic: '✚', sap: 'SAP S/4HANA QM' },
    { id: 'hr', r: 'hr', n: 'People & Workforce', sub: 'SAP SuccessFactors', ic: '☺', sap: 'SAP SuccessFactors' }
  ];
  const PROJ = [
    ['New grain distillery, Vizianagaram (AP)', 'Distillery', 420, 36, 41, '2027-06', 0, 'REL', 'Capex lead – South'], ['New distillery, Moradabad (UP)', 'Distillery', 380, 22, 24, '2027-09', 0, 'REL', 'Capex lead – North'],
    ['Malaysia local production unit', 'Bottling', 95, 88, 90, '2026-10', 45, 'TECO', 'Head – International'], ['PET plant line 2, Rangapur', 'Packaging', 64, 41, 48, '2026-12', 18, 'REL', 'Head – Packaging'],
    ['Malt distillery expansion', 'Distillery', 150, 58, 52, '2027-01', 62, 'REL', 'Head – Malt'], ['High-speed bottling line, Hapur', 'Bottling', 48, 70, 72, '2026-12', 0, 'REL', 'Plant head – Hapur'],
    ['Zero-liquid-discharge retrofit, Rangapur', 'Environment', 72, 33, 45, '2026-11', 54, 'REL', 'Head – EHS'], ['Cask warehouse, Aurangabad', 'Maturation', 55, 79, 80, '2026-11', 20, 'REL', 'Head – Maturation'],
    ['Rooftop solar at 6 plants', 'Energy', 28, 100, 100, '2026-06', 0, 'CLSD', 'Head – Utilities'], ['Distributor management system rollout', 'IT', 18, 62, 70, '2026-12', 0, 'REL', 'CIO office'],
    ['S/4HANA phase 2 (excise, maturation)', 'IT', 40, 45, 38, '2027-03', 33, 'REL', 'CIO office'], ['Warehouse automation, Haridwar', 'Logistics', 33, 12, 10, '2027-08', 0, 'CRTD', 'Head – Supply chain']
  ].map(p => { const late = p[6], over = p[3] - p[4]; const h = Math.round(100 - late * .45 - Math.max(0, over) * 1.2); return { n: p[0], cat: p[1], bud: p[2], spent: p[3], prog: p[4], fin: p[5], late, st: p[7], owner: p[8], health: h, rag: h < 60 ? 'bad' : h < 80 ? 'warn' : 'good' }; });
  const HRP = D.plants.map(p => ({ n: p.n, st: p.st, hc: Math.round(60 + (p.dist ? 4 : 1) * 60 * (.5 + D.hr(p.id, 'hc')) * p.w * 14), con: Math.round(150 + D.hr(p.id, 'cn') * 320 * (p.dist ? 1.6 : 1)), att: 91 + D.hr(p.id, 'at') * 6, ot: Math.round(1200 + D.hr(p.id, 'ot') * 3800), attr: 7 + D.hr(p.id, 'ar') * 11, vac: Math.round(D.hr(p.id, 'vc') * 12), tr: 78 + D.hr(p.id, 'tr') * 21 }));
  const TILES = { PB: [1, 0], HR: [2, 0], RJ: [1, 1], DL: [2, 1], UP: [3, 1], AS: [6, 1], MP: [2, 2], JH: [4, 2], WB: [5, 2], MH: [2, 3], CG: [3, 3], OD: [4, 3], GA: [1, 4], KA: [2, 4], TS: [3, 4], AP: [4, 4], KL: [2, 5] };
  const SL = { good: 'On track', warn: 'Watch', bad: 'Action' };

  /* ---------- views ---------- */
  V.home = () => {
    const i = st.mi, s = statuses(i), cnt = { good: 0, warn: 0, bad: 0 }; APPS.forEach(a => cnt[s[a.id].s]++);
    const L = n => lastN(n, i);
    return `<div class="sub" style="font-weight:600;letter-spacing:.04em">${new Date(2026, 10, 26).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</div>
    <h1>Good morning, Demo</h1><div style="margin:6px 0 16px"><span class="chip">Demo · All access · Showcase login</span> <span class="sub">&nbsp;Cases sold, made and shipped across 41 facilities — ${D.months[i].long}.</span></div>
    <div class="hero"><div style="font-size:26px">✨</div><div class="q"><b>Hi Demo, what would you like to know?</b><div class="sub" style="margin-bottom:8px">ABD AI · answers come from the data lake only, inside your tenant</div>
      <input id="askq" placeholder="Ask about plants, brands, stock, excise…" autocomplete="off"><div class="chips">${['Which plants are in the watch band?', 'Why is ICONiQ White growing?', 'Which materials are below minimum cover?', 'Which states have excise permits pending?', 'Summarize this month'].map(q => `<button data-ask="${q}">${q}</button>`).join('')}</div>
      <div id="ans"></div></div></div>
    <h2 style="margin:6px 0 10px">Today at a glance <span class="sub" style="font-weight:400">· across the business · ${D.months[i].long} · demo data</span></h2>
    <div class="grid g32" style="margin-bottom:18px">
      <div class="card"><div class="ch"><h2>Business health</h2></div>${donut([{ n: 'On track', v: cnt.good, c: '#2e9d57', t: cnt.good }, { n: 'Watch', v: cnt.warn, c: '#d9892b', t: cnt.warn }, { n: 'Action', v: cnt.bad, c: '#d6453d', t: cnt.bad }], APPS.length, 'apps')}<div class="note">${cnt.warn + cnt.bad} of ${APPS.length} apps need attention</div></div>
      <div class="grid" style="grid-template-columns:1fr 1fr">
        ${kpi({ l: 'Net revenue', v: fmt(F.rev[i], 0), u: '₹ Cr', d: dl(i > 0 ? pc(F.rev[i], F.rev[i - 1]) : null, true, 'vs prior month'), s: L(F.rev), c: '#1d5fb4' })}
        ${kpi({ l: 'Cases sold', v: fmt(D.total.cases[i], 1), u: 'lakh', d: dl(i >= 12 ? pc(D.total.cases[i], D.total.cases[i - 12]) : null), s: L(D.total.cases), c: '#0f766e' })}
        ${kpi({ l: 'EBITDA margin', v: fmt(F.ebitda[i] / F.rev[i] * 100, 1), u: '%', d: dl(i >= 12 ? F.ebitda[i] / F.rev[i] * 100 - F.ebitda[i - 12] / F.rev[i - 12] * 100 : null, true, 'vs PY', 'pts'), s: L(F.ebitda.map((e, k) => e / F.rev[k] * 100)), c: '#b45309' })}
        ${kpi({ l: 'Open items', v: D.finEx.reduce((a, x) => a + x.n, 0) + D.stat.reduce((a, x) => a + x.permits, 0), u: 'in ' + APPS.length + ' apps', d: '<div class="d dn">2 critical today</div>', s: [90, 84, 88, 80, 79, 74, 77], c: '#7c3aed' })}
      </div></div>
    <h2 style="margin-bottom:10px">Apps <span class="sub" style="font-weight:400">· ${APPS.length} apps for your role · click a card to open</span></h2>
    <div class="grid g3" style="margin-bottom:18px">${APPS.map(a => `<div class="card appcard ${s[a.id].s}" data-route="${a.r}"><div class="ch"><span class="ic" style="font-size:22px">${a.ic}</span><div><h2 style="font-size:16px">${a.n}</h2><div class="sub" style="font-size:12px">${a.sub}</div></div><span class="sp"></span>${pill(SL[s[a.id].s], s[a.id].s)}</div><div class="mini">${s[a.id].mini.map(m => `<div><b>${m[0]}</b><span>${m[1]}</span></div>`).join('')}</div><div class="d ${s[a.id].s === 'good' ? 'up' : 'dn'}" style="color:${s[a.id].s === 'good' ? 'var(--good)' : 'var(--warn)'}">ⓘ ${s[a.id].msg}</div><div style="margin-top:10px;color:var(--pri2);font-weight:600">Go to app →</div></div>`).join('')}</div>
    <div class="grid g2">${card('Sites and alerts', tileMap(i), { tag: 'Billing + permits', note: 'Tile map of states in ABD’s footprint (not a geographic outline).' })}${card('Needs attention',`<div class="list">${alerts(i).map(a => `<div class="it" ><span class="dot ${a[0]}"></span><div><b>${a[1]}</b><div class="sub">${a[2]}</div></div></div>`).join('')}</div>`)}
    ${card('Why a data lake?', `<div class="list"><div class="it"><span class="dot good"></span><div><b>SAP stays the system of record</b><div class="sub">Order entry, goods movement, payment runs and excise e-challans keep running in S/4HANA, untouched.</div></div></div><div class="it"><span class="dot good"></span><div><b>Analytics move out of SAP</b><div class="sub">Dashboards read a synced copy (hourly to daily), so read-only users need no SAP licence.</div></div></div><div class="it"><span class="dot good"></span><div><b>One place for SAP + non-SAP</b><div class="sub">Distributor (DMS) sales, plant historians and commodity prices join the same model.</div></div></div></div><div style="margin-top:8px"><button class="btn" data-route="lake">See the architecture →</button></div>`)}</div>`;
  };
  function alerts(i) {
    const pr = plantRows(i).sort((a, b) => a.oee - b.oee), out = [];
    const lowm = mat.filter(m => matStatus(m, i).s === 'bad');
    lowm.forEach(m => out.push(['bad', `${m.n} below minimum cover`, `${fmt(matStatus(m, i).c, 0)} days vs minimum ${m.min} · ${m.po} open POs`]));
    pr.slice(0, 2).forEach(r => out.push(['warn', `${r.n} OEE ${fmt(r.oee, 1)}%`, `${fmt(r.down, 0)} downtime hrs this month · scrap ${fmt(r.scrap, 1)}%`]));
    out.push(['warn', 'Uttar Pradesh fill rate 87%', '7 depots with stock-out on Officer\'s Choice Blue 180 ml']);
    out.push(['warn', 'Maharashtra: 12 transport permits pending', 'Oldest request open 5 days']);
    out.push(['bad', 'Excise ledger vs e-challan variance', '₹6.2 Cr · Maharashtra · 4 documents']);
    return out.slice(0, 7);
  }

  V.exec = () => {
    const i = st.mi, T = tabs('exec', ['Overview', 'Brands', 'Markets']), t = curTab('exec', ['Overview', 'Brands', 'Markets']);
    const rs = catSeries('rev'), cs = catSeries('cases'), yv = revY(i), p = py(i);
    let body = '';
    if (t === 'Overview') {
      const mass = D.brands.map(b => ({ b, price: b.rev[i] / b.cases[i] * 100 })), tier = (arr, k) => arr.filter(x => k === 'M' ? x.price < 4000 : k === 'P' ? x.price >= 4000 && x.price < 9000 : x.price >= 9000);
      const tierSeries = (k, c) => ({ n: k === 'M' ? 'Mass' : k === 'P' ? 'Premium' : 'Prestige & luxury', c, d: D.months.map(m => { const all = D.brands.filter(b => st.cat === 'All' || b.c === st.cat), r = all.map(b => ({ b, price: b.rev[m.i] / b.cases[m.i] * 100 })); const x = tier(r, k).reduce((a, y) => a + y.b.rev[m.i], 0), tt = r.reduce((a, y) => a + y.b.rev[m.i], 0); return x / tt * 100; }) });
      const prem = 100 - tierSeries('M').d[i];
      body = `<div class="grid g4" style="margin-bottom:14px">
        ${kpi({ l: 'Net revenue', v: fmt(rs[i], 0), u: '₹ Cr', d: dl(p || i >= 12 ? pc(rs[i], rs[i - 12]) : null), s: lastN(rs, i), tag: 'VBRK, VBRP' })}
        ${kpi({ l: 'Volume', v: fmt(cs[i], 1), u: 'lakh cases', d: dl(i >= 12 ? pc(cs[i], cs[i - 12]) : null), s: lastN(cs, i), c: '#0f766e', tag: 'VBRP' })}
        ${kpi({ l: 'FY YTD net revenue', v: fmt(yv.cur, 0), u: '₹ Cr', d: dl(yv.prev ? pc(yv.cur, yv.prev) : null, true, 'vs PY YTD'), s: lastN(rs, i, 7), c: '#7c3aed', tag: 'VBRK' })}
        ${kpi({ l: 'Premium & above', v: fmt(prem, 1), u: '% of revenue', d: dl(i >= 12 ? prem - (100 - tierSeries('M').d[i - 12]) : null, true, 'vs PY', 'pts'), s: lastN(tierSeries('M').d.map(x => 100 - x), i), c: '#b45309', tag: 'VBRP, MARA' })}</div>
        <div class="grid g32" style="margin-bottom:14px">${card('Monthly net revenue by category', colChart({ labels: D.months.map(m => m.label), stack: true, mark: i, ft: v => '₹' + fmt(v, 0) + ' Cr', fy: fmt, series: (st.cat === 'All' ? CATS : [st.cat]).map(c => ({ n: c, c: CC[c], d: D.cats[c].rev })) }), { tag: 'Billing documents', note: '₹ Cr, Apr 2025 – Oct 2026. Click the month selector to move the highlight.' })}
        ${card('Category mix', donut((st.cat === 'All' ? CATS : [st.cat]).map(c => ({ n: c, v: D.cats[c].rev[i], c: CC[c], t: '₹' + fmt(D.cats[c].rev[i], 0) + ' Cr' })), '₹' + fmt(rs[i], 0), 'Cr this month'), { tag: 'Billing documents' })}</div>
        <div class="grid g2">${card('Premiumisation: revenue by price tier', lineChart({ labels: D.months.map(m => m.label), mark: i, fy: v => fmt(v, 0) + '%', ft: v => fmt(v, 1) + '%', series: [tierSeries('M', '#64748b'), tierSeries('P', '#1d5fb4'), tierSeries('L', '#b45309')] }), { tag: 'Billing + material master', note: 'Mass &lt; ₹4,000/case, premium ₹4,000–9,000, prestige/luxury above.' })}
        ${card('Revenue by channel', donut(D.channels.map(c => ({ n: c.n, v: c.s, c: c.c, t: '₹' + fmt(c.s * rs[i], 0) + ' Cr' })), '4', 'channels'), { tag: 'Billing + customer master', note: 'Export is growing fastest: whisky now ships to 39 countries.' })}</div>`;
    } else if (t === 'Brands') {
      const rows = D.brands.filter(b => st.cat === 'All' || b.c === st.cat).map(b => { const [a, z] = ytd(i), q = py(i), r = sum(b.rev, a, z), rp = q ? sum(b.rev, q[0], q[1]) : null; return { n: b.n, c: b.c, cases: b.cases[i], rev: b.rev[i], ytd: r, g: rp ? pc(r, rp) : null, real: b.rev[i] / b.cases[i] * 100, spark: lastN(b.rev, i), mix: b.rev[i] / rs[i] * 100 }; });
      body = card('Brand leaderboard', table('brands', [{ k: 'n', l: 'Brand', f: r => `<b>${r.n}</b>` }, { k: 'c', l: 'Category', f: r => `<span style="color:${CC[r.c]};font-weight:600">${r.c}</span>` }, { k: 'cases', l: 'Lakh cases', n: 1, f: r => fmt(r.cases, 2) }, { k: 'real', l: '₹ / case', n: 1, f: r => fmt(r.real, 0) }, { k: 'rev', l: 'Net rev ₹ Cr', n: 1, f: r => fmt(r.rev, 1) }, { k: 'mix', l: 'Mix %', n: 1, f: r => fmt(r.mix, 1) }, { k: 'ytd', l: 'YTD ₹ Cr', n: 1, f: r => fmt(r.ytd, 0) }, { k: 'g', l: 'YTD growth', n: 1, sv: r => r.g == null ? -999 : r.g, f: r => r.g == null ? '–' : `<span class="d ${r.g >= 0 ? 'up' : 'dn'}">${r.g >= 0 ? '▲' : '▼'} ${fmt(Math.abs(r.g), 1)}%</span>` }, { k: 'sp', l: '12-month trend', sv: r => r.rev, f: r => `<svg viewBox="0 0 90 22" width="90" height="22" preserveAspectRatio="none">${(() => { const a = r.spark, mn = Math.min(...a), mx = Math.max(...a); return `<path d="${a.map((v, k) => (k ? 'L' : 'M') + (k * 90 / (a.length - 1)).toFixed(1) + ' ' + (20 - (v - mn) / ((mx - mn) || 1) * 18).toFixed(1)).join('')}" fill="none" stroke="${CC[r.c]}" stroke-width="2"/>`; })()}</svg>` }], rows, { def: 'rev' }), { tag: 'VBRP, MARA', note: 'Brands and categories from abdindia.com; volumes and prices are illustrative. Click any column header to sort.' });
    } else {
      const sc = stateCases(i).sort((a, b) => b.v - a.v), mx = sc[0].v;
      body = `<div class="grid g2" style="margin-bottom:14px">${card('Cases sold by state, ' + D.months[i].long, hbars(sc.map(x => ({ n: x.s.name, v: x.v, c: '#1d5fb4', t: fmt(x.v, 2) + ' lakh' })), fmt, mx), { tag: 'Billing + ship-to', note: 'Alcohol-restricted states (e.g. Gujarat, Bihar) are not in the footprint.' })}
        ${card('Category share by region', ['North', 'South', 'East', 'West', 'Central'].map(rg => { const cats = CATS.map(c => ({ n: c, c: CC[c], v: D.states.filter(s => s.region === rg).reduce((a, s) => a + D.cats[c].cases[i] * s.share[c], 0) })); const t = cats.reduce((a, x) => a + x.v, 0); return `<div style="margin:12px 0"><div style="display:flex;justify-content:space-between"><b>${rg}</b><span class="sub">${fmt(t, 2)} lakh cases</span></div><div class="bar" style="height:14px;display:flex;overflow:hidden">${cats.map(x => `<i style="position:static;width:${x.v / t * 100}%;background:${x.c}" data-tip="${esc(x.n + ': ' + fmt(x.v / t * 100, 1) + '%')}"></i>`).join('')}</div></div>`; }).join('') + legend(CATS.map(c => ({ n: c, c: CC[c] }))), { note: 'Brandy leans south, gin leans metro: what the sales team sees here decides the next launch.' })}</div>`;
    }
    return head('Sales & Brand Dashboard', 'SAP S/4HANA SD', { cat: 1, ins: 'exec' }) + T + body;
  };

  V.finance = () => {
    const i = st.mi, TL = ['Overview', 'Working capital', 'Close & exceptions'], t = curTab('finance', TL), [a, z] = ytd(i), q = py(i);
    const ratio = (x, y) => x / y;
    const ttm = k => sum(F[k], Math.max(0, i - 11), i), nd = F.debt[i] - F.cash[i];
    let body = '';
    const ps = k => lastN(F[k], i);
    if (t === 'Overview') {
      const hc = [['Net debt / EBITDA', fmt(nd / (ttm('ebitda') * 12 / Math.min(12, i + 1)), 2) + '×', nd / (ttm('ebitda') * 12 / Math.min(12, i + 1)) < 2.5 ? 'HEALTHY' : 'ATTENTION'], ['Interest cover', fmt(ttm('ebitda') / ttm('int'), 2) + '×', ttm('ebitda') / ttm('int') > 3 ? 'HEALTHY' : 'ATTENTION'], ['Current ratio (proxy)', fmt((F.inv[i] + F.recv[i] + F.cash[i]) / (F.pay[i] + 160), 2) + '×', 'HEALTHY'], ['Cash conversion cycle', fmt(F.dso[i] + F.dio[i] - F.dpo[i], 0) + ' days', F.dso[i] + F.dio[i] - F.dpo[i] > 70 ? 'ATTENTION' : 'HEALTHY']];
      body = `<div class="grid g3" style="margin-bottom:14px">
        ${kpi({ l: 'Net revenue YTD', v: fmt(sum(F.rev, a, z), 0), u: '₹ Cr', d: dl(q ? pc(sum(F.rev, a, z), sum(F.rev, q[0], q[1])) : null, true, 'vs PY YTD'), s: ps('rev'), tag: 'ACDOCA' })}
        ${kpi({ l: 'EBITDA YTD', v: fmt(sum(F.ebitda, a, z), 0), u: '₹ Cr', d: dl(q ? pc(sum(F.ebitda, a, z), sum(F.ebitda, q[0], q[1])) : null, true, 'vs PY YTD'), s: ps('ebitda'), c: '#0f766e', tag: 'ACDOCA' })}
        ${kpi({ l: 'Profit after tax YTD', v: fmt(sum(F.pat, a, z), 0), u: '₹ Cr', d: dl(q ? pc(sum(F.pat, a, z), sum(F.pat, q[0], q[1])) : null, true, 'vs PY YTD'), s: ps('pat'), c: '#7c3aed', tag: 'ACDOCA' })}
        ${kpi({ l: 'Borrowings', v: fmt(F.debt[i], 0), u: '₹ Cr', d: dl(pc(F.debt[i], F.debt[Math.max(0, i - 12)]) * (i >= 12 ? 1 : 0) || null, false, 'vs last year'), s: ps('debt'), c: '#c0262d', tag: 'BSEG' })}
        ${kpi({ l: 'Cash & bank', v: fmt(F.cash[i], 0), u: '₹ Cr', d: dl(i >= 12 ? pc(F.cash[i], F.cash[i - 12]) : null, true, 'vs last year'), s: ps('cash'), c: '#1d5fb4', tag: 'BSEG, bank feed' })}
        ${kpi({ l: 'Duty & taxes paid YTD', v: fmt(sum(F.duty, a, z), 0), u: '₹ Cr', d: dl(q ? pc(sum(F.duty, a, z), sum(F.duty, q[0], q[1])) : null, true, 'vs PY YTD'), s: ps('duty'), c: '#b45309', tag: 'Excise Z-tables' })}</div>
        <div class="grid g32" style="margin-bottom:14px">${card('Monthly net revenue: this FY vs last FY', (() => { const f0 = i >= 12 ? 12 : 0, m12 = D.months.slice(0, 12).map(m => m.m); return lineChart({ labels: m12, fy: v => fmt(v, 0), ft: v => '₹' + fmt(v, 0) + ' Cr', series: [{ n: i >= 12 ? 'FY 2025/26' : 'FY 2024/25 n/a', c: '#94a3b8', d: i >= 12 ? F.rev.slice(0, 12) : m12.map(() => null) }, { n: i >= 12 ? 'FY 2026/27' : 'FY 2025/26', c: '#1d5fb4', d: m12.map((_, k) => f0 + k <= i ? F.rev[f0 + k] : null) }, { n: 'Budget', c: '#b45309', dash: 1, d: m12.map((_, k) => f0 + k <= 18 ? F.budget[f0 + k] : null) }] }); })(), { tag: 'ACDOCA', note: '₹ Cr, net of excise pass-through.' })}
        ${card('Health check', hc.map(h => `<div style="display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid #eef1f6"><div><div style="font-size:22px;font-weight:700">${h[1]}</div><div class="sub">${h[0]}</div></div>${pill(h[2], h[2] === 'HEALTHY' ? 'good' : 'warn')}</div>`).join(''), { tag: 'ACDOCA', note: 'Bands are indicative lender levels, to be confirmed by Finance.' })}</div>
        ${card('Profit & loss, FY year to date', (() => { const L = (n, k, b) => { const c = sum(F[k], a, z), p = q ? sum(F[k], q[0], q[1]) : null; return { n, c, p, r: c / sum(F.rev, a, z) * 100, b }; }; const rows = [L('Net revenue', 'rev', 1), L('Cost of goods (ENA, glass, packing, conversion)', 'cogs'), L('Advertising & promotion', 'ap'), L('Employee cost', 'emp'), L('Other expenses', 'oth'), L('EBITDA', 'ebitda', 1), L('Depreciation', 'dep'), L('Interest', 'int'), L('Profit after tax', 'pat', 1)]; return table('pl', [{ k: 'n', l: 'Line', f: r => r.b ? `<b>${r.n}</b>` : r.n, sv: r => r.n }, { k: 'c', l: 'YTD ₹ Cr', n: 1, f: r => r.b ? `<b>${fmt(r.c, 1)}</b>` : fmt(r.c, 1) }, { k: 'r', l: '% of revenue', n: 1, f: r => fmt(r.r, 1) + '%' }, { k: 'p', l: 'PY YTD ₹ Cr', n: 1, f: r => r.p == null ? '–' : fmt(r.p, 1) }, { k: 'g', l: 'Change', n: 1, f: r => r.p == null ? '–' : fmt(pc(r.c, r.p), 1) + '%', sv: r => r.p ? pc(r.c, r.p) : 0 }], rows, { def: '' }); })(), { tag: 'ACDOCA / CO-PA', note: 'Cost lines show where grain and glass inflation is landing.' })}`;
    } else if (t === 'Working capital') {
      body = `<div class="grid g4" style="margin-bottom:14px">${kpi({ l: 'Receivable days (DSO)', v: fmt(F.dso[i], 1), u: 'days', d: dl(F.dso[i] - F.dso[Math.max(0, i - 1)], false, 'vs last month', 'days'), s: ps('dso'), tag: 'BSEG customer items' })}
        ${kpi({ l: 'Inventory days (DIO)', v: fmt(F.dio[i], 1), u: 'days', d: dl(F.dio[i] - F.dio[Math.max(0, i - 1)], false, 'vs last month', 'days'), s: ps('dio'), c: '#b45309', tag: 'MBEW, MSEG' })}
        ${kpi({ l: 'Payable days (DPO)', v: fmt(F.dpo[i], 1), u: 'days', d: dl(F.dpo[i] - F.dpo[Math.max(0, i - 1)], true, 'vs last month', 'days'), s: ps('dpo'), c: '#0f766e', tag: 'BSEG vendor items' })}
        ${kpi({ l: 'Cash conversion cycle', v: fmt(F.dso[i] + F.dio[i] - F.dpo[i], 0), u: 'days', d: '<div class="d nu">DSO + DIO − DPO</div>', s: ps('dso').map((x, k) => x + ps('dio')[k] - ps('dpo')[k]), c: '#7c3aed' })}</div>
        <div class="grid g2">${card('Working capital build', colChart({ labels: D.months.map(m => m.label), mark: i, ft: v => '₹' + fmt(v, 0) + ' Cr', series: [{ n: 'Inventory', c: '#b45309', d: F.inv }, { n: 'Receivables', c: '#1d5fb4', d: F.recv }, { n: 'Payables', c: '#94a3b8', d: F.pay }] }), { tag: 'BSEG, MBEW', note: 'Inventory is heavy because spirit matures in cask for years before it is sold.' })}
        ${card('Borrowings vs cash', lineChart({ labels: D.months.map(m => m.label), mark: i, ft: v => '₹' + fmt(v, 0) + ' Cr', series: [{ n: 'Borrowings', c: '#c0262d', d: F.debt }, { n: 'Cash & bank', c: '#1d5fb4', d: F.cash }, { n: 'Net debt', c: '#0f1b2d', dash: 1, d: F.debt.map((d, k) => d - F.cash[k]) }] }), { tag: 'BSEG, bank feed' })}</div>`;
    } else {
      const done = D.closeTasks.filter(x => x[1] === 'Done').length;
      body = `<div class="grid g32">${card('Open exceptions', table('fex', [{ k: 't', l: 'Exception' }, { k: 'mod', l: 'Module' }, { k: 'loc', l: 'Where' }, { k: 'amt', l: '₹ Cr', n: 1, f: r => fmt(r.amt, 1) }, { k: 'n', l: 'Items', n: 1 }, { k: 'sev', l: 'Severity', f: r => pill(r.sev, r.sev === 'High' ? 'bad' : r.sev === 'Med' ? 'warn' : 'mute'), sv: r => ({ High: 3, Med: 2, Low: 1 })[r.sev] }], D.finEx, { def: 'sev' }), { tag: 'BKPF, BSEG, EKBE', note: 'Fixing happens in SAP: use “Go to app” to jump to the document.' })}
        ${card('Period close P07 (Oct)', `<div style="font-size:28px;font-weight:700">${fmt(done / D.closeTasks.length * 100, 0)}%<span class="sub" style="font-size:13px;font-weight:500"> ${done} of ${D.closeTasks.length} steps</span></div><div class="bar" style="margin:8px 0 12px"><i style="left:0;width:${done / D.closeTasks.length * 100}%;background:#2e9d57"></i></div>${D.closeTasks.map(x => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eef1f6"><span>${x[0]}</span>${pill(x[1], x[1] === 'Done' ? 'good' : x[1] === 'Pending' ? 'mute' : 'warn')}</div>`).join('')}`, { tag: 'Close checklist' })}</div>`;
    }
    return head('Finance Dashboard', 'SAP S/4HANA FICO', { ins: 'finance' }) + tabs('finance', TL) + body;
  };

  V.production = () => {
    const i = st.mi, TL = ['Bottling plants', 'Distilleries', 'Breakdowns & maintenance'], t = curTab('production', TL), pr = plantRows(i);
    let body = '';
    const bot = pr.filter(r => true);
    if (t === 'Bottling plants') {
      const tot = pr.reduce((a, r) => a + r.bottled, 0), oee = pr.reduce((a, r) => a + r.oee, 0) / pr.length, hist = D.months.map(m => D.plantMonth(D.plants[0], m.i).oee * 0 + plantRows(m.i).reduce((a, r) => a + r.oee, 0) / pr.length);
      body = `<div class="grid g4" style="margin-bottom:14px">${kpi({ l: 'Cases produced', v: fmt(tot, 1), u: 'lakh', d: dl(i >= 12 ? pc(tot, plantRows(i - 12).reduce((a, r) => a + r.bottled, 0)) : null), s: lastN(D.months.map(m => plantRows(m.i).reduce((a, r) => a + r.bottled, 0)), i), tag: 'AFKO, AUFM' })}
        ${kpi({ l: 'Average OEE', v: fmt(oee, 1), u: '%', d: dl(oee - hist[Math.max(0, i - 1)], true, 'vs last month', 'pts'), s: lastN(hist, i), c: '#0f766e', tag: 'Confirmations + historian' })}
        ${kpi({ l: 'Plants in watch band', v: pr.filter(r => r.oee < 66).length, u: 'OEE < 66%', d: '<div class="d dn">Target ≥ 70%</div>', s: lastN(D.months.map(m => plantRows(m.i).filter(r => r.oee < 66).length), i), c: '#c0262d' })}
        ${kpi({ l: 'Scrap & breakage', v: fmt(pr.reduce((a, r) => a + r.scrap, 0) / pr.length, 2), u: '%', d: '<div class="d nu">of filled bottles</div>', s: lastN(D.months.map(m => plantRows(m.i).reduce((a, r) => a + r.scrap, 0) / pr.length), i), c: '#b45309', tag: 'MSEG scrap' })}</div>
        ${card('Plant scorecard, ' + D.months[i].long, table('plants', [{ k: 'n', l: 'Plant', f: r => `<b>${r.n}</b>` }, { k: 'st', l: 'State' }, { k: 't', l: 'Type' }, { k: 'bottled', l: 'Lakh cases', n: 1, f: r => fmt(r.bottled, 2) }, { k: 'util', l: 'Utilisation', n: 1, f: r => fmt(r.util, 0) + '%' }, { k: 'oee', l: 'OEE', n: 1, sv: r => r.oee, f: r => `<div style="display:flex;align-items:center;gap:8px;justify-content:flex-end"><span style="width:90px" class="bar"><i style="left:0;width:${r.oee}%;background:${r.oee < 66 ? '#d6453d' : r.oee < 72 ? '#d9892b' : '#2e9d57'}"></i></span>${fmt(r.oee, 1)}%</div>` }, { k: 'down', l: 'Downtime h', n: 1, f: r => fmt(r.down, 0) }, { k: 'scrap', l: 'Scrap %', n: 1, f: r => fmt(r.scrap, 2) }, { k: 's', l: 'Status', sv: r => -r.oee, f: r => r.oee < 66 ? pill('Watch', 'bad') : r.oee < 72 ? pill('Fair', 'warn') : pill('Good', 'good') }], pr, { def: 's' }), { tag: 'AFKO, AFPO, AUFM + SCADA', note: 'Locations from the ABD operations page; capacity and performance are illustrative. Real-time line status stays in the plant SCADA.' })}`;
    } else if (t === 'Distilleries') {
      const lbl = D.months.map(m => m.label);
      body = `<div class="grid g4" style="margin-bottom:14px">${D.dist.map(d => kpi({ l: d.n + ': ENA output', v: fmt(d.ena[i], 1), u: 'lakh BL', d: dl(i >= 12 ? pc(d.ena[i], d.ena[i - 12]) : null), s: lastN(d.ena, i), tag: 'Process orders' })).join('')}${D.dist.map(d => kpi({ l: d.n + ': yield', v: fmt(d.yld[i], 0), u: 'L / t grain', d: `<div class="d ${d.yld[i] >= 430 ? 'up' : 'dn'}">${d.yld[i] >= 430 ? '▲' : '▼'} target 430</div>`, s: lastN(d.yld, i), c: '#0f766e', tag: 'Process orders' })).join('')}</div>
        <div class="grid g2">${card('ENA output', colChart({ labels: lbl, mark: i, ft: v => fmt(v, 1) + ' lakh BL', series: D.dist.map((d, k) => ({ n: d.n, c: k ? '#1d5fb4' : '#b45309', d: d.ena })), stack: true }), { tag: 'Process orders', note: 'Lakh bulk litres. Two owned ENA distilleries (Aurangabad, Rangapur); more under construction.' })}
        ${card('Alcohol yield, litres per tonne of grain', lineChart({ labels: lbl, mark: i, zero: false, fy: v => fmt(v, 0), series: D.dist.map((d, k) => ({ n: d.n, c: k ? '#1d5fb4' : '#b45309', d: d.yld })).concat([{ n: 'Target', c: '#94a3b8', dash: 1, d: lbl.map(() => 430) }]) }), { tag: 'Process orders + lab', note: 'Aurangabad has slipped below target since July: fermentation temperature is the first suspect.' })}
        ${card('Steam use, kg per bulk litre', lineChart({ labels: lbl, mark: i, zero: false, fy: v => fmt(v, 1), series: D.dist.map((d, k) => ({ n: d.n, c: k ? '#1d5fb4' : '#b45309', d: d.steam })) }), { tag: 'Historian' })}
        ${card('Water use, litres per litre alcohol', lineChart({ labels: lbl, mark: i, zero: false, fy: v => fmt(v, 1), series: D.dist.map((d, k) => ({ n: d.n, c: k ? '#1d5fb4' : '#b45309', d: d.water })) }), { tag: 'Historian' })}</div>`;
    } else {
      const reasons = [['Filler / rinser jam', 31], ['Glass shortage or defect', 24], ['Labeller & coding', 17], ['Changeover (brand/size)', 14], ['Capper / closure', 9], ['Power or utilities', 5]].map(r => ({ n: r[0], v: r[1], c: '#b45309', t: r[1] + '%' }));
      const mm = pr.map(r => { const x = D.hr(r.p.id, i, 'bd'); return { n: r.n, bd: Math.round(2 + x * 12 + (r.oee < 66 ? 6 : 0)), mtbf: 40 + D.hr(r.p.id, 'mt') * 120 - (r.oee < 66 ? 30 : 0), mttr: 1.5 + D.hr(r.p.id, i, 'tr') * 3, pm: 78 + D.hr(r.p.id, i, 'pm') * 21, wo: Math.round(10 + D.hr(r.p.id, i, 'wo') * 40) }; });
      body = `<div class="grid g32" style="margin-bottom:14px">${card('Where line time is lost', hbars(reasons, v => v + '%', 35), { tag: 'Notifications (QMEL), downtime codes', note: 'Share of unplanned downtime hours, all plants.' })}
        <div class="grid" style="grid-template-columns:1fr 1fr">${kpi({ l: 'Breakdowns', v: mm.reduce((a, x) => a + x.bd, 0), u: 'this month', d: '<div class="d nu">all plants</div>', s: [162, 158, 171, 149, 155, 148, 150], c: '#c0262d' })}${kpi({ l: 'PM compliance', v: fmt(mm.reduce((a, x) => a + x.pm, 0) / mm.length, 0), u: '%', d: '<div class="d nu">target 90%</div>', s: [84, 85, 86, 88, 87, 89, 88], c: '#0f766e' })}${kpi({ l: 'Open work orders', v: mm.reduce((a, x) => a + x.wo, 0), u: '', d: '<div class="d nu">AUFK</div>', s: [610, 590, 640, 600, 585, 620, 612], c: '#7c3aed' })}${kpi({ l: 'Avg repair time', v: fmt(mm.reduce((a, x) => a + x.mttr, 0) / mm.length, 1), u: 'hrs', d: '<div class="d nu">MTTR</div>', s: [3.1, 3.0, 2.8, 2.9, 2.7, 2.8, 2.6], c: '#b45309' })}</div></div>
        ${card('Maintenance by plant', table('mm', [{ k: 'n', l: 'Plant', f: r => `<b>${r.n}</b>` }, { k: 'bd', l: 'Breakdowns', n: 1 }, { k: 'mtbf', l: 'MTBF (hrs)', n: 1, f: r => fmt(r.mtbf, 0) }, { k: 'mttr', l: 'MTTR (hrs)', n: 1, f: r => fmt(r.mttr, 1) }, { k: 'pm', l: 'PM compliance', n: 1, f: r => `<span style="color:${r.pm < 85 ? 'var(--bad)' : 'inherit'}">${fmt(r.pm, 0)}%</span>` }, { k: 'wo', l: 'Open work orders', n: 1 }], mm, { def: 'bd' }), { tag: 'AUFK, AFIH, QMEL' })}`;
    }
    return head('Plant & Distillery Operations', 'SAP S/4HANA PP', { ins: 'production' }) + tabs('production', TL) + body;
  };

  V.supply = () => {
    const i = st.mi, rows = mat.map(m => { const s = matStatus(m, i); return Object.assign({}, m, { cov: s.c, s: s.s }); });
    const below = rows.filter(r => r.s === 'bad').length;
    const bandMax = 100;
    return head('Supply & Inventory Dashboard', 'SAP S/4HANA MM', { ins: 'supply' }) + `<div class="grid g4" style="margin-bottom:14px">
      ${kpi({ l: 'Inventory value', v: fmt(F.inv[i], 0), u: '₹ Cr', d: dl(i >= 12 ? pc(F.inv[i], F.inv[i - 12]) : null, false), s: lastN(F.inv, i), c: '#b45309', tag: 'MBEW, MARD' })}
      ${kpi({ l: 'Inventory days', v: fmt(F.dio[i], 0), u: 'days', d: '<div class="d nu">includes maturing spirit</div>', s: lastN(F.dio, i), tag: 'MBEW' })}
      ${kpi({ l: 'Materials below minimum', v: below, u: 'of ' + rows.length, d: `<div class="d ${below ? 'dn' : 'up'}">${below ? 'Action needed' : 'All covered'}</div>`, s: [1, 1, 0, 2, 1, 1, below], c: '#c0262d', tag: 'MARD, MARC' })}
      ${kpi({ l: 'Supplier on-time in-full', v: fmt(rows.reduce((a, r) => a + r.otif, 0) / rows.length, 1), u: '%', d: '<div class="d nu">target 92%</div>', s: [91, 90.5, 91.2, 90.8, 90, 90.6, 90.9], c: '#0f766e', tag: 'EKBE' })}</div>
      ${card('Stock cover by material', table('mats', [{ k: 'n', l: 'Material', f: r => `<b>${r.n}</b><div class="sub" style="font-size:11.5px">${r.grp}</div>` }, { k: 'cov', l: 'Cover (days) vs band', sv: r => r.cov, f: r => { const mx = r.max * 1.4, p = v => Math.min(100, v / mx * 100); return `<div style="min-width:190px"><div class="bar"><i style="left:${p(r.min)}%;width:${p(r.max) - p(r.min)}%;background:#cfe8d7"></i><i style="left:calc(${p(r.cov)}% - 3px);width:6px;background:${r.s === 'bad' ? '#d6453d' : r.s === 'warn' ? '#d9892b' : '#2e9d57'}"></i></div><div class="sub" style="font-size:11.5px">${fmt(r.cov, 0)} days · band ${r.min}–${r.max}</div></div>`; } }, { k: 'val', l: 'Stock ₹ Cr', n: 1, f: r => fmt(r.val, 0) }, { k: 'po', l: 'Open POs', n: 1 }, { k: 'otif', l: 'Supplier OTIF', n: 1, f: r => `<span style="color:${r.otif < 85 ? 'var(--bad)' : 'inherit'}">${fmt(r.otif, 1)}%</span>` }, { k: 's', l: 'Status', sv: r => r.s === 'bad' ? 3 : r.s === 'warn' ? 2 : 1, f: r => r.s === 'bad' ? pill('Below min', 'bad') : r.s === 'warn' ? pill('Excess', 'warn') : pill('OK', 'good') }], rows, { def: 's' }), { tag: 'MARD, EKKO, EKBE', note: 'Green band = target cover. Glass is the usual bottleneck at festive peak; molasses is seasonal.' })}
      <div class="grid g2" style="margin-top:14px">${card('Input price index (Apr 2025 = 100)', lineChart({ labels: D.months.map(m => m.label), mark: i, zero: false, fy: v => fmt(v, 0), series: [{ n: 'Grain', c: '#b45309', d: D.priceIdx.Grain }, { n: 'Glass', c: '#1d5fb4', d: D.priceIdx.Glass }, { n: 'Molasses', c: '#16a34a', d: D.priceIdx.Molasses }, { n: 'PET resin', c: '#7e22ce', d: D.priceIdx['PET resin'] }, { n: 'Malt', c: '#64748b', d: D.priceIdx.Malt }] }), { tag: 'Commodity feed + PO prices', note: 'Non-SAP commodity feed joined to PO prices in the lake.' })}
      ${card('Maturing spirit by age (lakh bulk litres)', colChart({ labels: D.cask.map(c => c[0]), series: [{ n: 'Lakh BL', c: '#b45309', d: D.cask.map(c => c[1]) }], noleg: true, ft: v => fmt(v, 1) + ' lakh BL', fy: v => fmt(v, 0) }), { tag: 'MCHB batch stock', note: 'Whisky, rum and brandy ageing in cask: about 2% a year is lost to evaporation.' })}</div>`;
  };

  V.distribution = () => {
    const i = st.mi, TL = ['Market coverage', 'Excise & compliance'], t = curTab('distribution', TL), S = D.stat;
    let body = '';
    if (t === 'Market coverage') {
      const so = S.reduce((a, s) => a + s.stockouts, 0), out = D.states.reduce((a, s) => a + s.outlets, 0);
      body = `<div class="grid g4" style="margin-bottom:14px">${kpi({ l: 'Retail touchpoints', v: fmt(out / 1000, 0) + 'k', u: '', d: '<div class="d nu">30+ states and UTs (incl. restricted)</div>', s: [74, 75, 76, 77, 78, 79, 80], tag: 'DMS' })}
        ${kpi({ l: 'Numeric distribution', v: fmt(avg(S.map(s => s.nd), 0, S.length - 1), 1), u: '%', d: '<div class="d up">▲ 0.8 pts vs last month</div>', s: [66, 66.5, 67, 67.6, 68, 68.4, 69], c: '#0f766e', tag: 'DMS' })}
        ${kpi({ l: 'Order fill rate', v: fmt(avg(S.map(s => s.fill), 0, S.length - 1), 1), u: '%', d: '<div class="d nu">target 96%</div>', s: [95, 94.8, 95.4, 94.9, 95.1, 94.6, 94.9], c: '#1d5fb4', tag: 'LIPS, VBRP' })}
        ${kpi({ l: 'Depots with stock-outs', v: so, u: '', d: '<div class="d dn">UP worst: 7 depots</div>', s: [18, 22, 19, 25, 21, 24, so], c: '#c0262d', tag: 'MARD, DMS' })}</div>
        ${card('State scorecard', table('states', [{ k: 'name', l: 'State', f: r => `<b>${r.name}</b>` }, { k: 'cases', l: 'Lakh cases', n: 1, f: r => fmt(r.cases, 2) }, { k: 'out', l: 'Outlets', n: 1, f: r => fmt(r.out, 0) }, { k: 'nd', l: 'Num. dist.', n: 1, f: r => fmt(r.nd, 0) + '%' }, { k: 'fill', l: 'Fill rate', n: 1, f: r => `<span style="color:${r.fill < 92 ? 'var(--bad)' : 'inherit'}">${fmt(r.fill, 1)}%</span>` }, { k: 'dsd', l: 'Distributor stock (days)', n: 1, f: r => fmt(r.dsd, 0) }, { k: 'sp', l: 'Secondary / primary', n: 1, f: r => fmt(r.sp, 2) }, { k: 'so', l: 'Stock-outs', n: 1, f: r => r.so ? pill(r.so, r.so > 4 ? 'bad' : 'warn') : pill('0', 'good') }], D.states.map(s => { const x = S.find(y => y.code === s.code); return { name: s.name, cases: stateCases(i).find(y => y.s.code === s.code).v, out: s.outlets, nd: x.nd, fill: x.fill, dsd: x.dsd, sp: x.secPri, so: x.stockouts }; }), { def: 'cases' }), { tag: 'VBRP + distributor feed', note: 'Secondary / primary above 1 means distributors are selling more than they are buying: restock soon.' })}`;
    } else {
      const dty = F.duty, [a, z] = ytd(i), tot = sum(dty, a, z), permits = S.reduce((x, s) => x + s.permits, 0), lab = S.reduce((x, s) => x + s.labels, 0), mrp = S.filter(s => s.mrp === 'Pending').length;
      body = `<div class="grid g4" style="margin-bottom:14px">${kpi({ l: 'Duty & taxes paid YTD', v: fmt(tot, 0), u: '₹ Cr', d: dl(i >= 12 ? pc(tot, sum(dty, 0, i - 12)) : null, true, 'vs PY YTD'), s: lastN(dty, i), c: '#b45309', tag: 'Excise ledger' })}
        ${kpi({ l: 'Transport permits pending', v: permits, u: '', d: '<div class="d dn">MH has 12</div>', s: [41, 46, 39, 52, 44, 49, permits], c: '#c0262d', tag: 'Permit Z-tables' })}
        ${kpi({ l: 'Label registrations open', v: lab, u: '', d: '<div class="d nu">new brand / size / state</div>', s: [20, 24, 22, 19, 21, 23, lab], c: '#7c3aed', tag: 'Registration Z-tables' })}
        ${kpi({ l: 'MRP notifications pending', v: mrp, u: 'states', d: '<div class="d nu">price revisions awaiting approval</div>', s: [3, 2, 4, 3, 3, 2, mrp], c: '#0f766e', tag: 'Price notifications' })}</div>
        <div class="grid g2">${card('Duty & taxes paid by state, FY YTD (₹ Cr)', hbars(S.map(s => ({ n: s.name, v: s.dutyShare * tot, c: '#b45309', t: fmt(s.dutyShare * tot, 0) })).sort((x, y) => y.v - x.v).slice(0, 12)), { tag: 'Excise ledger', note: 'Top 12 states. State-wise duty differs by slab and pack size.' })}
        ${card('Compliance tracker', table('stat', [{ k: 'name', l: 'State', f: r => `<b>${r.name}</b>` }, { k: 'permits', l: 'Permits open', n: 1, f: r => r.permits > 8 ? pill(r.permits, 'bad') : r.permits }, { k: 'labels', l: 'Labels open', n: 1 }, { k: 'mrp', l: 'MRP notification', f: r => pill(r.mrp, r.mrp === 'Approved' ? 'good' : r.mrp === 'Filed' ? 'warn' : 'bad') }, { k: 'dueDays', l: 'Next duty due (days)', n: 1 }], S, { def: 'permits' }), { tag: 'Z-tables, state portals', note: 'This is the layer standard SAP does not give you: one view across state-specific rules.' })}</div>`;
    }
    return head('Distribution & Excise Dashboard', 'SAP S/4HANA SD', { ins: 'distribution' }) + tabs('distribution', TL) + body;
  };

  V.quality = () => {
    const i = st.mi, q = qmetrics(i), hold = q.reduce((a, x) => a + x.hold, 0), bt = q.reduce((a, x) => a + x.b, 0), rej = q.reduce((a, x) => a + x.rej, 0), d = q.filter(x => x.dist), lbl = D.months.map(m => m.label);
    const hist = D.months.map(m => { const z = qmetrics(m.i); return 100 - z.reduce((a, x) => a + x.hold + x.rej, 0) / z.reduce((a, x) => a + x.b, 0) * 100; });
    return head('Quality & EHS Dashboard', 'SAP S/4HANA QM', { ins: 'quality' }) + `<div class="grid g4" style="margin-bottom:14px">
      ${kpi({ l: 'Batches released', v: fmt(bt - hold - rej, 0), u: 'of ' + fmt(bt, 0), d: dl(null), s: lastN(hist, i), c: '#0f766e', tag: 'QALS' })}
      ${kpi({ l: 'First-pass yield', v: fmt(100 - (hold + rej) / bt * 100, 1), u: '%', d: '<div class="d nu">target 97.5%</div>', s: lastN(hist, i), tag: 'QAVE usage decisions' })}
      ${kpi({ l: 'Consumer complaints', v: '0.62', u: 'per million bottles', d: '<div class="d up">▼ 0.08 vs last month</div>', s: [.8, .74, .77, .7, .66, .7, .62], c: '#7c3aed', tag: 'QMEL' })}
      ${kpi({ l: 'Lost-time injury rate', v: '0.41', u: 'LTIFR', d: '<div class="d up">▼ 0.05 vs last month</div>', s: [.6, .55, .5, .52, .46, .46, .41], c: '#c0262d', tag: 'EHS incidents' })}</div>
      <div class="grid g2" style="margin-bottom:14px">${card('Quality by plant', table('q', [{ k: 'n', l: 'Plant', f: r => `<b>${r.n}</b>` }, { k: 'b', l: 'Batches', n: 1 }, { k: 'hold', l: 'Held', n: 1, f: r => r.hold > r.b * .035 ? pill(r.hold, 'bad') : r.hold }, { k: 'rej', l: 'Rejected', n: 1 }, { k: 'fpy', l: 'First pass', n: 1, f: r => fmt(r.fpy, 1) + '%' }, { k: 'abv', l: 'ABV deviation', n: 1, f: r => (r.abv >= 0 ? '+' : '') + fmt(r.abv, 2) + ' %vol' }], q, { def: 'hold' }), { tag: 'QALS, QAMV', note: 'ABV is checked against label strength; ±0.3 %vol is tolerance.' })}
      ${card('Distillery effluent (spent wash treatment)', d.map(x => `<div style="margin:14px 0"><div style="display:flex;justify-content:space-between"><b>${x.n}</b><span>${fmt(x.cod, 0)} mg/L COD ${pill(x.cod > 200 ? 'Near limit' : 'OK', x.cod > 200 ? 'warn' : 'good')}</span></div><div class="bar" style="margin-top:6px"><i style="left:0;width:${x.cod / 250 * 100}%;background:${x.cod > 200 ? '#d9892b' : '#2e9d57'}"></i></div><div class="sub" style="font-size:11.5px">Consent limit 250 mg/L</div></div>`).join(''), { tag: 'Historian + lab', note: 'Treated-effluent readings come from the plant historian, not SAP: only possible because the lake joins both.' })}</div>
      ${card('First-pass yield trend', lineChart({ labels: lbl, mark: i, zero: false, fy: v => fmt(v, 1) + '%', series: [{ n: 'All plants', c: '#0f766e', d: hist }, { n: 'Target', c: '#94a3b8', dash: 1, d: lbl.map(() => 97.5) }] }), { tag: 'QALS, QAVE' })}`;
  };

  V.lake = () => {
    const ok = r => r.age < (r.cad.indexOf('15') > -1 ? 1 : r.cad === 'Hourly' ? 2 : r.cad === 'Every 4 h' ? 6 : 24);
    return `<div class="head"><h1>Data lake &amp; sync</h1><span class="chip">● Last full sync ${D.asOf}</span></div>
    <div class="card" style="margin-bottom:14px"><div class="ch"><h2>How it works</h2></div><div class="flow">
      <div class="bx sap"><b>SAP S/4HANA</b><span class="sub">System of record. Posting, approvals, e-challans, payment runs stay here.</span></div><div class="ar">→</div>
      <div class="bx sap"><b>Change capture</b><span class="sub">Delta replication of tables and CDS views, hourly to daily. No dashboard queries hit SAP.</span></div><div class="ar">→</div>
      <div class="bx lk"><b>Data lake</b><span class="sub">Bronze (raw) → Silver (cleaned) → Gold (business models). Open table format on object storage.</span></div><div class="ar">→</div>
      <div class="bx ap"><b>Semantic layer &amp; API</b><span class="sub">Business definitions once: net revenue, OEE, cover days. Role-based access.</span></div><div class="ar">→</div>
      <div class="bx ap"><b>Custom ABD app</b><span class="sub">This dashboard. Web, any device; read-only users need no SAP licence.</span></div></div>
      <div class="grid g3" style="margin-top:14px"><div class="note" style="margin:0"><b>Stays real-time in SAP</b><br>Order entry, goods issue, payments, excise e-challan generation, anything that writes.</div><div class="note" style="margin:0"><b>Moves to the lake</b><br>History, trends, cross-plant and cross-state analysis, planning views, anything read-only that can be minutes to hours old.</div><div class="note" style="margin:0"><b>Joins what SAP does not have</b><br>Distributor sales, plant historians, commodity prices, weather, state portals.</div></div></div>
    <div class="card" style="margin-bottom:14px"><div class="ch"><h2>What is synced</h2><span class="sp"></span><span class="chip">${D.lake.length} sources</span></div>${table('lake', [{ k: 'dom', l: 'Domain', f: r => `<b>${r.dom}</b>` }, { k: 'src', l: 'SAP tables / source' }, { k: 'desc', l: 'Content' }, { k: 'rows', l: 'Rows', n: 1 }, { k: 'cad', l: 'Cadence' }, { k: 'mode', l: 'Mode' }, { k: 'age', l: 'Last sync', n: 1, f: r => fmt(r.age, 1) + ' h ago' }, { k: 'ok', l: 'Status', sv: r => ok(r) ? 1 : 0, f: r => pill(ok(r) ? 'Fresh' : 'Delayed', ok(r) ? 'good' : 'warn') }], D.lake, { def: 'dom' })}<div class="note">Table list is the typical SAP footprint for a distillery. We confirm the exact scope and the extraction method with ABD IT and SAP licensing.</div></div>`;
  };

  V.fit = () => {
    const rows = [
      ['Excise and state rules are different in every state', '17 states, each with its own permits, label registration, MRP notification and duty slabs', 'Distribution & Excise app: one tracker across states, due dates, variance to the duty ledger', 'Excise Z-tables, e-challan feed, state portals'],
      ['41 facilities: bottling units, distilleries, a PET plant', 'No single plant comparison; OEE and downtime live in separate sheets', 'Plant & Distillery Ops: scorecard, yield, steam and water per litre', 'AFKO / AUFM + SCADA historian'],
      ['Grain, molasses, glass and PET prices swing', 'Cost inflation shows up late in the P&L', 'Supply & Inventory: cover by material, input price index next to PO prices', 'EKKO / EKBE + commodity feed'],
      ['Spirit matures for years before it is sold', 'Working capital is high; cask stock hard to see by age', 'Maturation view: stock by age band, angel’s-share loss, cost build-up', 'MCHB batches, CO'],
      ['Fast brand launches (ICONiQ, Rangeela, Zoya, Woodburns...)', 'No quick answer on which launch works in which state', 'Sales & Brand: brand leaderboard, premium mix, category by region', 'VBRP + DMS secondary sales'],
      ['80,000+ retail touchpoints through distributors', 'Primary sales are visible, secondary sales and stock-outs are not', 'Market coverage: numeric distribution, fill rate, distributor days of stock', 'Distributor management feed'],
      ['Distillery effluent and water rules', 'Compliance data sits in plant systems, not SAP', 'Quality & EHS: spent-wash COD against consent limit, LTIFR', 'Historian + QM']];
    return `<div class="head"><h1>Solution fit for ABD</h1><span class="chip">Proposal view</span></div>
    <div class="card" style="margin-bottom:14px"><div class="ch"><h2>The idea in one line</h2></div><p style="margin:0;font-size:15px">Keep SAP S/4HANA as the transaction system. Sync everything that does not need to be real-time into a data lake. Build one ABD-branded analytics app on top, so the many read-only users (sales heads, plant managers, finance, compliance) need no SAP licence.</p></div>
    <div class="card" style="margin-bottom:14px"><div class="ch"><h2>What is specific to a spirits business</h2></div><div class="scroll"><table class="fit"><thead><tr><th>ABD reality</th><th>Today's pain</th><th>What the app shows</th><th>Source</th></tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
    <div class="grid g2"><div class="card"><div class="ch"><h2>Suggested phases</h2></div><div class="list">${[['Phase 1 · 8–10 weeks', 'Sales & Brand, Finance, Distribution & Excise. Lake foundation, 8 core SAP domains.'], ['Phase 2 · +8 weeks', 'Plant & Distillery Ops, Supply & Inventory, Quality & EHS. Historian and DMS feeds.'], ['Phase 3 · ongoing', 'Forecasting, price and demand models, natural-language Q&A, mobile alerts.']].map(x => `<div class="it"><span class="dot good"></span><div><b>${x[0]}</b><div class="sub">${x[1]}</div></div></div>`).join('')}</div></div>
    <div class="card"><div class="ch"><h2>Questions to settle with ABD</h2></div><div class="list">${['Which SAP version and which modules are live (S/4HANA, ECC, or a mix)?', 'Extraction method that stays inside ABD’s SAP licence terms (confirm with SAP; some older RFC-based methods are restricted for third-party tools).', 'Who the read-only users are, and how many.', 'Is secondary-sales (distributor) data available electronically?', 'Cloud and data-residency preference for the lake.'].map(x => `<div class="it"><span class="dot warn"></span><div>${x}</div></div>`).join('')}</div></div></div>
    <div class="note">Everything in this demo is mock data. Brand and plant names come from abdindia.com; numbers are invented.</div>`;
  };

  /* ---------- AI (rule-based over the same data) ---------- */
  function ask(q) {
    const l = q.toLowerCase(), i = st.mi, M = D.months[i].long;
    const li = a => '<ul style="margin:6px 0 0;padding-left:18px">' + a.map(x => `<li>${x}</li>`).join('') + '</ul>';
    if (/plant|oee|watch|downtime/.test(l)) { const r = plantRows(i).sort((a, b) => a.oee - b.oee).slice(0, 4); return `<b>Plants in the watch band (OEE under 66%) in ${M}:</b>${li(r.map(x => `${x.n} (${x.st}): OEE ${fmt(x.oee, 1)}%, ${fmt(x.down, 0)} downtime hrs, scrap ${fmt(x.scrap, 1)}%`))}<div class="note">Source: lake tables AFKO, AUFM + historian. <a href="#/production">Open Plant Ops</a></div>`; }
    if (/iconiq|growing|brand|launch/.test(l)) { const b = D.brands.map(x => ({ n: x.n, g: pc(sum(x.rev, 12, i), sum(x.rev, 0, i - 12)) })).sort((a, b) => b.g - a.g).slice(0, 4); return `<b>Fastest-growing brands, FY year to date:</b>${li(b.map(x => `${x.n}: +${fmt(x.g, 0)}%`))}<div class="note">ICONiQ White leads the volume gain among the larger brands. <a href="#/exec">Open Sales &amp; Brand</a></div>`; }
    if (/material|stock|cover|glass|grain|inventory/.test(l)) { const r = mat.map(m => ({ m, s: matStatus(m, i) })).filter(x => x.s.s === 'bad'); return r.length ? `<b>Below minimum cover:</b>${li(r.map(x => `${x.m.n}: ${fmt(x.s.c, 0)} days vs min ${x.m.min} (${x.m.po} open POs)`))}<div class="note"><a href="#/supply">Open Supply &amp; Inventory</a></div>` : 'All materials are within their cover band.'; }
    if (/excise|permit|state|compliance/.test(l)) { const r = D.stat.slice().sort((a, b) => b.permits - a.permits).slice(0, 4); return `<b>States with most transport permits pending:</b>${li(r.map(x => `${x.name}: ${x.permits} permits, ${x.labels} label registrations, MRP ${x.mrp.toLowerCase()}`))}<div class="note"><a href="#/distribution">Open Distribution &amp; Excise</a></div>`; }
    if (/summar|month|performance|overview/.test(l)) { const s = statuses(i); return `<b>${M} in brief:</b>${li([`Net revenue ₹${fmt(F.rev[i], 0)} Cr (${fmt(pc(F.rev[i], F.budget[i]), 1)}% vs budget), ${fmt(D.total.cases[i], 1)} lakh cases.`, `EBITDA margin ${fmt(F.ebitda[i] / F.rev[i] * 100, 1)}%.`, ...APPS.filter(a => s[a.id].s !== 'good').map(a => `${a.n}: ${s[a.id].msg}`)])}`; }
    return 'I can answer questions about plants, brands, materials, excise or a monthly summary. Try one of the suggestions above.';
  }

  /* ---------- shell / router ---------- */
  const NAV = [['home', 'Home', '⌂'], ...APPS.map(a => [a.r, a.n, a.ic]), ['ai', 'AI Control Center', '✦'], ['lake', 'Data lake & sync', '☁'], ['fit', 'Solution fit', '★']];
  function nav(route) {
    const s = statuses(st.mi);
    $('#side').innerHTML = NAV.map(n => { const a = APPS.find(x => x.r === n[0]), b = a && s[a.id].s !== 'good' ? `<b>${{ fin: 12, sup: 2, prod: 3, proj: 5 }[a.id] || '!'}</b>` : ''; return `${n[0] === 'lake' ? '<h6>Platform</h6>' : n[0] === 'exec' ? '<h6>Apps</h6>' : ''}<a href="#/${n[0]}" class="${n[0] === route ? 'on' : ''}"><span class="ic">${n[2]}</span>${n[1]}${b}</a>`; }).join('');
  }
  function render() {
    const route = (location.hash.replace('#/', '') || 'home').split('?')[0], v = V[route] || V.home, keepScroll = window.scrollY;
    nav(V[route] ? route : 'home'); $('#view').innerHTML = v(); $('#side').classList.remove('open');
    window.scrollTo(0, keepScroll);
  }
  addEventListener('hashchange', () => { window.scrollTo(0, 0); render(); });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-tab],[data-sort],[data-route],[data-ask],[data-go],[data-export]');
    if (!t) return;
    if (t.dataset.export) exportCSV();
    else if (t.dataset.tab) { const [r, v] = t.dataset.tab.split('|'); st.tab[r] = v; render(); }
    else if (t.dataset.sort) { const [id, k] = t.dataset.sort.split('|'), c = st.sort[id]; st.sort[id] = { k, d: c && c.k === k ? -c.d : -1 }; render(); }
    else if (t.dataset.route) location.hash = '#/' + t.dataset.route;
    else if (t.dataset.ask) { render(); const q = t.dataset.ask; $('#askq').value = q; $('#ans').innerHTML = `<div class="ans">${ask(q)}</div>`; }
    else if (t.dataset.go) toast(`In the live system this opens the ${t.dataset.go} Fiori app for the same records. Only people who fix things in SAP need a licence for it.`);
  });
  document.addEventListener('change', e => { const k = e.target.dataset.set; if (!k) return; st[k] = k === 'mi' ? +e.target.value : e.target.value; render(); });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'askq') $('#ans').innerHTML = `<div class="ans">${ask(e.target.value)}</div>`; });
  const tip = $('#tip');
  document.addEventListener('mousemove', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (!t) { tip.style.display = 'none'; return; } tip.innerHTML = t.dataset.tip.split('\n').map((x, k) => k ? x : `<b>${x}</b>`).join('<br>'); tip.style.display = 'block'; tip.style.left = Math.min(e.clientX + 14, innerWidth - 270) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; });
  let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(tt); tt = setTimeout(() => t.style.display = 'none', 4200); }
  $('#burger').onclick = () => $('#side').classList.toggle('open');
  render();
})();
