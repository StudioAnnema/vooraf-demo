// Vooraf — klikbare demo. Alle logica draait lokaal in de browser; er wordt niets verstuurd.
// LET OP: vragen en rode vlaggen zijn een voorbeeld en nog niet klinisch gevalideerd.

const BRANDS = {
  duinen: { name: "Fysio De Duinen", short: "DD", phone: "071 – 123 45 67" },
  oost: { name: "FysioCentrum Oost", short: "FO", phone: "020 – 765 43 21" },
  beweeg: { name: "Beweegpraktijk Lisse", short: "BL", phone: "0252 – 41 22 33" },
};
let brand = BRANDS.duinen;

const STEPS = [
  { id: "name", q: () => "Wat is je voor- en achternaam?", type: "text", placeholder: "Bijv. Sanne de Vries" },
  { id: "age", q: a => `Dank je, ${first(a.name)}. Hoe oud ben je?`, type: "number", placeholder: "Leeftijd" },
  { id: "area", q: () => "Waar heb je vooral last van?", options: ["Onderrug", "Nek", "Schouder", "Knie", "Iets anders"] },
  { id: "duration", q: () => "Hoe lang heb je deze klachten al?", options: ["Korter dan 1 week", "1 tot 6 weken", "6 tot 12 weken", "Langer dan 3 maanden"] },
  { id: "onset", q: () => "Hoe is het begonnen?", options: ["Na tillen of een verkeerde beweging", "Na een val of ongeluk", "Vanzelf, geleidelijk"] },
  { id: "pain", q: () => "Hoeveel pijn heb je gemiddeld? 0 is geen pijn, 10 is de ergste pijn die je kunt voorstellen.", options: ["0","1","2","3","4","5","6","7","8","9","10"] },
  { id: "radiation", q: () => "Straalt de pijn uit naar je been?", options: ["Nee, alleen in mijn rug", "Tot in bil of bovenbeen", "Tot onder de knie"] },
  { id: "cauda", q: () => "Heb je sinds de klachten een doof gevoel rond je billen of schaamstreek, of moeite met plassen of ontlasting?", options: ["Nee", "Ja"], urgent: v => v === "Ja" },
  { id: "weakness", q: () => "Worden je benen steeds slapper of krachtelozer?", options: ["Nee", "Ja"], urgent: v => v === "Ja" },
  { id: "cancer", q: () => "Heb je nu of in het verleden kanker gehad?", options: ["Nee", "Ja", "Weet ik niet zeker"] },
  { id: "weight", q: () => "Ben je de afgelopen maanden zonder duidelijke reden meer dan 5 kilo afgevallen?", options: ["Nee", "Ja"] },
  { id: "night", q: () => "Heb je 's nachts pijn die niet minder wordt als je anders gaat liggen?", options: ["Nee", "Ja"] },
  { id: "fever", q: () => "Heb je koorts, of voel je je algemeen ziek?", options: ["Nee", "Ja"] },
  { id: "fear", q: () => "Ben je bang dat bewegen je rug verder beschadigt?", options: ["Nee", "Een beetje", "Ja, erg"] },
  { id: "work", q: () => "Lukt werk en je dagelijkse dingen nog?", options: ["Ja, gewoon", "Met moeite", "Nee, ik zit thuis"] },
  { id: "goal", q: () => "Laatste vraag: wat zou je graag weer willen kunnen?", type: "text", placeholder: "Bijv. weer hardlopen" },
];

const QUESTION_LABELS = {
  name: "Naam", age: "Leeftijd", area: "Klachtgebied", duration: "Duur", onset: "Ontstaan", pain: "Pijn (NPRS)",
  radiation: "Uitstraling", cauda: "Zadelanesthesie / mictie- of defecatiestoornis", weakness: "Progressief krachtverlies benen",
  cancer: "Maligniteit in voorgeschiedenis", weight: "Onverklaard gewichtsverlies > 5 kg", night: "Houdingsonafhankelijke nachtpijn",
  fever: "Koorts / algemeen ziek", fear: "Bewegingsangst", work: "Functioneren werk/ADL", goal: "Hulpvraag",
};

