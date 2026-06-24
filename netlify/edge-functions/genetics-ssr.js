// netlify/edge-functions/genetics-ssr.js
// Injects pre-rendered pairing results into the HTML when URL params are present.
// AI crawlers (GPTBot, ClaudeBot, Googlebot, etc.) cannot run JavaScript — they see
// a blank page. This edge function runs BEFORE the page is served, calculates the
// genetics result server-side, and injects it as real HTML so crawlers can read and
// cite it. Regular users are unaffected — JavaScript loads the interactive app as usual.
//
// Runs on Netlify's edge network (Deno runtime). No Node.js APIs used.

// ─── GENETICS ENGINE ─────────────────────────────────────────────────────────
// Ported directly from the app's genetics engine in index.html.

const ALLELES = {
  "Green":             ["G",  "G" ],
  "Blue 1":            ["B1", "B1"],
  "Blue 2":            ["B2", "B2"],
  "Parblue (B1B2)":    ["B1", "B2"],
  "Aqua B1":           ["A",  "B1"],
  "Aqua B2":           ["A",  "B2"],
  "Aqua Homo":         ["A",  "A" ],
  "Green / Blue 1":    ["B1", "G" ],
  "Green / Blue 2":    ["B2", "G" ],
  "Green / Aqua":      ["A",  "G" ],
};

const ALLELE_TO_COLOR = {
  "G+G":   "Green",
  "B1+G":  "Green / Blue 1",
  "B2+G":  "Green / Blue 2",
  "A+G":   "Green / Aqua",
  "B1+B1": "Blue 1",
  "B2+B2": "Blue 2",
  "B1+B2": "Parblue (B1B2)",
  "A+B1":  "Aqua B1",
  "A+B2":  "Aqua B2",
  "A+A":   "Aqua Homo",
};

const YF_TO_BASE = {
  "Green Yellow Face":          "Green",
  "Blue 1 Yellow Face":         "Blue 1",
  "Blue 2 Yellow Face":         "Blue 2",
  "Parblue (B1B2) Yellow Face": "Parblue (B1B2)",
  "Aqua B1 Yellow Face":        "Aqua B1",
  "Aqua B2 Yellow Face":        "Aqua B2",
  "Aqua Homo Yellow Face":      "Aqua Homo",
};

const BLUE_SPLIT_MAP = {
  "SplitB1":    "Green / Blue 1",
  "SplitB2":    "Green / Blue 2",
  "SplitAqua":  "Green / Aqua",
};

const MUTATIONS = [
  { id:"Opaline",      label:"Opaline",       type:"SL" },
  { id:"Pallid",       label:"Pallid",        type:"SL" },
  { id:"Cinnamon",     label:"Cinnamon",      type:"SL" },
  { id:"DunFallow",    label:"Dun Fallow",    type:"AR" },
  { id:"BronzeFallow", label:"Bronze Fallow", type:"AR" },
  { id:"PaleFallow",   label:"Pale Fallow",   type:"AR" },
  { id:"Ino",          label:"Ino",           type:"AR" },
  { id:"Dilute",       label:"Dilute",        type:"AR" },
  { id:"YellowFace",   label:"Yellow Face",   type:"AR" },
  { id:"RedFactor",    label:"Red Factor",    type:"AR" },
  { id:"Euwing",       label:"Euwing",        type:"AD" },
  { id:"Greywing",     label:"Greywing",      type:"AD" },
  { id:"Misty",        label:"Misty",         type:"AD" },
];

const getBase     = p => YF_TO_BASE[p] || p;
const isYF        = p => p in YF_TO_BASE;
const isBlueSplit = id => id in BLUE_SPLIT_MAP;

function crossBlue(c1, c2) {
  const [a1, a2] = ALLELES[c1] || ["G", "G"];
  const [b1, b2] = ALLELES[c2] || ["G", "G"];
  const cnt = {};
  for (const a of [a1, a2]) for (const b of [b1, b2]) {
    const k = [a, b].sort().join("+");
    cnt[k] = (cnt[k] || 0) + 1;
  }
  return Object.entries(cnt)
    .map(([k, c]) => ({ color: ALLELE_TO_COLOR[k] || k, pct: (c / 4) * 100 }))
    .filter(r => r.pct > 0);
}

