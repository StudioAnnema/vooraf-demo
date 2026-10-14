// Vooraf — klikbare demo. Alle logica draait lokaal in de browser; er wordt niets verstuurd.
// Vragen en regels staan in screening-data.js (concept, nog niet klinisch gevalideerd).

const BRANDS = {
  duinen: { name: "Fysio De Duinen", short: "DD", phone: "071 – 123 45 67" },
  oost: { name: "FysioCentrum Oost", short: "FO", phone: "020 – 765 43 21" },
  beweeg: { name: "Beweegpraktijk Lisse", short: "BL", phone: "0252 – 41 22 33" },
};
let brand = BRANDS.duinen;

const ROUTES = {
  groen: { label: "Groen", title: "Pluis — geschikt voor fysiotherapie", conclusie: "PLUIS", indicatie: "Ja", action: "Intake inplannen; patiënt heeft zelf een tijd gekozen." },
  oranje: { label: "Oranje", title: "Eerst even bellen", conclusie: "NADER TE BEPALEN (aandachtspunt)", indicatie: "Na telefonisch contact", action: "Fysiotherapeut belt patiënt vandaag om de aandachtspunten na te vragen en beslist daarna: intake of huisarts." },
  rood: { label: "Rood", title: "Niet-pluis — eerst naar de huisarts", conclusie: "NIET-PLUIS", indicatie: "Nee, eerst medische beoordeling", action: "" },
  spoed: { label: "Spoed", title: "Niet-pluis — direct medische zorg", conclusie: "NIET-PLUIS (SPOED)", indicatie: "Nee", action: "" },
};
const TERMIJN_TEXT = {
  vandaag: "vandaag nog (buiten kantoortijden: huisartsenpost)",
  "2 werkdagen": "binnen 2 werkdagen",
  regulier: "via een gewone afspraak",
};
function routeAction(r, it) {
  if (r.level === "groen" && it) {
    if (it.slot) return `Intake ingepland op ${it.slot} (door patiënt zelf gekozen).`;
    if (it.extern) return "Patiënt is doorgestuurd naar de online afsprakenpagina van de praktijk om zelf een intake te plannen.";
  }
  if (r.level === "rood") return `Patiënt is geadviseerd ${TERMIJN_TEXT[r.termijn]} contact op te nemen met de huisarts. Conceptbrief (DTF-bericht) staat klaar. Praktijk belt patiënt vandaag na.`;
  if (r.level === "spoed") return r.call112
    ? "Patiënt is geadviseerd direct 112 te bellen. Praktijk heeft een sms-melding gekregen en belt na."
    : "Patiënt is geadviseerd direct de huisarts of huisartsenpost te bellen. Praktijk heeft een sms-melding gekregen en belt na.";
  return ROUTES[r.level].action;
}

function patientOutcome(r, a) {
  const p = brand.name, n = first(a.naam);
  if (r.level === "spoed") return { cls: "alert", text: r.call112
    ? `<b>Belangrijk, ${n}.</b> Wat je beschrijft moet <b>direct</b> door een arts bekeken worden.<br><br>🚑 <b>Bel nu 112.</b><br><br>${p} is op de hoogte en neemt later contact met je op.`
    : `<b>Belangrijk, ${n}.</b> Wat je beschrijft moet <b>vandaag nog</b> door een arts bekeken worden.<br><br>📞 Bel nu je huisarts, of buiten kantoortijden de <b>huisartsenpost</b>.<br>🚑 Wordt het snel erger${a.regioKey === "rug" ? " of kun je je benen niet meer bewegen" : ""}? Bel <b>112</b>.<br><br>${p} is op de hoogte en belt je ook.` };
  if (r.level === "rood") return { cls: "warn", text:
    `Dank je wel, ${n}. Door een paar van je antwoorden is het verstandig dat je <b>eerst je huisarts</b> bezoekt, <b>${TERMIJN_TEXT[r.termijn]}</b>. Dit is een voorzorg: de huisarts kan onderzoeken doen die een fysiotherapeut niet kan.<br><br>Een fysiotherapeut van ${p} belt je vandaag om het toe te lichten.` };
  if (r.level === "oranje") return { cls: "", text:
    `Dank je wel, ${n}! Een fysiotherapeut van ${p} bekijkt je antwoorden vandaag en <b>belt je</b> om samen de beste volgende stap te kiezen.` };
  return { cls: "ok", text: `Dank je wel, ${n}! Je klachten passen goed bij fysiotherapie. ${agendaMode === "extern" && agendaUrl ? "Je kunt nu zelf je eerste afspraak plannen." : "Kies hieronder een dag en tijd voor je eerste afspraak."}` };
}

// ---------- Helpers ----------
const $ = s => document.querySelector(s);
const chat = $("#chat"), input = $("#chatInput");
const sleep = ms => new Promise(r => setTimeout(r, ms));
function first(n) { return (n || "").trim().split(/\s+/)[0] || "daar"; }
function esc(s) { return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function stamp(offsetMin = 0) {
  const d = new Date(Date.now() - offsetMin * 60000);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso) { const [y, m, d] = String(iso).split("-"); return d ? `${d}-${m}-${y}` : iso; }
function ageFrom(iso) {
  const b = new Date(iso), n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) age--;
  return age;
}
function show(v, q) {
  if (Array.isArray(v)) return v.join(", ");
  if (q && q.type === "date") return fmtDate(v);
  return v ?? "—";
}
function regionKey(label) { return Object.keys(REGIONS).find(k => REGIONS[k] === label) || "anders"; }