// ---------- Triage ----------
function triage(a) {
  const age = parseInt(a.age, 10) || 0;
  const red = [], yellow = [];
  if (a.cauda === "Ja") red.push("Zadelanesthesie / mictie- of defecatiestoornis (verdenking cauda equina)");
  if (a.weakness === "Ja") red.push("Progressief krachtverlies in de benen");
  const cancer = a.cancer === "Ja";
  if (cancer) red.push("Maligniteit in de voorgeschiedenis");
  if (a.cancer === "Weet ik niet zeker") yellow.push("Onzeker over maligniteit in voorgeschiedenis — navragen");
  if (a.weight === "Ja") red.push("Onverklaard gewichtsverlies");
  if (a.night === "Ja") red.push("Houdingsonafhankelijke nachtpijn");
  if (a.fever === "Ja") red.push("Koorts / algemeen ziek (verdenking infectie)");
  if (a.onset === "Na een val of ongeluk" && age >= 60) red.push(`Trauma bij leeftijd ${age} (verdenking fractuur)`);
  if (a.fear === "Ja, erg") yellow.push("Sterke bewegingsangst");
  else if (a.fear === "Een beetje") yellow.push("Lichte bewegingsangst");
  if (a.work === "Nee, ik zit thuis") yellow.push("Uitval werk/ADL");
  if (a.duration === "Langer dan 3 maanden") yellow.push("Chronisch beloop (> 3 maanden)");

  let level = "groen", reason = "";
  if (a.cauda === "Ja" || a.weakness === "Ja") {
    level = "spoed"; reason = "Neurologische alarmsignalen";
  } else if (cancer && (a.weight === "Ja" || a.night === "Ja" || age >= 50)) {
    level = "rood"; reason = "Maligniteit in voorgeschiedenis in combinatie met andere alarmsignalen";
  } else if (a.fever === "Ja") {
    level = "rood"; reason = "Mogelijke infectie";
  } else if (a.onset === "Na een val of ongeluk" && age >= 60) {
    level = "rood"; reason = "Mogelijke fractuur na trauma";
  } else if (a.weight === "Ja" && a.night === "Ja") {
    level = "rood"; reason = "Combinatie gewichtsverlies en nachtpijn";
  } else if (cancer || a.cancer === "Weet ik niet zeker" || a.weight === "Ja" || a.night === "Ja"
             || a.radiation === "Tot onder de knie" || a.onset === "Na een val of ongeluk") {
    level = "oranje"; reason = "Eén aandachtspunt — eerst telefonisch afstemmen";
  } else {
    reason = "Geen alarmsignalen gevonden";
  }
  return { level, reason, red, yellow };
}

const ROUTES = {
  groen: { label: "Groen", title: "Geschikt voor fysiotherapie", action: "Intake inplannen. Patiënt heeft zelf een tijd gekozen." },
  oranje: { label: "Oranje", title: "Eerst even bellen", action: "Fysiotherapeut belt patiënt vandaag om de aandachtspunten na te vragen, daarna beslist de therapeut: intake of huisarts." },
  rood: { label: "Rood", title: "Eerst naar de huisarts", action: "Patiënt is geadviseerd binnen 2 werkdagen de huisarts te bezoeken. Conceptverwijsbrief staat klaar. Praktijk belt patiënt vandaag na." },
  spoed: { label: "Spoed", title: "Vandaag nog medische zorg", action: "Patiënt is geadviseerd direct de huisarts of huisartsenpost te bellen (bij acute verlamming 112). Praktijk heeft een sms-melding gekregen en belt na." },
};