function normalizeBase(res) {
  let out = [...res];
  // Merge split-green variants
  {
    const byC = {};
    for (const r of out) byC[r.color] = (byC[r.color] || 0) + r.pct;
    const pG  = byC["Green"] || 0;
    const gB1 = byC["Green / Blue 1"] || 0;
    const gB2 = byC["Green / Blue 2"] || 0;
    const gA  = byC["Green / Aqua"]   || 0;
    if (pG > 0 && (gB1 > 0 || gB2 > 0 || gA > 0)) {
      out = out.filter(r => !["Green","Green / Blue 1","Green / Blue 2","Green / Aqua"].includes(r.color));
      if (gB1 > 0 && gB2 > 0) {
        out.push({ color: "Green // Parblue (B1B2)", pct: pG + gB1 + gB2 });
        if (gA > 0) out.push({ color: "Green // Aqua", pct: gA });
      } else if (gB1 > 0) {
        out.push({ color: "Green // Blue 1", pct: pG + gB1 });
        if (gA > 0) out.push({ color: "Green // Aqua", pct: gA });
      } else if (gB2 > 0) {
        out.push({ color: "Green // Blue 2", pct: pG + gB2 });
        if (gA > 0) out.push({ color: "Green // Aqua", pct: gA });
      } else if (gA > 0) {
        out.push({ color: "Green // Aqua", pct: pG + gA });
      }
    }
  }
  // Collapse multiple green-splits into one label
  {
    const S  = ["Green / Blue 1", "Green / Blue 2", "Green / Aqua"];
    const gS = out.filter(r => S.includes(r.color));
    if (gS.length >= 2) {
      const tot = gS.reduce((s, r) => s + r.pct, 0);
      const lab = gS.map(r => r.color.replace("Green / ", ""));
      out = out.filter(r => !S.includes(r.color));
      out.push({ color: "Green / " + lab.join(" or "), pct: tot });
    }
  }
  // Merge B1 + B2 into Parblue when both present
  {
    const byC = {};
    for (const r of out) byC[r.color] = (byC[r.color] || 0) + r.pct;
    const b1 = byC["Blue 1"] || 0, b2 = byC["Blue 2"] || 0;
    if (b1 > 0 && b2 > 0) {
      out = out.filter(r => r.color !== "Blue 1" && r.color !== "Blue 2");
      out.push({ color: byC["Parblue (B1B2)"] > 0 ? "Blue 1 // B2" : "Parblue (B1B2)", pct: b1 + b2 });
    }
    out.sort((a, b) => {
      const ag = a.color.startsWith("Green") ? 0 : 1;
      const bg = b.color.startsWith("Green") ? 0 : 1;
      return ag !== bg ? ag - bg : b.pct - a.pct;
    });
    return out;
  }
}

function parseColorName(c) {
  if (c.includes("// ")) { const i = c.indexOf("// "); return { name: c.slice(0, i).trim(), conf: [], poss: c.slice(i + 3).split("// ") }; }
  if (c.includes(" / ")) { const i = c.indexOf(" / "); return { name: c.slice(0, i), conf: c.slice(i + 3).split(" / "), poss: [] }; }
  return { name: c, conf: [], poss: [] };
}

function calcAR(m, f) {
  const ms = m || "normal", fs = f || "normal";
  if (ms === "visual" && fs === "visual") return [{ status: "visual", pct: 100 }];
  if ((ms === "visual" && fs === "split") || (ms === "split" && fs === "visual")) return [{ status: "visual", pct: 50 }, { status: "split", pct: 50 }];
  if ((ms === "visual" && fs === "normal") || (ms === "normal" && fs === "visual")) return [{ status: "split", pct: 100 }];
  if (ms === "split" && fs === "split") return [{ status: "visual", pct: 25 }, { status: "possibleSplit", pct: 75 }];
  if ((ms === "split" && fs === "normal") || (ms === "normal" && fs === "split")) return [{ status: "possibleSplit", pct: 100 }];
  return [{ status: "normal", pct: 100 }];
}

