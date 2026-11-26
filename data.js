/* ABD Enterprise Platform - MOCK DATA (illustrative, deterministic). Brand/plant names from abdindia.com; every number is invented for the demo. */
(function () {
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = rng(20261126);
  const rn = (a, b) => a + (b - a) * R();
  // stable hash random, so any (key) gives the same value every load
  function hr() { let h = 2166136261; const s = Array.prototype.join.call(arguments, '|'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }

  const ML = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const months = [];
  for (let i = 0; i < 19; i++) { const m = ML[i % 12], y = 2025 + Math.floor((i + 3) / 12); months.push({ i, m, y, label: m + ' ' + String(y).slice(2), long: m + ' ' + y, fy: i < 12 ? 'FY26' : 'FY27' }); }
  const SEAS = [1.0, 0.97, 0.95, 0.9, 0.92, 1.02, 1.12, 1.18, 1.22, 0.98, 0.96, 1.1];

  const CATS = ['Whisky', 'Brandy', 'Rum', 'Vodka', 'Gin'];
  const CCOL = { Whisky: '#c2410c', Brandy: '#7e22ce', Rum: '#0f766e', Vodka: '#2563eb', Gin: '#16a34a' };
  // v = base lakh cases / month, p = net realisation Rs/case, g = monthly growth
  const B = [
    ["Officer's Choice Blue", 'Whisky', 9.0, 3800, .008], ['Sterling Reserve', 'Whisky', 3.2, 6500, .010], ['ICONiQ White', 'Whisky', 4.0, 5200, .028],
    ['Woodburns', 'Whisky', .5, 11000, .02], ['Arthaus', 'Whisky', .15, 16000, .03], ['The Indian Edit', 'Whisky', .05, 12500, .06],
    ["Officer's Choice Brandy", 'Brandy', 5.5, 3300, .004], ['Kyron', 'Brandy', .3, 9000, .02], ['Golden Mist', 'Brandy', .1, 8000, .03],
    ["Officer's Choice Rum", 'Rum', 1.1, 2900, .006], ['Jolly Roger', 'Rum', .5, 3200, .01], ['Segredo Aldeia', 'Rum', .08, 14000, .03],
    ['Class 21', 'Vodka', 1.4, 3600, .005], ['Rangeela', 'Vodka', .25, 6000, .05], ['Russian Standard', 'Vodka', .1, 7500, .03],
    ['Zoya', 'Gin', .35, 7000, .035], ['Pumori', 'Gin', .12, 9500, .025]
  ];
  const SC = 0.25;
  const brands = B.map(b => {
    const cases = [], rev = [];
    for (let i = 0; i < 19; i++) {
      const c = b[2] * SC * SEAS[i % 12] * (1 + b[4] * i) * (1 + rn(-.03, .03));
      cases.push(c); rev.push(c * b[3] * (1 + .002 * i) / 100); // Rs Cr
    }
    return { n: b[0], c: b[1], cases, rev };
  });
  const zero = () => new Array(19).fill(0);
  const total = { cases: zero(), rev: zero() };
  const cats = {};
  CATS.forEach(c => cats[c] = { cases: zero(), rev: zero() });
  brands.forEach(b => b.cases.forEach((v, i) => { cats[b.c].cases[i] += v; cats[b.c].rev[i] += b.rev[i]; total.cases[i] += v; total.rev[i] += b.rev[i]; }));

  // channels
  const channels = [
    { n: 'Domestic retail (state-wise)', s: .81, c: '#2563eb' }, { n: 'Defence canteens (CSD)', s: .06, c: '#0f766e' },
    { n: 'Export (39 countries)', s: .10, c: '#c2410c' }, { n: 'Duty free', s: .03, c: '#7e22ce' }];

  // states (alcohol-restricted states excluded)
  const S = [
    ['MH', 'Maharashtra', .14, 'West'], ['UP', 'Uttar Pradesh', .12, 'North'], ['AP', 'Andhra Pradesh', .10, 'South'], ['TS', 'Telangana', .09, 'South'],
    ['KA', 'Karnataka', .07, 'South'], ['WB', 'West Bengal', .06, 'East'], ['RJ', 'Rajasthan', .06, 'North'], ['HR', 'Haryana', .05, 'North'],
    ['MP', 'Madhya Pradesh', .05, 'Central'], ['PB', 'Punjab', .04, 'North'], ['KL', 'Kerala', .04, 'South'], ['OD', 'Odisha', .04, 'East'],
    ['CG', 'Chhattisgarh', .03, 'Central'], ['AS', 'Assam', .03, 'East'], ['DL', 'Delhi', .03, 'North'], ['JH', 'Jharkhand', .03, 'East'], ['GA', 'Goa', .02, 'West']];
  const southish = { AP: 1, TS: 1, KA: 1, KL: 1, GA: 1 };
  const states = S.map(s => {
    const share = {};
    CATS.forEach(c => { let t = .7 + hr(s[0], c) * .6; if (c === 'Brandy' && southish[s[0]]) t *= 1.5; if (c === 'Gin' && (s[0] === 'MH' || s[0] === 'KA' || s[0] === 'DL' || s[0] === 'GA')) t *= 2; if (c === 'Whisky' && s[3] === 'North') t *= 1.2; share[c] = s[2] * t; });
    return { code: s[0], name: s[1], w: s[2], region: s[3], share, depots: Math.max(2, Math.round(s[2] * 70)), outlets: Math.round(s[2] * 80000 * (.9 + hr(s[0], 'o') * .2)) };
  });
  CATS.forEach(c => { const t = states.reduce((a, s) => a + s.share[c], 0); states.forEach(s => s.share[c] /= t); });

  // plants (locations from abdindia.com/operations; roles & capacities invented)
  const plants = [
    ['AUR', 'Aurangabad', 'MH', 'Distillery + bottling', .14], ['RAN', 'Rangapur', 'TS', 'Distillery + PET plant', .10], ['HYD', 'Hyderabad', 'TS', 'Bottling', .07],
    ['DER', 'Derabassi', 'PB', 'Bottling', .07], ['AMB', 'Ambala', 'HR', 'Bottling', .06], ['CHH', 'Chhindwara', 'MP', 'Bottling', .06], ['DHA', 'Dhanbad', 'JH', 'Bottling', .04],
    ['KAL', 'Kalyani', 'WB', 'Bottling', .07], ['HAR', 'Haridwar', 'UK', 'Bottling', .05], ['HAP', 'Hapur', 'UP', 'Bottling', .09], ['JOD', 'Jodhpur', 'RJ', 'Bottling', .06],
    ['BIL', 'Bilaspur', 'CG', 'Bottling', .04], ['SAN', 'Sangli', 'MH', 'Bottling', .05], ['BEL', 'Belagavi', 'KA', 'Bottling', .05], ['PON', 'Ponda', 'GA', 'Bottling', .02],
    ['KOC', 'Kochi', 'KL', 'Bottling', .03], ['CHI', 'Chittoor', 'AP', 'Bottling', .06], ['GUW', 'Guwahati', 'AS', 'Bottling', .03], ['SAM', 'Sambalpur', 'OD', 'Bottling', .04]
  ].map(p => ({ id: p[0], n: p[1], st: p[2], t: p[3], w: p[4], dist: /Distillery/.test(p[3]) }));
  const pw = plants.reduce((a, p) => a + p.w, 0); plants.forEach(p => p.w /= pw);
  const plantMonth = (p, i) => {
    const bottled = total.cases[i] * p.w * (.94 + hr(p.id, i, 'b') * .12) * 1.015;       // lakh cases
    const cap = total.cases[18] * p.w * 1.28;
    let oee = 66 + hr(p.id, 'o') * 12 + (hr(p.id, i, 'oo') - .5) * 7;
    if (p.id === 'DHA' && i >= 15) oee -= 9; if (p.id === 'KOC' && i === 18) oee -= 8;  // storylines
    const down = Math.max(8, 70 - oee * .55 + hr(p.id, i, 'd') * 14);
    return { bottled, cap, util: bottled / cap * 100, oee, down, scrap: .5 + (80 - oee) * .05 + hr(p.id, i, 's') * .3, yield: 0 };
  };
  // distillery series (ENA, lakh BL)
  const dist = ['AUR', 'RAN'].map(id => {
    const ena = [], yld = [], steam = [], water = [];
    for (let i = 0; i < 19; i++) {
      ena.push((id === 'AUR' ? 27 : 31) * (.96 + hr(id, i, 'e') * .08) * (1 + .003 * i));
      yld.push(id === 'AUR' ? 428 + (hr(id, i, 'y') - .5) * 14 - (i > 14 ? 6 : 0) : 436 + (hr(id, i, 'y') - .5) * 10);
      steam.push(3.1 + hr(id, i, 's') * .5 + (id === 'AUR' && i > 14 ? .3 : 0));
      water.push(3.2 + hr(id, i, 'w') * .5);
    }
    return { id, n: id === 'AUR' ? 'Aurangabad' : 'Rangapur', ena, yld, steam, water };
  });

  // finance
  const fin = { rev: total.rev, budget: [], cogs: [], ap: [], emp: [], oth: [], ebitda: [], dep: [], int: [], pat: [], duty: [], recv: [], inv: [], pay: [], debt: [], cash: [], equity: [], assets: [], dso: [], dio: [], dpo: [] };
  let eq = 1480;
  for (let i = 0; i < 19; i++) {
    const rev = total.rev[i], f = SEAS[i % 12];
    fin.budget.push(rev / (1 + rn(-.035, .05)));
    const cp = .585 + .0013 * i + rn(-.006, .006);
    const cogs = rev * cp, ap = rev * (f > 1.1 ? .135 : .105), emp = 14 * (1 + .004 * i), oth = rev * .08;
    const e = rev - cogs - ap - emp - oth, dep = rev * .022, int = (940 - 4 * i) * .092 / 12, pbt = e - dep - int, pat = pbt * .75;
    fin.cogs.push(cogs); fin.ap.push(ap); fin.emp.push(emp); fin.oth.push(oth); fin.ebitda.push(e); fin.dep.push(dep); fin.int.push(int); fin.pat.push(pat);
    fin.duty.push(rev * (.9 + rn(-.03, .03)));
    const dso = 21 + rn(-2, 2) + (i === 18 ? 3 : 0), dio = 96 + rn(-4, 4), dpo = 54 + rn(-3, 3);
    fin.dso.push(dso); fin.dio.push(dio); fin.dpo.push(dpo);
    fin.recv.push(rev * dso / 30); fin.inv.push(cogs * dio / 30); fin.pay.push(cogs * dpo / 30);
    fin.debt.push(940 - 4 * i + rn(-8, 8)); fin.cash.push(150 + 3 * i + rn(-25, 25)); eq += pat; fin.equity.push(eq);
    fin.assets.push(eq + fin.debt[i] + fin.pay[i] + 95);
  }
  const finEx = [
    ['GR/IR clearing mismatch', 'MM-FI', 'Hyderabad', 18.4, 'High', 6], ['Excise duty ledger vs e-challan variance', 'Excise', 'Maharashtra', 6.2, 'High', 4],
    ['Vendor invoices parked > 15 days', 'AP', 'Sangli', 3.1, 'Med', 12], ['Customer unapplied receipts', 'AR', 'Uttar Pradesh', 9.7, 'Med', 9],
    ['Intercompany mismatch (ABD Maestro)', 'FI-IC', 'Corporate', 4.4, 'Med', 3], ['Accrual not booked: freight', 'GL', 'Haridwar', 2.2, 'Low', 5],
    ['Cask maturation cost not capitalised', 'CO', 'Rangapur', 7.8, 'High', 2], ['Bank statement unmatched items', 'Bank', 'Corporate', 1.9, 'Low', 17],
    ['PET unit transfer price variance', 'CO', 'Rangapur', 5.3, 'Med', 2], ['Asset under construction not settled', 'FI-AA', 'Andhra Pradesh', 11.6, 'Med', 1],
    ['State sales-tax / GST credit mismatch', 'Tax', 'Punjab', 2.8, 'Low', 8], ['Scrap sales posting missing', 'MM', 'Belagavi', .9, 'Low', 3]
  ].map(r => ({ t: r[0], mod: r[1], loc: r[2], amt: r[3], sev: r[4], n: r[5] }));
  const closeTasks = [['Goods receipt cut-off', 'Done'], ['Excise ledger reconciliation (17 states)', 'Done'], ['Depot stock confirmation', 'Done'], ['Freight & scheme accruals', 'In progress'],
    ['Intercompany reconciliation', 'In progress'], ['Inventory valuation (incl. maturing stock)', 'In progress'], ['Bank reconciliation (5 banks)', 'In progress'], ['Management review & lock', 'Pending']];

  // materials
  const mats = [
    ['ENA (own + purchased)', 'lakh BL', 12, 25, 18, 126, 14, 95.2, 'Alcohol'], ['Grain (rice / maize)', 'kt', 20, 40, 31, 88, 22, 91.4, 'Alcohol'], ['Malt (barley)', 'kt', 30, 60, 52, 41, 6, 94.0, 'Alcohol'],
    ['Molasses', 'kt', 10, 25, 7, 18, 5, 82.5, 'Alcohol'], ['Glass bottles 750 ml', 'mn units', 14, 28, 9, 64, 31, 78.3, 'Packaging'], ['Glass bottles 180 ml', 'mn units', 14, 28, 21, 47, 19, 86.9, 'Packaging'],
    ['PET bottles / preforms (own plant)', 'mn units', 6, 15, 11, 22, 8, 97.1, 'Packaging'], ['Closures / caps', 'mn units', 15, 35, 24, 12, 9, 92.8, 'Packaging'], ['Labels & cartons', 'mn units', 12, 30, 19, 29, 17, 89.6, 'Packaging'],
    ['Botanicals / juniper (gin)', 'kg', 20, 60, 44, 3.2, 4, 90.0, 'Flavour'], ['Caramel / colour', 'kt', 15, 40, 29, 5.5, 3, 93.5, 'Flavour'], ['Oak casks (new + reused)', 'units', 30, 90, 70, 31, 3, 96.0, 'Maturation']
  ].map(m => ({ n: m[0], uom: m[1], min: m[2], max: m[3], cover: m[4], val: m[5], po: m[6], otif: m[7], grp: m[8] }));
  const cask = [['< 1 yr', 18.5], ['1–3 yr', 14.2], ['3–5 yr', 9.8], ['5–8 yr', 5.1], ['8 yr +', 2.4]];
  const priceIdx = { Grain: [], Glass: [], Molasses: [], 'PET resin': [], 'Malt': [] };
  for (let i = 0; i < 19; i++) { priceIdx.Grain.push(100 + i * .9 + rn(-1, 1) + (i > 14 ? 4 : 0)); priceIdx.Glass.push(100 + i * .5 + rn(-1, 1) + (i > 12 ? 5 : 0)); priceIdx.Molasses.push(100 - i * .2 + rn(-3, 3)); priceIdx['PET resin'].push(100 + Math.sin(i / 3) * 4 + rn(-1, 1)); priceIdx.Malt.push(100 + i * .3 + rn(-1, 1)); }

  // statutory per state (current snapshot)
  const stat = states.map(s => {
    const r = k => hr(s.code, k);
    return { code: s.code, name: s.name, dutyShare: s.w * (.8 + r('d') * .5), permits: Math.round(r('p') * 9), labels: Math.round(r('l') * 4), mrp: r('m') > .75 ? 'Pending' : r('m') > .4 ? 'Filed' : 'Approved', stockouts: Math.round(r('so') * 5 * (s.w * 10 > 1 ? 1 : .6)), fill: 90 + r('f') * 9, nd: 58 + r('n') * 30, dsd: 12 + r('x') * 18, secPri: .9 + r('sp') * .25, dueDays: 1 + Math.round(r('dd') * 6) };
  });
  stat.find(s => s.code === 'UP').stockouts = 7; stat.find(s => s.code === 'UP').fill = 87.4;
  stat.find(s => s.code === 'MH').permits = 12; stat.find(s => s.code === 'PB').mrp = 'Pending';

  // lake catalogue
  const lake = [
    ['Sales & billing', 'VBRK, VBRP, VBAK, VBAP', 'Billing documents, sales orders', '1.84 bn', 'Every 4 h', 1.2, 'Delta (CDC)'], ['Finance', 'ACDOCA, BKPF, BSEG, FAGLFLEXA', 'Universal journal, GL, AP/AR items', '3.62 bn', 'Hourly', .5, 'Delta (CDC)'],
    ['Materials & stock', 'MSEG, MKPF, MARD, MBEW', 'Goods movements, stock, valuation', '2.91 bn', 'Hourly', .6, 'Delta (CDC)'], ['Procurement', 'EKKO, EKPO, EKBE, RBKP', 'POs, GR/IR, supplier invoices', '412 mn', 'Every 4 h', 2.1, 'Delta (CDC)'],
    ['Production', 'AFKO, AFPO, AUFM, RESB', 'Process/production orders, confirmations', '688 mn', 'Every 4 h', 1.8, 'Delta (CDC)'], ['Quality', 'QALS, QAVE, QAMV, QMEL', 'Inspection lots, usage decisions', '96 mn', 'Daily 02:00', 8.6, 'Delta (CDC)'],
    ['Maintenance', 'AUFK, AFIH, IHPA, EQUI', 'Maintenance orders, equipment, notifications', '58 mn', 'Daily 02:00', 8.6, 'Delta (CDC)'], ['Excise & statutory', 'Z-tables, J_1I*, e-challan feed', 'Duty ledger, permits, label registration', '31 mn', 'Daily 03:00', 7.7, 'Full + delta'],
    ['Master data', 'MARA, KNA1, LFA1, T001W', 'Material, customer, vendor, plant', '24 mn', 'Nightly', 9.5, 'Full snapshot'], ['Non-SAP: distributor (DMS)', 'Secondary-sales API', 'Outlet / distributor stock & sales', '0.9 bn', 'Daily 04:00', 6.2, 'API'],
    ['Non-SAP: plant historians', 'SCADA / OPC-UA', 'Fermentation temp, still throughput, line speed', '6.4 bn', 'Every 15 min', .2, 'Stream'], ['Non-SAP: market prices', 'Commodity & weather feeds', 'Grain, molasses, glass, monsoon', '1.2 mn', 'Daily', 5.0, 'API']
  ].map(r => ({ dom: r[0], src: r[1], desc: r[2], rows: r[3], cad: r[4], age: r[5], mode: r[6] }));

  window.D = { months, CATS, CCOL, brands, total, cats, channels, states, plants, plantMonth, dist, fin, finEx, closeTasks, mats, cask, priceIdx, stat, lake, hr, cur: 18, asOf: '26 Nov 2026, 02:14' };
})();