function patientOutcome(level, a) {
  const p = brand.name;
  if (level === "spoed") return { cls: "alert", text:
    `<b>Belangrijk, ${first(a.name)}.</b> Wat je beschrijft kan betekenen dat er druk op zenuwen staat. Dat moet <b>vandaag nog</b> bekeken worden.<br><br>📞 Bel nu je huisarts, of buiten kantoortijden de <b>huisartsenpost</b>.<br>🚑 Kun je je benen plotseling niet meer bewegen? Bel <b>112</b>.<br><br>${p} is op de hoogte en belt je ook.` };
  if (level === "rood") return { cls: "warn", text:
    `Dank je wel. Door een paar van je antwoorden is het verstandig dat je <b>eerst je huisarts</b> bezoekt, het liefst binnen 2 werkdagen. Dit is een voorzorg: de huisarts kan dingen onderzoeken die een fysiotherapeut niet kan.<br><br>Een fysiotherapeut van ${p} belt je vandaag om het toe te lichten. Je hoeft niets mee te nemen: wij sturen je huisarts een overzicht van je antwoorden.` };
  if (level === "oranje") return { cls: "", text:
    `Dank je wel! Een fysiotherapeut van ${p} bekijkt je antwoorden vandaag en <b>belt je</b> om samen de beste volgende stap te kiezen.` };
  return { cls: "ok", text:
    `Dank je wel! Je klachten passen goed bij fysiotherapie. Kies hieronder een moment voor je eerste afspraak.` };
}