function calcSL(mSt, fSt) {
  const dA = mSt === "visual" ? ["m","m"] : mSt === "split" ? ["m","n"] : ["n","n"];
  const mZ = fSt === "visual" ? "m" : "n";
  const mc = { visual: 0, split: 0, normal: 0 }, fc = { visual: 0, normal: 0 };
  for (const d of dA) {
    const combo = [d, mZ].sort().join("");
    if (combo === "mm") mc.visual++; else if (combo === "mn") mc.split++; else mc.normal++;
    if (d === "m") fc.visual++; else fc.normal++;
  }
  const out = [];
  if (mc.visual > 0) out.push({ sex: "male",   status: "visual", pct: (mc.visual / 4) * 100 });
  if (mc.split  > 0) out.push({ sex: "male",   status: "split",  pct: (mc.split  / 4) * 100 });
  if (mc.normal > 0) out.push({ sex: "male",   status: "normal", pct: (mc.normal / 4) * 100 });
  if (fc.visual > 0) out.push({ sex: "female", status: "visual", pct: (fc.visual / 4) * 100 });
  if (fc.normal > 0) out.push({ sex: "female", status: "normal", pct: (fc.normal / 4) * 100 });
  return out;
}

function calcAD(mSt, fSt) {
  const toA = s => s === "DF" ? ["D","D"] : (s === "SF" || s === "visual" || s === "split") ? ["D","N"] : ["N","N"];
  const mA = toA(mSt), fA = toA(fSt), cnt = { DF: 0, SF: 0, normal: 0 };
  for (const a of mA) for (const b of fA) {
    const p = [a, b].sort().join("");
    if (p === "DD") cnt.DF++; else if (p === "DN") cnt.SF++; else cnt.normal++;
  }
  return [
    { label: "Double Factor (DF)", status: "DF",     pct: (cnt.DF     / 4) * 100 },
    { label: "Single Factor (SF)", status: "SF",     pct: (cnt.SF     / 4) * 100 },
    { label: "Normal",             status: "normal", pct: (cnt.normal / 4) * 100 },
  ].filter(r => r.pct > 0);
}

function calcSLD(mSt, fSt) {
  // Sex-Linked Dominant: males ZZ can be DF/SF/Normal; females ZW can be SF/Normal only
  const mA = mSt === "DF" ? ["+","+"] : (mSt === "SF" || mSt === "visual" || mSt === "split") ? ["+","-"] : ["-","-"];
  const fA = (fSt === "SF" || fSt === "visual" || fSt === "split") ? ["+","W"] : ["-","W"];
  const out = [];
  for (const m of mA) for (const f of fA) {
    if (f === "W") {
      out.push({ sex: "female", status: m === "+" ? "SF" : "normal", pct: 25 });
    } else {
      const hd = m === "+" && f === "+", hs = !hd && (m === "+" || f === "+");
      out.push({ sex: "male", status: hd ? "DF" : hs ? "SF" : "normal", pct: 25 });
    }
  }
  return out;
}

function applyARMuts(baseRes, arMuts) {
  let pool = baseRes.map(r => {
    const { name, conf, poss } = parseColorName(r.color);
    return { baseName: name, pct: r.pct, vis: [], conf: [...conf], poss: [...poss] };
  });
  for (const mut of arMuts) {
    const next = [];
    for (const curr of pool) for (const o of mut.offspring) {
      const n = { ...curr, pct: curr.pct * o.pct / 100, vis: [...curr.vis], conf: [...curr.conf], poss: [...curr.poss] };
      if      (o.status === "visual")       n.vis.push(mut.label);
      else if (o.status === "split")        n.conf.push(mut.label);
      else if (o.status === "possibleSplit") n.poss.push(mut.label);
      next.push(n);
    }
    pool = next;
  }
  const INO = { "": "Albino", "Green": "Lutino", "Parblue (B1B2)": "Creamino", "Blue 1": "Blue 1 Albino", "Blue 2": "Blue 2 Albino", "Aqua B1": "Aqua B1 Ino", "Aqua B2": "Aqua B2 Ino", "Aqua Homo": "Aqua Homo Ino" };
  const named = pool.map(c => {
    let base = c.baseName, vis = [...c.vis], conf = [...c.conf], poss = [...c.poss];
    if (vis.includes("Ino") && INO[base] !== undefined) { base = INO[base]; vis = vis.filter(v => v !== "Ino"); }
    let name = base;
    if (vis.length)  name += " " + vis.join(" ");
    if (conf.length) name += " / " + conf.join(" / ");
    if (poss.length) name += " // " + poss.join(" // ");
    return { name, pct: c.pct };
  });
  const merged = [];
  for (const r of named) { const ex = merged.find(x => x.name === r.name); if (ex) ex.pct += r.pct; else merged.push({ ...r }); }
  return merged.sort((a, b) => b.pct - a.pct);
}