function addMsg(html, who = "bot", cls = "") {
  const el = document.createElement("div");
  el.className = `msg ${who} ${cls}`;
  el.innerHTML = html;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}
// Voorbeelden lopen altijd in een rustig, goed te volgen tempo.
const SPEEDS = { rustig: 1 };
const speed = "rustig";
let intake = "link";
// Ingesloten modus: alleen de chat, voor op de website van een praktijk (via widget.js of QR-code).
const EMBED = new URLSearchParams(location.search).has("embed");
if (EMBED) { document.body.classList.add("embed"); intake = "web"; }

async function botSay(html, cls, run) {
  const t = addMsg("typt…", "bot", "typing");
  const len = html.replace(/<[^>]+>/g, "").length;
  const ms = auto ? Math.min(800 + len * 16, 3200) * SPEEDS[speed] : Math.min(350 + len * 5, 1200);
  await sleep(ms);
  if (run !== runId) { t.remove(); throw "cancel"; }
  t.className = `msg bot ${cls || ""}`; t.innerHTML = html;
  chat.scrollTop = chat.scrollHeight;
}

const STEPS = ["Over je klacht", "Vragen over je klachtgebied", "Je gezondheid", "Afronden"];
function setProgress(step, label, done = false) {
  $("#progLabel").textContent = done ? "Klaar" : label || STEPS[step - 1];
  $("#progStep").textContent = done ? "✓" : `Stap ${step} van 4`;
  $("#progBar").style.width = done ? "100%" : `${(step - 1) * 25 + 8}%`;
}

// ---------- Chat engine ----------
let runId = 0, auto = null;