// ---------- Helpers ----------
const $ = s => document.querySelector(s);
const chat = $("#chat"), input = $("#chatInput");
const sleep = ms => new Promise(r => setTimeout(r, ms));
function first(n) { return (n || "").trim().split(/\s+/)[0] || "daar"; }
function esc(s) { return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function today(offsetMin = 0) {
  const d = new Date(Date.now() - offsetMin * 60000);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function addMsg(html, who = "bot", cls = "") {
  const el = document.createElement("div");
  el.className = `msg ${who} ${cls}`;
  el.innerHTML = html;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}
async function botSay(html, cls = "", run) {
  const t = addMsg("typt…", "bot", "typing");
  await sleep(auto ? 250 : 550);
  if (run !== runId) { t.remove(); throw "cancel"; }
  t.className = `msg bot ${cls}`; t.innerHTML = html;
  chat.scrollTop = chat.scrollHeight;
}

// ---------- Chat engine ----------
let runId = 0, auto = null;

function askUI(step, a) {
  return new Promise(resolve => {
    input.innerHTML = "";
    if (step.options) {
      step.options.forEach(o => {
        const b = document.createElement("button");
        b.className = "opt"; b.textContent = o;
        b.onclick = () => resolve(o);
        input.appendChild(b);
      });
    } else {
      const f = document.createElement("form");
      f.innerHTML = `<input ${step.type === "number" ? 'type="number" min="1" max="110" inputmode="numeric"' : 'type="text"'} placeholder="${step.placeholder || ""}" aria-label="${esc(step.q(a))}" required><button type="submit">Stuur</button>`;
      f.onsubmit = e => { e.preventDefault(); const v = f.querySelector("input").value.trim(); if (v) resolve(v); };
      input.appendChild(f);
      if (!auto) f.querySelector("input").focus({ preventScroll: true });
    }
  });
}

async function answer(step, a, run) {
  let v;
  if (auto) { await sleep(320); v = step.id === "slot" ? step.options[0] : auto[step.id]; }
  else v = await askUI(step, a);
  if (run !== runId) throw "cancel";
  input.innerHTML = "";
  addMsg(esc(v), "user");
  return v;
}

async function runChat(preset = null) {
  const run = ++runId;
  auto = preset;
  chat.innerHTML = ""; input.innerHTML = "";
  const a = {};
  try {
    await botSay(`Hoi! 👋 Ik ben de digitale assistent van <b>${brand.name}</b>. Ik stel je een paar vragen over je klacht, zodat de fysiotherapeut je meteen goed kan helpen. Het duurt ongeveer 4 minuten.`, "", run);
    await botSay(`Je antwoorden worden versleuteld opgeslagen en alleen gedeeld met ${brand.name}. Ga je akkoord?`, "", run);
    const c = await answer({ id: "consent", options: ["Akkoord", "Liever niet"], q: () => "" }, a, run);
    if (c !== "Akkoord") {
      await botSay(`Geen probleem. Je kunt de praktijk ook bellen op ${brand.phone}.`, "", run);
      return;
    }
    for (const step of STEPS) {
      await botSay(step.q(a), "", run);
      a[step.id] = await answer(step, a, run);
      if (step.id === "area" && a.area !== "Onderrug") {
        await botSay("In deze demo is alleen de vragenlijst voor <b>onderrug</b> uitgewerkt. We gaan daarmee verder.", "", run);
        a.area = "Onderrug";
      }
      if (step.urgent && step.urgent(a[step.id])) break; // spoed: direct stoppen met vragen
    }
    const t = triage(a);
    const out = patientOutcome(t.level, a);
    await botSay(out.text, out.cls, run);
    let slot = null;
    if (t.level === "groen") {
      const slots = ["di 14 okt · 09:30", "di 14 okt · 16:15", "wo 15 okt · 11:00"];
      slot = await answer({ id: "slot", options: slots, q: () => "" }, a, run);
      await botSay(`Top, je afspraak staat op <b>${slot}</b>. Je krijgt een bevestiging per mail. Tot dan! 💪`, "", run);
    }
    addToInbox({ answers: a, t, time: today(), slot, fresh: true });
  } catch (e) {
    if (e !== "cancel") console.error(e);
  } finally {
    if (run === runId) auto = null;
  }
}

// ---------- Inbox & detail ----------
const inboxEl = $("#inbox");
let items = [];

function addToInbox(item) {
  items.unshift(item);
  renderInbox();
  select(0);
}

function renderInbox() {
  inboxEl.innerHTML = "";
  items.forEach((it, i) => {
    const li = document.createElement("li");
    if (it.fresh) { li.classList.add("new"); it.fresh = false; }
    li.innerHTML = `<span class="status ${it.t.level}">${ROUTES[it.t.level].label}</span>
      <span class="who"><b>${esc(it.answers.name)}, ${esc(it.answers.age)} jr</b><small>${esc(it.answers.area)} · ${esc(it.t.reason)}</small></span>
      <time>${it.time}</time>`;
    li.onclick = () => select(i);
    inboxEl.appendChild(li);
  });
  $("#dashCount").textContent = `${items.length} open`;
}

let current = null, currentTab = "report";
function select(i) {
  current = items[i];
  [...inboxEl.children].forEach((li, j) => li.classList.toggle("sel", j === i));
  currentTab = "report";
  renderDetail();
}

function renderDetail() {
  const it = current, a = it.answers, t = it.t, r = ROUTES[t.level];
  const needsLetter = t.level === "rood" || t.level === "spoed";
  const flags = [
    ...t.red.map(f => `<span class="flag">${esc(f)}</span>`),
    ...t.yellow.map(f => `<span class="flag yellow">${esc(f)}</span>`),
  ];
  if (!flags.length) flags.push('<span class="flag none">Geen rode of gele vlaggen</span>');
  const fact = (k, v) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : "";
  $("#detail").innerHTML = `
    <div class="detail-top">
      <div>
        <span class="status ${t.level}">${r.label} · ${r.title}</span>
        <h3>${esc(a.name)}, ${esc(a.age)} jaar</h3>
        <span class="muted">Screening ingevuld ${it.time}${it.slot ? ` · afspraak ${esc(it.slot)}` : ""}</span>
      </div>
    </div>
    <div class="route-box ${t.level}"><strong>Doorverwijzing</strong>${esc(r.action)}</div>
    <dl class="facts">
      ${fact("Hulpvraag", a.goal)}${fact("Klacht", a.area)}${fact("Duur", a.duration)}${fact("Ontstaan", a.onset)}
      ${fact("Pijn (NPRS)", a.pain && a.pain + "/10")}${fact("Uitstraling", a.radiation)}${fact("Functioneren", a.work)}${fact("Bewegingsangst", a.fear)}
    </dl>
    <div class="flags">${flags.join("")}</div>
    <div class="tabs" role="tablist">
      <button class="tab ${currentTab === "report" ? "active" : ""}" data-tab="report">Conceptverslag</button>
      ${needsLetter ? `<button class="tab ${currentTab === "letter" ? "active" : ""}" data-tab="letter">Brief aan huisarts</button>` : ""}
      <button class="tab ${currentTab === "raw" ? "active" : ""}" data-tab="raw">Alle antwoorden</button>
    </div>
    <pre class="report" id="reportText">${esc(tabText(currentTab, it))}</pre>
    <div class="actions">
      <button class="btn" id="copyBtn">Kopieer naar EPD</button>
      <button class="btn btn-ghost" onclick="window.print()">PDF / printen</button>
    </div>`;
  document.querySelectorAll(".tab").forEach(b => b.onclick = () => { currentTab = b.dataset.tab; renderDetail(); });
  $("#copyBtn").onclick = async e => {
    try { await navigator.clipboard.writeText(tabText(currentTab, it)); e.target.textContent = "Gekopieerd ✓"; }
    catch { e.target.textContent = "Kopiëren niet toegestaan"; }
    setTimeout(() => e.target.textContent = "Kopieer naar EPD", 1800);
  };
}

function tabText(tab, it) {
  const a = it.answers, t = it.t, r = ROUTES[t.level];
  if (tab === "raw") {
    return Object.keys(QUESTION_LABELS).filter(k => a[k] !== undefined)
      .map(k => `${QUESTION_LABELS[k]}: ${a[k]}`).join("\n")
      + (a.cauda === "Ja" || a.weakness === "Ja" ? "\n\n(Vragenlijst afgebroken na alarmsignaal.)" : "");
  }
  const neg = Object.entries({ cauda: "zadelanesthesie/mictiestoornis", weakness: "progressief krachtverlies", cancer: "maligniteit", weight: "gewichtsverlies", night: "nachtpijn", fever: "koorts" })
    .filter(([k]) => a[k] === "Nee").map(([, v]) => v);
  if (tab === "letter") {
    return `Aan: huisarts van ${a.name}
Van: ${brand.name}
Betreft: ${a.name}, ${a.age} jaar — screening directe toegankelijkheid

Geachte collega,

Uw patiënt(e) meldde zich op ${it.time} bij onze praktijk met ${a.area.toLowerCase()}pijn${a.duration ? ` (${a.duration.toLowerCase()})` : ""}. Tijdens de digitale screening kwamen de volgende alarmsignalen naar voren:

${t.red.map(f => "  • " + f).join("\n")}

Wij hebben patiënt(e) geadviseerd ${t.level === "spoed" ? "u vandaag nog te bellen, of buiten kantoortijden de huisartsenpost" : "binnen 2 werkdagen een afspraak bij u te maken"}. Wij starten geen behandeling voordat deze signalen medisch zijn beoordeeld.

Een volledig overzicht van de antwoorden is bijgevoegd. Voor vragen kunt u ons bereiken via ${brand.phone}.

Met collegiale groet,

[naam fysiotherapeut], fysiotherapeut
${brand.name}`;
  }
  return `SCREENING DIRECTE TOEGANKELIJKHEID — CONCEPT
${brand.name} · ${it.time}

Patiënt: ${a.name}, ${a.age} jaar
Hulpvraag: ${a.goal || "—"}

ANAMNESE (patiëntgerapporteerd)
Klacht: ${a.area}, ${a.duration ? a.duration.toLowerCase() : "duur onbekend"}, ontstaan ${a.onset ? a.onset.toLowerCase() : "onbekend"}.
Pijn (NPRS): ${a.pain ?? "—"}/10. Uitstraling: ${a.radiation ? a.radiation.toLowerCase() : "—"}.
Functioneren: ${a.work ? a.work.toLowerCase() : "—"}.

SCREENING
Rode vlaggen positief: ${t.red.length ? t.red.join("; ") : "geen"}.
Rode vlaggen negatief: ${neg.length ? neg.join(", ") : "—"}.
Gele vlaggen: ${t.yellow.length ? t.yellow.join("; ") : "geen"}.

CONCLUSIE SCREENING: ${r.label.toUpperCase()} — ${r.title}
Beleid: ${r.action}

— Opgesteld door Vooraf op basis van de antwoorden van patiënt.
  Te controleren en aan te vullen door de behandelend fysiotherapeut.`;
}

// ---------- Presets ----------
const PRESETS = {
  groen: { consent: "Akkoord", name: "Sanne de Vries", age: "34", area: "Onderrug", duration: "1 tot 6 weken", onset: "Na tillen of een verkeerde beweging", pain: "6", radiation: "Nee, alleen in mijn rug", cauda: "Nee", weakness: "Nee", cancer: "Nee", weight: "Nee", night: "Nee", fever: "Nee", fear: "Een beetje", work: "Met moeite", goal: "Weer met de kinderen kunnen spelen en hardlopen" },
  rood: { consent: "Akkoord", name: "Henk Jansen", age: "63", area: "Onderrug", duration: "6 tot 12 weken", onset: "Vanzelf, geleidelijk", pain: "7", radiation: "Nee, alleen in mijn rug", cauda: "Nee", weakness: "Nee", cancer: "Ja", weight: "Ja", night: "Ja", fever: "Nee", fear: "Nee", work: "Met moeite", goal: "Weer de tuin kunnen doen" },
  spoed: { consent: "Akkoord", name: "Lotte Bakker", age: "41", area: "Onderrug", duration: "Korter dan 1 week", onset: "Na tillen of een verkeerde beweging", pain: "8", radiation: "Tot onder de knie", cauda: "Ja" },
};
const BACKLOG = [
  { name: "Mark Visser", age: "28", area: "Onderrug", duration: "Korter dan 1 week", onset: "Na tillen of een verkeerde beweging", pain: "5", radiation: "Nee, alleen in mijn rug", cauda: "Nee", weakness: "Nee", cancer: "Nee", weight: "Nee", night: "Nee", fever: "Nee", fear: "Nee", work: "Met moeite", goal: "Weer zonder pijn kunnen werken (stratenmaker)", slot: "ma 13 okt · 14:00", mins: 95 },
  { name: "Ingrid Smit", age: "57", area: "Onderrug", duration: "Langer dan 3 maanden", onset: "Vanzelf, geleidelijk", pain: "5", radiation: "Tot onder de knie", cauda: "Nee", weakness: "Nee", cancer: "Nee", weight: "Nee", night: "Nee", fever: "Nee", fear: "Ja, erg", work: "Nee, ik zit thuis", goal: "Weer aan het werk kunnen", mins: 210 },
  { name: "Youssef El Amrani", age: "45", area: "Onderrug", duration: "1 tot 6 weken", onset: "Vanzelf, geleidelijk", pain: "4", radiation: "Tot in bil of bovenbeen", cauda: "Nee", weakness: "Nee", cancer: "Nee", weight: "Nee", night: "Nee", fever: "Nee", fear: "Een beetje", work: "Ja, gewoon", goal: "Weer voetballen op zondag", slot: "di 14 okt · 08:45", mins: 1440 },
];

function seedInbox() {
  items = BACKLOG.map(b => ({ answers: b, t: triage(b), time: today(b.mins), slot: b.slot || null }));
  renderInbox();
  select(0);
}

// ---------- Brand switch & scenario's ----------
function setBrand(key) {
  brand = BRANDS[key];
  document.body.dataset.brand = key;
  $("#practiceName").textContent = brand.name;
  $("#practiceName2").textContent = brand.name;
  $("#practiceLogo").textContent = brand.short;
  document.querySelectorAll(".brand-btn").forEach(b => {
    const on = b.dataset.brand === key;
    b.classList.toggle("active", on); b.setAttribute("aria-checked", on);
  });
  if (current) renderDetail();
  runChat();
}
document.querySelectorAll(".brand-btn").forEach(b => b.onclick = () => setBrand(b.dataset.brand));
document.querySelectorAll("[data-scenario]").forEach(b => b.onclick = () => {
  document.getElementById("phone").scrollIntoView({ behavior: "smooth", block: "center" });
  runChat(PRESETS[b.dataset.scenario]);
});

seedInbox();
runChat();