function mergeBlueVariants(arr) {
  const norm = n => n.replace(/((?:\/\/|\/)\s+)(Blue 1|Blue 2|Aqua)\b/g, "$1__BLU__");
  const g = {};
  for (const r of arr) {
    const k = norm(r.name);
    if (!g[k]) g[k] = { pct: 0, hasB1: false, hasB2: false, hasA: false };
    g[k].pct += r.pct;
    if (/(\/\/|\/)\s+Blue 1\b/.test(r.name)) g[k].hasB1 = true;
    if (/(\/\/|\/)\s+Blue 2\b/.test(r.name)) g[k].hasB2 = true;
    if (/(\/\/|\/)\s+Aqua\b/.test(r.name))   g[k].hasA  = true;
  }
  return Object.entries(g).map(([k, { pct, hasB1, hasB2, hasA }]) => {
    const blues = [];
    if (hasA)  blues.push("Aqua");
    if (hasB1) blues.push("Blue 1");
    if (hasB2) blues.push("Blue 2");
    const name = blues.length ? k.replace(/__BLU__/g, blues.join(" or ")) : k;
    return { name, pct };
  }).sort((a, b) => b.pct - a.pct);
}

function calculateOffspring(p1Base, p1Traits, p2Base, p2Traits) {
  if (!p1Base || !p2Base) return null;
  const getEffectiveBase = (pp, tr) => {
    let b = getBase(pp);
    if (b === "Green") { const s = (tr || []).find(t => isBlueSplit(t.id)); if (s) b = BLUE_SPLIT_MAP[s.id]; }
    return b;
  };
  const b1 = getEffectiveBase(p1Base, p1Traits);
  const b2 = getEffectiveBase(p2Base, p2Traits);
  const baseResults = normalizeBase(crossBlue(b1, b2));

  const mt = {};
  const setMut = (id, side, st) => {
    if (!id || id === "None" || isBlueSplit(id)) return;
    if (!mt[id]) mt[id] = { m: "normal", f: "normal" };
    const rank = { DF: 4, SF: 3, visual: 3, split: 2, possibleSplit: 1, normal: 0 };
    if ((rank[st] || 0) > (rank[mt[id][side]] || 0)) mt[id][side] = st || "normal";
  };
  if (isYF(p1Base)) setMut("YellowFace", "m", "visual");
  if (isYF(p2Base)) setMut("YellowFace", "f", "visual");
  for (const t of (p1Traits || [])) setMut(t.id, "m", t.status);
  for (const t of (p2Traits || [])) setMut(t.id, "f", t.status);

  const arMuts = [];
  const adMuts = [];
  for (const [id, { m, f }] of Object.entries(mt)) {
    const mut = MUTATIONS.find(x => x.id === id);
    if (mut && mut.type === "AR") arMuts.push({ label: mut.label, offspring: calcAR(m, f) });
    if (mut && mut.type === "AD") adMuts.push({ label: mut.label, offspring: calcAD(m, f) });
  }

  const slMutDefs = [], sldMutDefs = [];
  for (const [id, { m, f }] of Object.entries(mt)) {
    const mut = MUTATIONS.find(x => x.id === id);
    if (mut && mut.type === "SL")  slMutDefs.push({ label: mut.label, m, f });
    if (mut && mut.type === "SLD") sldMutDefs.push({ label: mut.label, m, f });
  }

  let slResults = null;
  if (slMutDefs.length > 0 || sldMutDefs.length > 0) {
    const arBase = applyARMuts(baseResults, arMuts);
    let pool = arBase.map(b => ({ name: b.name, pct: b.pct, sex: null }));
    for (const sl of slMutDefs) {
      const raw  = calcSL(sl.m, sl.f);
      const next = [];
      for (const curr of pool) {
        const appl = curr.sex === null ? raw : raw.filter(r => r.sex === curr.sex);
        const tot  = appl.reduce((s, r) => s + r.pct, 0);
        for (const s of appl) {
          const sp = curr.name.indexOf(" / "), dp = curr.name.indexOf("// ");
          const cp = sp > -1 ? sp : dp > -1 ? dp - 1 : -1;
          const bb = cp > -1 ? curr.name.slice(0, cp) : curr.name;
          const ba = cp > -1 ? curr.name.slice(cp) : "";
          let nm;
          if      (s.status === "visual") nm = `${bb} ${sl.label}${ba}`;
          else if (s.status === "split")  { const nt = (sl.m === "split" && sl.f !== "visual") ? " // " + sl.label : " / " + sl.label; nm = `${bb}${nt}${ba}`; }
          else nm = (s.sex === "male" && sl.m === "split" && sl.f !== "visual") ? `${curr.name} // ${sl.label}` : curr.name;
          next.push({ name: nm.trim(), pct: curr.pct * (s.pct / tot), sex: s.sex || curr.sex });
        }
      }
      pool = next;
    }
    for (const sld of sldMutDefs) {
      const raw  = calcSLD(sld.m, sld.f);
      const next = [];
      for (const curr of pool) {
        const appl = curr.sex === null ? raw : raw.filter(r => r.sex === curr.sex);
        const tot  = appl.reduce((s, r) => s + r.pct, 0);
        for (const s of appl) {
          const sp = curr.name.indexOf(" / "), dp = curr.name.indexOf("// ");
          const cp = sp > -1 ? sp : dp > -1 ? dp - 1 : -1;
          const bb = cp > -1 ? curr.name.slice(0, cp) : curr.name;
          const ba = cp > -1 ? curr.name.slice(cp) : "";
          let nm;
          if      (s.status === "SF") nm = `${bb} SF ${sld.label}${ba}`;
          else if (s.status === "DF") nm = `${bb} DF ${sld.label}${ba}`;
          else nm = curr.name;
          next.push({ name: nm.trim(), pct: curr.pct * (s.pct / tot), sex: s.sex || curr.sex });
        }
      }
      pool = next;
    }
    const mrg = arr => { const mg = []; for (const r of arr) { const ex = mg.find(x => x.name === r.name); if (ex) ex.pct += r.pct; else mg.push({ ...r }); } return mg.sort((a, b) => b.pct - a.pct); };
    const allSLlbls = [...slMutDefs.map(sl => sl.label), ...sldMutDefs.map(sl => sl.label)];
    slResults = {
      label:           allSLlbls.join(" + "),
      maleOffspring:   mergeBlueVariants(mrg(pool.filter(r => r.sex === "male"))),
      femaleOffspring: mergeBlueVariants(mrg(pool.filter(r => r.sex === "female"))),
    };
  }

  return { combined: mergeBlueVariants(applyARMuts(baseResults, arMuts)), slMut: slResults, adMuts };
}