function askUI(q) {
  return new Promise(resolve => {
    input.innerHTML = "";
    if (q.type === "single") {
      q.options.forEach(o => {
        const b = document.createElement("button");
        b.className = "opt"; b.textContent = o;
        b.onclick = () => resolve(o);
        input.appendChild(b);
      });
    } else if (q.type === "multi") {
      const picked = new Set();
      const next = document.createElement("button");
      next.className = "opt-next"; next.textContent = "Verder →"; next.disabled = true;
      const btns = q.options.map(o => {
        const b = document.createElement("button");
        b.className = "opt"; b.textContent = o; b.setAttribute("aria-pressed", "false");
        b.onclick = () => {
          if (picked.has(o)) picked.delete(o);
          else {
            if (o === NONE) picked.clear(); else picked.delete(NONE);
            picked.add(o);
          }
          btns.forEach(x => { const on = picked.has(x.textContent); x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
          next.disabled = picked.size === 0;
        };
        input.appendChild(b);
        return b;
      });
      next.onclick = () => resolve(q.options.filter(o => picked.has(o)));
      input.appendChild(next);
    } else {
      const f = document.createElement("form");
      const today = new Date().toISOString().slice(0, 10);
      f.innerHTML = q.type === "tel"
        ? `<input type="tel" inputmode="tel" autocomplete="tel" placeholder="${esc(q.ph || "")}" aria-label="Telefoonnummer" required><button type="submit">Stuur</button>`
        : q.type === "date"
        ? `<input type="date" max="${today}" min="1910-01-01" aria-label="${esc(q.q)}" required><button type="submit">Stuur</button>`
        : `<input type="text" placeholder="${esc(q.ph || "")}" aria-label="${esc(q.q)}" required><button type="submit">Stuur</button>`;
      f.onsubmit = e => {
        e.preventDefault();
        const inp = f.querySelector("input"), v = inp.value.trim();
        if (q.type === "tel" && !validTel(v)) {
          inp.setCustomValidity("Vul een geldig telefoonnummer in, bijv. 06 12345678");
          inp.reportValidity();
          inp.oninput = () => inp.setCustomValidity("");
          return;
        }
        if (v) resolve(v);
      };
      input.appendChild(f);
      if (!auto) f.querySelector("input").focus({ preventScroll: true });
    }
  });
}

function autoValue(q) {
  if (auto[q.id] !== undefined) return auto[q.id];
  if (q.type === "multi") return q.options.includes(NONE) ? [NONE] : [];
  if (q.type === "single") return q.options[0];
  if (q.type === "tel") return "06 12345678";
  return "—";
}

async function answer(q, run) {
  let v;
  if (auto) { await sleep((q.type === "multi" ? 2200 : 1400) * SPEEDS[speed]); v = autoValue(q); }
  else v = await askUI(q);
  if (run !== runId) throw "cancel";
  input.innerHTML = "";
  addMsg(esc(show(v, q)), "user");
  return v;
}

// Korte, menselijke reacties op sommige antwoorden
function reaction(q, a) {
  const v = a[q.id];
  if (q.id === "pijn") return +v >= 7 ? "Dat is flink. Vervelend dat je zoveel pijn hebt." : +v <= 3 ? "Gelukkig is de pijn nog redelijk te doen." : "Duidelijk, dank je.";
  if (q.id === "duur" && v === "Langer dan 3 maanden") return "Dat is al een tijd. Goed dat je er nu hulp bij zoekt.";
  if (q.id === "angst" && v === "Ja, erg") return "Heel begrijpelijk. Een fysiotherapeut kan je helpen om weer met vertrouwen te bewegen.";
  if (q.id === "stemming" && v === "Vaak") return "Dank je dat je dat deelt. De fysiotherapeut neemt het mee.";
  if (q.id === "klacht") return "Dank je. Dan wil ik eerst wat meer weten over hoe het begon.";
  return null;
}

async function runChat(preset = null) {
  const run = ++runId;
  auto = preset;
  chat.innerHTML = ""; input.innerHTML = "";
  setProgress(1, "Welkom");
  const a = {};
  try {
    if (intake === "link") {
      // Patiënt kreeg een persoonlijke link van de praktijk: naam en geboortedatum zijn al bekend.
      const pt = preset ? { naam: preset.naam, geb: preset.geb } : { naam: "Alex Jansen", geb: "1988-07-21" };
      Object.assign(a, pt, { age: ageFrom(pt.geb), _known: true, _knownTel: (preset && preset.tel) || "06 1234 5678" });
      await botSay(`Hoi ${esc(first(a.naam))}! 👋 Fijn dat je je hebt aangemeld bij <b>${brand.name}</b>. Ik ben de digitale assistent van de praktijk.`, "", run);
      await botSay("Ik stel je wat vragen over je klacht, zodat de fysiotherapeut je meteen goed kan helpen. Het duurt ongeveer 5 minuten, en je kunt gewoon op de knoppen tikken.", "", run);
    } else {
      await botSay(`Hoi! 👋 Ik ben de digitale assistent van <b>${brand.name}</b>. Ik stel je wat vragen over je klacht, zodat de fysiotherapeut je meteen goed kan helpen. Het duurt ongeveer 5 minuten.`, "", run);
    }
    await botSay(`Je antwoorden worden versleuteld opgeslagen en alleen gedeeld met ${brand.name}. Ga je akkoord?`, "", run);
    const c = await answer({ id: "consent", type: "single", options: ["Akkoord", "Liever niet"] }, run);
    if (c !== "Akkoord") { await botSay(`Geen probleem. Je kunt de praktijk ook bellen op ${brand.phone}.`, "", run); return; }
    if (a._known) {
      await botSay(`Even ter controle: is je geboortedatum <b>${fmtDate(a.geb)}</b>?`, "", run);
      const ok = await answer({ id: "check", type: "single", options: ["Ja, dat klopt", "Nee"] }, run);
      if (ok !== "Ja, dat klopt") {
        await botSay("Geen probleem, dan vraag ik je gegevens even opnieuw.", "", run);
        delete a.naam; delete a.geb; delete a._knownTel; a._known = false;
      }
    }

    const firstRegionQ = () => (Q_REGION[a.regioKey] || [])[0];
    for (let i = 0; ; i++) {
      const list = questionFlow(a);
      if (i >= list.length) break;
      const q = list[i];
      if (q.show && !safe(q.show, a)) continue;
      const text = typeof q.q === "function" ? q.q(a) : q.q;
      if (q === firstRegionQ()) {
        setProgress(2, `Vragen over je ${a.regio.toLowerCase()}`);
        if (a.regioKey !== "anders") {
          await botSay(`Dan nu een paar vragen die specifiek bij je <b>${a.regio.toLowerCase()}</b> horen.`, "", run);
          await botSay("Sommige vragen klinken misschien wat vreemd, maar we stellen ze iedereen voor de zekerheid.", "", run);
        }
      }
      if (q.id === Q_GENERAL[0].id) { setProgress(3); await botSay("Goed bezig! Nu een paar algemene vragen over je gezondheid. Die stellen we iedereen.", "", run); }
      if (q.id === Q_PROGNOSIS[0].id) { setProgress(4); await botSay("Bijna klaar. Nog een paar vragen over hoe het met je gaat. Daarmee kan de fysiotherapeut beter inschatten wat je nodig hebt.", "", run); }
      await botSay(q.id === "geb" && a.naam ? `Dank je, ${esc(first(a.naam))}. ${text}` : text, "", run);
      a[q.id] = await answer(q, run);
      if (q.id === "geb") {
        a.age = ageFrom(a.geb);
        if (a.age < 16) await botSay("Omdat je jonger bent dan 16, vragen we je dit samen met je ouder of verzorger in te vullen.", "", run);
      }
      if (q.id === "regio") a.regioKey = regionKey(a.regio);
      if (q.stop && safe(q.stop, a)) { a._stopped = true; break; }
      const re = reaction(q, a);
      if (re) await botSay(re, "", run);
    }

    const r = evaluate(a);
    if (!a._stopped) {
      await botSay(`Dank je wel! Even op een rij:<ul>
        <li><b>Klacht:</b> ${esc(a.regio)}${a.klacht && a.klacht !== "—" ? " — " + esc(a.klacht) : ""}</li>
        <li><b>Sinds:</b> ${esc((a.duur || "").toLowerCase())}</li>
        <li><b>Pijn:</b> ${esc(a.pijn)} van de 10</li>
        ${a.doel && a.doel !== "—" ? `<li><b>Je doel:</b> ${esc(a.doel)}</li>` : ""}</ul>`, "summary", run);
      await botSay("Ik zet je antwoorden klaar voor de fysiotherapeut…", "", run);
    }
    setProgress(4, "", true);
    const out = patientOutcome(r, a);
    await botSay(out.text, out.cls, run);
    let slot = null, extern = false;
    if (r.level === "groen") {
      if (agendaMode === "extern" && agendaUrl) {
        extern = true;
        await botSay(`Plan je intake in onze online agenda:<br><a class="chat-link" href="${esc(agendaUrl)}" target="_blank" rel="noopener noreferrer">Open de agenda van ${esc(brand.name)} ↗</a>`, "", run);
      } else {
        const days = agendaDays();
        const day = await answer({ id: "dag", type: "single", options: days.map(d => d.label) }, run);
        await botSay(`Op ${day} zijn deze tijden nog vrij (intake van ${intakeMin} minuten):`, "", run);
        const tijd = await answer({ id: "tijd", type: "single", options: days.find(d => d.label === day).times }, run);
        slot = `${day} · ${tijd}`;
        await botSay(`Top, je afspraak staat op <b>${slot}</b>. Je krijgt een bevestiging per mail.`, "", run);
      }
    }
    await contactBlock(r, a, run);
    if (r.level === "groen") await botSay("Tot snel! 💪", "", run);
    addToInbox({ answers: a, r, time: stamp(), slot, extern, fresh: true });
  } catch (e) {
    if (e !== "cancel") console.error(e);
  } finally {
    if (run === runId) auto = null;
  }
}

// ---------- Agenda ----------
let agendaMode = "vooraf", agendaUrl = "", intakeMin = 45;
const TIME_SETS = [["08:30", "10:15", "13:45", "16:30"], ["09:00", "11:30", "15:00"], ["08:00", "12:15", "14:30", "17:15"]];
function agendaDays() {
  const out = [], d = new Date();
  while (out.length < 3) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const label = d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" }).replace(".", "");
    out.push({ label, times: TIME_SETS[out.length] });
  }
  return out;
}

// ---------- Terugbellen ----------
function validTel(v) { const digits = v.replace(/\D/g, ""); return /^[+0-9][0-9 ()-]*$/.test(v.trim()) && digits.length >= 10 && digits.length <= 13; }
async function contactBlock(r, a, run) {
  if (r.level === "groen") {
    await botSay("Wil je dat de fysiotherapeut je vóór de afspraak even belt? Dat mag altijd.", "", run);
    a.bellen = await answer({ id: "bellen", type: "single", options: ["Ja, graag", "Nee, niet nodig"] }, run);
    if (a.bellen !== "Ja, graag") return;
  } else {
    a.bellen = "Ja (nodig)";
  }
  if (a._knownTel) {
    await botSay(`Kunnen we je bereiken op <b>${esc(a._knownTel)}</b>?`, "", run);
    const ok = await answer({ id: "telok", type: "single", options: ["Ja, dat klopt", "Nee, ander nummer"] }, run);
    if (ok === "Ja, dat klopt") a.tel = a._knownTel;
  }
  if (!a.tel) {
    await botSay("Op welk telefoonnummer kan de fysiotherapeut je bellen?", "", run);
    a.tel = await answer({ id: "tel", type: "tel", ph: "Bijv. 06 12345678" }, run);
  }
  if (r.level === "spoed") { await botSay("Dank je. Bel nu eerst zelf, zoals hierboven staat. De praktijk belt je daarna.", "", run); return; }
  await botSay("Wanneer ben je het best bereikbaar?", "", run);
  a.bereik = await answer({ id: "bereik", type: "single", options: ["Maakt niet uit", "Ochtend", "Middag", "Eind van de middag"] }, run);
  await botSay(r.level === "groen" ? "Genoteerd, de fysiotherapeut belt je." : "Genoteerd. Je wordt vandaag gebeld.", "", run);
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
    const a = it.answers, r = it.r;
    const top = r.hits.find(f => f.level === r.level);
    const li = document.createElement("li");
    if (it.fresh) { li.classList.add("new"); it.fresh = false; }
    li.innerHTML = `<span class="status ${r.level}">${ROUTES[r.level].label}</span>
      <span class="who"><b>${esc(a.naam)}, ${esc(a.age)} jr</b><small>${esc(a.regio)} · ${esc(top ? top.cluster : "Geen alarmsignalen")}</small></span>
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
  const it = current, a = it.answers, r = it.r, route = ROUTES[r.level];
  const alarms = r.hits.filter(f => f.level !== "info").sort((x, y) => LEVEL_RANK[y.level] - LEVEL_RANK[x.level]);
  const notes = r.hits.filter(f => f.level === "info");
  const showLetter = r.level === "rood" || r.level === "spoed" || a.toestemming === "Ja";
  const flagHtml = alarms.length
    ? alarms.map(f => `<li class="flag-row"><span class="status ${f.level}">${f.level === "rood" ? "Rood · " + f.termijn : ROUTES[f.level].label}</span><span>${esc(f.label)}<small>${esc(SRC[f.src])}</small></span></li>`).join("")
    : `<li class="flag-row"><span class="status groen">Geen</span><span>Geen rode vlaggen gevonden</span></li>`;
  const fact = (k, v) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : "";
  $("#detail").innerHTML = `
    <div class="detail-top">
      <div>
        <span class="status ${r.level}">${route.label} · ${route.title}</span>
        <h3>${esc(a.naam)}, ${esc(a.age)} jaar</h3>
        <span class="muted">Screening ingevuld ${it.time}${it.slot ? ` · afspraak ${esc(it.slot)}` : it.extern ? " · plant zelf via online agenda" : ""}${a._stopped ? " · vragenlijst gestopt na alarmsignaal" : ""}</span>
      </div>
    </div>
    <div class="route-box ${r.level}"><strong>Doorverwijzing</strong>${esc(routeAction(r, it))}</div>
    ${a.tel ? `<div class="callback"><div><strong>📞 Terugbellen${r.level === "groen" ? " (op verzoek van patiënt)" : ""}</strong><span>${esc(a.tel)}${a.bereik ? " · bereikbaar: " + esc(a.bereik.toLowerCase()) : ""}</span></div><a class="btn btn-small" href="tel:${esc(a.tel.replace(/[^+0-9]/g, ""))}">Bel patiënt</a></div>` : ""}
    <dl class="facts">
      ${fact("Hulpvraag", a.doel)}${fact("Klacht", a.klacht)}${fact("Voorlopige indeling", r.classification)}${fact("Duur", a.duur)}
      ${fact("Ontstaan", a.ontstaan)}${fact("Pijn (NPRS)", a.pijn && a.pijn + "/10")}${fact("Beloop", a.beloop)}
      ${fact("Risico aanhoudende klachten", a._stopped ? "" : `${r.risk} (${r.prognostic.length} factoren)`)}
    </dl>
    <p class="mono label">Rode vlaggen</p>
    <ul class="flag-list">${flagHtml}</ul>
    ${notes.length ? `<p class="mono label">Aandachtspunten voor de intake</p><ul class="note-list">${notes.map(f => `<li>${esc(f.label)}</li>`).join("")}</ul>` : ""}
    <div class="tabs" role="tablist">
      <button class="tab ${currentTab === "report" ? "active" : ""}" data-tab="report">Conceptverslag</button>
      ${showLetter ? `<button class="tab ${currentTab === "letter" ? "active" : ""}" data-tab="letter">Bericht aan huisarts</button>` : ""}
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

const BELOOP_CODE = {
  "Het wordt erger": "Klachten zijn in de loop van de tijd toegenomen",
  "Het wordt minder": "Klachten zijn in de loop van de tijd afgenomen",
  "Het blijft gelijk": "Klachten zijn in de loop van de tijd niet gewijzigd",
  "Het wisselt": "Klachten zijn wisselend van karakter",
};

function asked(a) {
  const all = questionFlow(a);
  return all.filter(q => a[q.id] !== undefined);
}

function tabText(tab, it) {
  const a = it.answers, r = it.r, route = ROUTES[r.level];
  if (tab === "raw") {
    return asked(a).map(q => `${typeof q.q === "function" ? q.q(a) : q.q}\n→ ${show(a[q.id], q)}`).join("\n\n")
      + (a._stopped ? "\n\n(Vragenlijst gestopt na spoedsignaal.)" : "");
  }
  const alarms = r.hits.filter(f => f.level !== "info");
  const notes = r.hits.filter(f => f.level === "info");
  if (tab === "letter") {
    const noConsent = a.toestemming === "Nee";
    return `${noConsent ? "LET OP: patiënt gaf GEEN toestemming om de huisarts te informeren.\nDit bericht alleen aan de patiënt zelf meegeven.\n\n" : ""}DTF-BERICHT AAN DE HUISARTS
Aan: ${a.huisarts && a.huisarts !== "—" ? a.huisarts : "huisarts van patiënt"}
Van: ${brand.name}
Betreft: ${a.naam}, geb. ${fmtDate(a.geb)}

Geachte collega,

Uw patiënt(e) meldde zich op ${it.time} zonder verwijzing bij onze praktijk met ${(a.regio || "").toLowerCase()}klachten (${(a.duur || "").toLowerCase()}). Bij de screening in het kader van de directe toegankelijkheid kwam het volgende naar voren:

${alarms.length ? alarms.map(f => "  • " + f.label).join("\n") : "  • Geen rode vlaggen; patroon herkenbaar voor fysiotherapie."}

Conclusie screening: ${route.conclusie}.
${r.level === "rood" || r.level === "spoed"
  ? `Wij hebben patiënt(e) geadviseerd ${r.level === "spoed" ? (r.call112 ? "direct 112 te bellen" : "u direct te bellen, of buiten kantoortijden de huisartsenpost") : "u " + TERMIJN_TEXT[r.termijn] + " te raadplegen"}. Wij starten geen behandeling voordat deze signalen medisch zijn beoordeeld.`
  : `Wij starten met fysiotherapeutisch onderzoek en houden u op de hoogte.`}

Voor vragen zijn wij bereikbaar via ${brand.phone}.

Met collegiale groet,

[naam fysiotherapeut], fysiotherapeut
${brand.name}`;
  }
  const regionQs = (Q_REGION[a.regioKey] || []).filter(q => a[q.id] !== undefined);
  return `SCREENING DIRECTE TOEGANKELIJKHEID — CONCEPT
${brand.name} · ${it.time}
(Opbouw volgens KNGF-richtlijn Fysiotherapeutische dossiervoering 2019)

PATIËNT
Naam: ${a.naam}
Geboortedatum: ${fmtDate(a.geb)} (${a.age} jaar)
BSN: aanvullen via praktijkadministratie
Huisarts: ${a.huisarts || "niet gevraagd"}

CONTACTREDEN EN HULPVRAAG
Contactreden: ${a.klacht || "—"}
Hulpvraag: ${a.doel || "niet gevraagd (vragenlijst gestopt)"}

FUNCTIONERINGSPROBLEMEN, DUUR EN BELOOP
Klachtgebied: ${a.regio}${a.x_waar ? " — " + a.x_waar : ""}
Duur: ${a.duur || "—"}. Ontstaan: ${a.ontstaan || "—"}${a.trauma ? " (" + a.trauma.split(" (")[0].toLowerCase() + " trauma)" : ""}.
Beloop: ${BELOOP_CODE[a.beloop] || "—"}.
Pijn (NPRS): ${a.pijn ?? "—"}/10.
Beperkingen dagelijks leven: ${a.adl || "—"}. Werk: ${a.werk || "—"}.
${regionQs.length ? "\nRegiospecifiek (" + a.regio.toLowerCase() + "):\n" + regionQs.map(q => "  - " + q.q + " " + show(a[q.id], q)).join("\n") + "\n" : ""}
MEDISCHE GEZONDHEIDSDETERMINANTEN
Algemene klachten: ${show(a.alg)}. Nachtpijn: ${a.nacht || "—"}.
Voorgeschiedenis: ${show(a.vg)}.
Medicatie: ${show(a.med)}.
Operatie < 3 maanden: ${a.operatie || (a.ontstaan === "Na een operatie" ? "Ja" : "—")}.

PERSOONLIJKE DETERMINANTEN EN PROGNOSE
Bewegingsangst: ${a.angst || "—"}. Somberheid/piekeren: ${a.stemming || "—"}. Verwachting herstel: ${a.verwacht || "—"}.
Prognostische factoren aanhoudende klachten: ${r.prognostic.length ? r.prognostic.join("; ") : "geen"}.
Indicatief risico: ${a._stopped ? "n.v.t." : r.risk}.

SCREENING
Rode vlaggen: ${alarms.length ? "\n" + alarms.map(f => `  - ${f.label} [${f.level}${f.termijn ? ", " + f.termijn : ""}] — ${SRC[f.src]}`).join("\n") : "geen"}
Aandachtspunten: ${notes.length ? "\n" + notes.map(f => "  - " + f.label).join("\n") : "geen"}
Voorlopige indeling: ${r.classification}

CONCLUSIE SCREENING: ${route.conclusie}
Indicatie verder fysiotherapeutisch onderzoek: ${route.indicatie}
Toestemming overleg/DTF-bericht huisarts: ${a.toestemming || "niet gevraagd (spoed)"}
Terugbelverzoek: ${a.tel ? a.tel + (a.bereik ? " (" + a.bereik.toLowerCase() + ")" : "") : "nee"}
Advies/vervolg: ${routeAction(r, it)}

— Opgesteld door Vooraf op basis van de antwoorden van patiënt.
  Te controleren en aan te vullen door de behandelend fysiotherapeut.`;
}

// ---------- Presets ----------
const PRESETS = {
  groen: { naam: "Sanne de Vries", geb: "1992-03-14", regio: "Onderrug", klacht: "Pijn onderin mijn rug sinds het verhuizen", duur: "1 tot 6 weken", ontstaan: "Na tillen, een verkeerde beweging of overbelasting", beloop: "Het wordt minder", pijn: "6", angst: "Een beetje", adl: "Behoorlijk", werk: "Ja, vooral zittend of licht werk", doel: "Weer met de kinderen spelen en hardlopen", huisarts: "dr. Bakker, Noordwijk" },
  rood: { naam: "Henk Jansen", geb: "1962-06-02", regio: "Onderrug", klacht: "Zeurende rugpijn die maar niet overgaat", duur: "6 tot 12 weken", ontstaan: "Vanzelf, zonder duidelijke reden", beloop: "Het wordt erger", pijn: "7", alg: ["Afgevallen zonder reden (meer dan 5 kg)", "Erg moe of algemeen ziek"], nacht: "Ja", vg: ["Kanker (nu of vroeger)"], adl: "Behoorlijk", werk: "Nee / niet van toepassing", doel: "Weer de tuin kunnen doen", huisarts: "dr. Visser, Katwijk" },
  spoed: { naam: "Lotte Bakker", geb: "1985-11-23", regio: "Onderrug", klacht: "Rugpijn met uitstraling naar mijn been", duur: "Korter dan 1 week", ontstaan: "Na tillen, een verkeerde beweging of overbelasting", beloop: "Het wordt erger", pijn: "8", r_uitstr: "Tot onder de knie", r_tint: "Ja", r_cauda: "Ja" },
  nek: { naam: "Peter de Wit", geb: "1979-01-30", regio: "Nek", klacht: "Nekpijn na een duik in het zwembad", duur: "Korter dan 1 week", ontstaan: "Na een ongeluk, val of sportblessure", trauma: "Licht (bijv. struikelen, verzwikken)", beloop: "Het blijft gelijk", pijn: "6", n_cad: ["Duizeligheid", "Dubbelzien of wazig zien"] },
  enkel: { naam: "Emma Hendriks", geb: "2003-08-09", regio: "Enkel of voet", klacht: "Enkel verzwikt bij hockey", duur: "Korter dan 1 week", ontstaan: "Na een ongeluk, val of sportblessure", trauma: "Licht (bijv. struikelen, verzwikken)", beloop: "Het blijft gelijk", pijn: "7", e_lopen: "Nee", e_druk: "Ja", adl: "Heel veel", werk: "Ja, vooral zittend of licht werk", doel: "Weer hockeyen", huisarts: "dr. Smit, Leiden" },
};
const BACKLOG = [
  { naam: "Ingrid Smit", geb: "1958-04-11", regio: "Knie", klacht: "Stijve, pijnlijke knie bij traplopen", duur: "Langer dan 3 maanden", ontstaan: "Vanzelf, zonder duidelijke reden", beloop: "Het wisselt", pijn: "5", k_stijf: "Ja, korter dan 30 minuten", eerder: "Ja, eerder", adl: "Behoorlijk", werk: "Nee / niet van toepassing", doel: "Weer fietsen met mijn kleinkinderen", huisarts: "dr. Bakker, Noordwijk", toestemming: "Ja", slotAt: [0, 2], bellen: "Nee, niet nodig", mins: 95 },
  { naam: "Willem Kok", geb: "1953-09-18", regio: "Schouder", klacht: "Pijn en stijfheid in beide schouders", duur: "1 tot 6 weken", ontstaan: "Vanzelf, zonder duidelijke reden", beloop: "Het wordt erger", pijn: "6", s_pmr: "Ja", alg: ["Erg moe of algemeen ziek"], adl: "Heel veel", werk: "Nee / niet van toepassing", doel: "'s Ochtends weer zelf mijn jas aantrekken", huisarts: "dr. Visser, Katwijk", bellen: "Ja (nodig)", tel: "071 512 3344", bereik: "Middag", mins: 210 },
  { naam: "Youssef El Amrani", geb: "1981-02-05", regio: "Nek", klacht: "Stijve nek na lange dagen achter de laptop", duur: "1 tot 6 weken", ontstaan: "Na tillen, een verkeerde beweging of overbelasting", beloop: "Het blijft gelijk", pijn: "4", adl: "Behoorlijk", werk: "Ja, vooral zittend of licht werk", angst: "Een beetje", doel: "Weer zonder hoofdpijn werken", huisarts: "dr. Smit, Leiden", toestemming: "Ja", slotAt: [1, 0], bellen: "Ja, graag", tel: "06 4821 7730", bereik: "Ochtend", mins: 1440 },
];

function fill(p) {
  // vul niet-opgegeven antwoorden aan met het eerste (onschuldige) antwoord, zoals autoplay doet
  const a = { ...p };
  a.age = ageFrom(a.geb); a.regioKey = regionKey(a.regio);
  for (const q of questionFlow(a)) {
    if (q.show && !safe(q.show, a)) continue;
    if (a[q.id] === undefined) a[q.id] = q.type === "multi" ? (q.options.includes(NONE) ? [NONE] : []) : q.type === "single" ? q.options[0] : "—";
  }
  return a;
}

function seedInbox() {
  const days = agendaDays();
  items = BACKLOG.map(b => { const a = fill(b); const slot = b.slotAt ? `${days[b.slotAt[0]].label} · ${days[b.slotAt[0]].times[b.slotAt[1]]}` : null; return { answers: a, r: evaluate(a), time: stamp(b.mins), slot }; });
  renderInbox();
  select(0);
}

// ---------- Brand switch & scenario's ----------
function setBrand(key) {
  brand = BRANDS[key];
  document.body.dataset.brand = key;
  if (key === "eigen") {
    document.body.style.setProperty("--brand", brand.color);
    document.body.style.setProperty("--brand-soft", Huisstijl.soft(brand.color));
  } else {
    document.body.style.removeProperty("--brand");
    document.body.style.removeProperty("--brand-soft");
  }
  $("#practiceName").textContent = brand.name;
  $("#practiceName2").textContent = brand.name;
  const logoEl = $("#practiceLogo");
  if (brand.logo) { logoEl.innerHTML = ""; const img = new Image(); img.src = brand.logo; img.alt = ""; logoEl.appendChild(img); }
  else logoEl.textContent = brand.short;
  document.querySelectorAll(".brand-btn").forEach(b => {
    const on = b.dataset.brand === key;
    b.classList.toggle("active", on); b.setAttribute("aria-checked", on);
  });
  if (current) renderDetail();
  updateSiteLink(key);
  runChat();
}
document.querySelectorAll(".brand-btn:not(.brand-own)").forEach(b => b.onclick = () => setBrand(b.dataset.brand));

// ---------- Eigen praktijk ----------
const OWN_KEY = "vooraf-eigen-praktijk";
const own = { name: "", site: "", color: "#1F5F5B", logo: null, colorTouched: false };
const ownPanel = $("#ownPanel"), ownBtn = document.querySelector(".brand-own");

function ownStatus(t) { $("#ownStatus").textContent = t; }
function ownPreview() {
  const el = $("#ownLogo");
  el.style.setProperty("--own", own.color);
  if (own.logo) { el.innerHTML = ""; const img = new Image(); img.src = own.logo; img.alt = ""; el.appendChild(img); }
  else el.textContent = own.name ? Huisstijl.initials(own.name) : "?";
  $("#ownColor").value = own.color;
}
function useLogo(img, how) {
  own.logo = Huisstijl.toDataUrl(img);
  let note = "";
  if (!own.colorTouched) {
    const c = Huisstijl.extractColor(img);
    if (c) { own.color = Huisstijl.readable(c); note = " Huisstijlkleur automatisch gekozen."; }
    else note = " Geen duidelijke kleur gevonden; kies er zelf een.";
  }
  ownStatus(how + note);
  ownPreview();
}
let siteTimer = null, siteReq = 0;
async function fetchSiteLogo() {
  const h = Huisstijl.host($("#ownSite").value);
  own.site = h;
  if (!h) { if ($("#ownSite").value.trim()) ownStatus("Dat lijkt geen websiteadres. Bijv. jouwpraktijk.nl"); return; }
  const req = ++siteReq;
  ownStatus(`Logo ophalen van ${h}…`);
  try {
    const img = await Huisstijl.logoFromSite(h);
    if (req !== siteReq) return;
    useLogo(img, `Logo gevonden op ${h}.`);
  } catch {
    if (req !== siteReq) return;
    ownStatus(`Geen logo gevonden voor ${h}. Upload je logo of kies een kleur.`);
  }
}
$("#ownSite").addEventListener("input", () => { clearTimeout(siteTimer); siteTimer = setTimeout(fetchSiteLogo, 700); });
$("#ownSite").addEventListener("change", () => { clearTimeout(siteTimer); fetchSiteLogo(); });
$("#ownName").addEventListener("input", e => { own.name = e.target.value.trim(); ownPreview(); });
$("#ownColor").addEventListener("input", e => { own.color = Huisstijl.readable(e.target.value); own.colorTouched = true; ownPreview(); });
$("#ownFile").addEventListener("change", async e => {
  try { siteReq++; useLogo(await Huisstijl.logoFromFile(e.target.files[0]), "Logo geladen."); }
  catch (err) { ownStatus(err.message); }
});

function applyOwn() {
  own.name = $("#ownName").value.trim();
  if (!own.name) { ownStatus("Vul eerst de naam van je praktijk in."); $("#ownName").focus(); return false; }
  BRANDS.eigen = { name: own.name, short: Huisstijl.initials(own.name), phone: "het nummer van de praktijk", color: own.color, logo: own.logo };
  $("#ownSwatch").style.background = own.color; $("#ownSwatch").textContent = "";
  $("#ownBtnLabel").textContent = own.name;
  if (!EMBED) { try { localStorage.setItem(OWN_KEY, JSON.stringify({ name: own.name, site: own.site, color: own.color, logo: own.logo })); } catch {} }
  setBrand("eigen");
  return true;
}
ownPanel.addEventListener("submit", e => {
  e.preventDefault();
  if (applyOwn()) { ownPanel.hidden = true; ownBtn.setAttribute("aria-expanded", "false"); if (matchMedia("(max-width: 880px)").matches) document.getElementById("phone").scrollIntoView({ behavior: "smooth", block: "start" }); }
});
ownBtn.onclick = () => {
  const open = ownPanel.hidden;
  ownPanel.hidden = !open; ownBtn.setAttribute("aria-expanded", String(open));
  if (open) $("#ownName").focus();
  if (BRANDS.eigen && document.body.dataset.brand !== "eigen") setBrand("eigen");
};
$("#ownShare").onclick = async () => {
  own.name = $("#ownName").value.trim();
  if (!own.name) { ownStatus("Vul eerst de naam van je praktijk in."); return; }
  const u = new URL(location.href.split("?")[0]);
  u.searchParams.set("praktijk", own.name);
  if (own.site) u.searchParams.set("site", own.site);
  u.searchParams.set("kleur", own.color.slice(1));
  try { await navigator.clipboard.writeText(u.toString()); ownStatus("Deellink gekopieerd. Wie hem opent, ziet de demo in deze huisstijl."); }
  catch { ownStatus("Kopiëren lukte niet. Deellink: " + u.toString()); }
};

// ---------- Link naar de bot op een voorbeeldpraktijkwebsite ----------
const BRAND_COLORS = { duinen: "#1F5F5B", oost: "#8C3B2A", beweeg: "#33407A" };
function updateSiteLink(key) {
  const link = $("#siteDemoLink");
  if (!link) return;
  const p = new URLSearchParams({ praktijk: brand.name });
  if (key === "eigen" && own.site) p.set("site", own.site);
  p.set("kleur", (key === "eigen" ? own.color : BRAND_COLORS[key] || "#1F5F5B").slice(1));
  link.href = "voorbeeld-website.html?" + p.toString();
}

// Bij laden: eerst een deellink, anders wat eerder in deze browser is ingesteld.
async function restoreOwn() {
  const q = new URLSearchParams(location.search);
  let saved = null;
  if (q.get("praktijk")) {
    saved = { name: q.get("praktijk").slice(0, 40), site: Huisstijl.host(q.get("site") || ""), color: /^[0-9a-f]{6}$/i.test(q.get("kleur") || "") ? "#" + q.get("kleur") : null, logo: null };
  } else if (!EMBED) {
    try { saved = JSON.parse(localStorage.getItem(OWN_KEY) || "null"); } catch {}
  }
  if (!saved || !saved.name) return false;
  $("#ownName").value = own.name = saved.name;
  $("#ownSite").value = own.site = saved.site || "";
  own.logo = saved.logo || null;
  if (saved.color) { own.color = Huisstijl.readable(saved.color); own.colorTouched = true; }
  ownPreview();
  if (!own.logo && own.site) {
    try { const img = await Huisstijl.logoFromSite(own.site); useLogo(img, `Logo gevonden op ${own.site}.`); } catch {}
  }
  applyOwn();
  return true;
}

function segment(id, attr, set) {
  document.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => {
    document.querySelectorAll(`#${id} button`).forEach(x => x.classList.toggle("active", x === b));
    set(b.dataset[attr]);
  });
}
segment("intakeSeg", "intake", v => { intake = v; runChat(); });
segment("agendaSeg", "agenda", v => { agendaMode = v; $("#agendaExtern").hidden = v !== "extern"; if (v === "extern") $("#agendaUrl").focus(); });
$("#agendaUrl").addEventListener("change", e => {
  const v = e.target.value.trim();
  const ok = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#]\S*)?$/i.test(v);
  agendaUrl = ok ? (/^https?:/i.test(v) ? v : "https://" + v) : "";
  $("#agendaNote").textContent = v && !ok ? "Dat lijkt geen geldige link." : agendaUrl ? "Bij groen krijgt de patiënt een knop naar deze pagina." : "";
});
$("#intakeMin").addEventListener("change", e => { intakeMin = +e.target.value; });
document.querySelectorAll("[data-scenario]").forEach(b => b.onclick = () => {
  // Alleen op smalle schermen naar de telefoon scrollen; op desktop staat hij al in beeld.
  if (matchMedia("(max-width: 880px)").matches) document.getElementById("phone").scrollIntoView({ behavior: "smooth", block: "start" });
  runChat({ consent: "Akkoord", ...PRESETS[b.dataset.scenario] });
});

seedInbox();
restoreOwn().then(applied => { if (!applied) runChat(); });