// ─── HTML BUILDER ─────────────────────────────────────────────────────────────

function fmtPct(n) {
  return (n % 1 === 0 ? n : parseFloat(n.toFixed(1))) + "%";
}

function describeParent(base, traits) {
  const parts = (traits || [])
    .filter(t => !isBlueSplit(t.id) && t.id && t.id !== "None")
    .map(t => {
      const mut   = MUTATIONS.find(m => m.id === t.id);
      const label = mut ? mut.label : t.id;
      if (t.status === "visual") return "Visual " + label;
      if (t.status === "split")  return "Split "  + label;
      return label;
    });
  return base + (parts.length ? " (" + parts.join(", ") + ")" : "");
}

function buildResultHtml(maleBase, maleMuts, femaleBase, femaleMuts, results) {
  const maleName   = describeParent(maleBase,   maleMuts);
  const femaleName = describeParent(femaleBase, femaleMuts);

  let rows = "";
  if (results.slMut) {
    // Sex-linked — show male and female columns
    const males   = results.slMut.maleOffspring;
    const females = results.slMut.femaleOffspring;
    if (males.length) {
      rows += `<li><strong>Males:</strong><ul>`;
      for (const r of males)   if (r.pct >= 0.1) rows += `<li>${fmtPct(r.pct)} — ${r.name}</li>`;
      rows += `</ul></li>`;
    }
    if (females.length) {
      rows += `<li><strong>Females:</strong><ul>`;
      for (const r of females) if (r.pct >= 0.1) rows += `<li>${fmtPct(r.pct)} — ${r.name}</li>`;
      rows += `</ul></li>`;
    }
  } else {
    for (const r of results.combined) {
      if (r.pct >= 0.1) rows += `<li>${fmtPct(r.pct)} — ${r.name}</li>`;
    }
  }
  if (results.adMuts && results.adMuts.length) {
    for (const am of results.adMuts) {
      rows += `<li><strong>${am.label} (Dominant):</strong><ul>`;
      for (const o of am.offspring) if (o.pct > 0) rows += `<li>${fmtPct(o.pct)} — ${o.label}</li>`;
      rows += `</ul></li>`;
    }
  }

  return `
<section id="ssr-genetics-result" style="max-width:860px;margin:0 auto;padding:40px 24px 56px;font-family:system-ui,sans-serif;border-top:1px solid #e0e0e0;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 6px;">Lovebird Pairing Result</h2>
  <p style="font-size:13px;color:#666;margin:0 0 20px;">
    Calculated by the <a href="https://lovebirdgenetics.com/" style="color:#4ca154;">Lovebird Genetics Calculator</a> by KinBird Aviary
  </p>
  <table style="border-collapse:collapse;width:100%;max-width:500px;margin-bottom:20px;">
    <tr><td style="padding:6px 12px 6px 0;font-size:14px;color:#888;white-space:nowrap;">♂ Male (Cock)</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${maleName}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;font-size:14px;color:#888;white-space:nowrap;">♀ Female (Hen)</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${femaleName}</td></tr>
  </table>
  <p style="font-size:14px;font-weight:700;margin:0 0 10px;">Predicted Offspring</p>
  <ul style="font-size:14px;line-height:2;padding-left:20px;margin:0 0 20px;">${rows}</ul>
  <p style="font-size:13px;color:#888;margin:0;">
    These are Mendelian probability percentages. Use the interactive
    <a href="https://lovebirdgenetics.com/" style="color:#4ca154;">lovebird genetics calculator</a>
    for full results, sex-linked breakdowns, and sharable links.
  </p>
</section>`;
}

// ─── EDGE FUNCTION ENTRY POINT ────────────────────────────────────────────────

export default async (request, context) => {
  const url = new URL(request.url);

  // Skip static assets immediately — no genetics params possible on these
  if (/\.(js|css|png|jpg|jpeg|svg|ico|json|txt|xml|webmanifest|woff|woff2|ttf|webp|gif|pdf|map)$/i.test(url.pathname)) {
    return;
  }

  const maleBase   = url.searchParams.get("m");
  const femaleBase = url.searchParams.get("f");

  // No pairing params — serve the page normally, no modification
  if (!maleBase || !femaleBase) return;

  // Parse mutation strings: "DunFallow:visual,Opaline:split" → [{id,status}]
  const parseMuts = str => (str || "").split(",")
    .map(s => { const [id, status] = s.split(":"); return { id: (id || "").trim(), status: (status || "visual").trim() }; })
    .filter(t => t.id);

  const maleMuts   = parseMuts(url.searchParams.get("mt") || "");
  const femaleMuts = parseMuts(url.searchParams.get("ft") || "");

  // Run the genetics engine
  let results;
  try { results = calculateOffspring(maleBase, maleMuts, femaleBase, femaleMuts); }
  catch (_) { return; } // On any error, fall through to normal page
  if (!results) return;

  // Fetch the original page from the origin
  const response = await context.next();
  const html     = await response.text();

  // Build the injected results section
  const injection = buildResultHtml(maleBase, maleMuts, femaleBase, femaleMuts, results);

  // Inject just before </body> so it's at the bottom of the page
  const modified = html.replace("</body>", injection + "\n</body>");

  const newHeaders = new Headers(response.headers);
  newHeaders.set("content-type", "text/html; charset=UTF-8");

  return new Response(modified, { status: response.status, headers: newHeaders });
};

export const config = { path: "/*" };
