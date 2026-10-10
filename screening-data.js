// Vooraf — vragenlijst en screeningsregels (concept, nog niet klinisch gevalideerd).
// Alles wat de bot vraagt en concludeert staat in dit bestand, zodat een fysiotherapeut
// het kan nakijken zonder de rest van de code te lezen. De pagina regels.html toont het overzicht.

const SRC = {
  rug: "KNGF-richtlijn Lage rugpijn en LRS (2021), B.1",
  nek: "KNGF-richtlijn Nekpijn (2016), tabel 2–3",
  artrose: "KNGF-richtlijn Artrose heup-knie (2018), B.5.2",
  enkel: "KNGF-richtlijn Enkelletsel (2006, update 2017), B",
  dossier: "KNGF-richtlijn Fysiotherapeutische dossiervoering (2019), B.1",
  aanvulling: "Aanvulling Vooraf — geen KNGF-bron, extra laten toetsen",
};

const REGIONS = {
  rug: "Onderrug", nek: "Nek", schouder: "Schouder", knie: "Knie", heup: "Heup", enkel: "Enkel of voet", anders: "Iets anders",
};

// ---------- helpers voor regels ----------
const has = (v, x) => Array.isArray(v) && v.includes(x);
const yes = v => v === "Ja";
const isTrauma = a => a.ontstaan === "Na een ongeluk, val of sportblessure";
const highEnergy = a => isTrauma(a) && a.trauma === "Flink (bijv. val van hoogte, verkeersongeval, harde klap)";
const recent = a => a.duur === "Korter dan 1 week" || a.duur === "1 tot 6 weken";
const NONE = "Geen van deze";

// ---------- vragen ----------
// type: single | multi | text | date. show(a) bepaalt of een vraag gesteld wordt.
// stop(a) = true → vragenlijst stopt direct (spoedsignaal).
const Q_START = [
  { id: "naam", type: "text", q: "Wat is je voor- en achternaam?", ph: "Bijv. Sanne de Vries", show: a => !a._known },
  { id: "geb", type: "date", q: "Wat is je geboortedatum?", src: "dossier", show: a => !a._known },
  { id: "regio", type: "single", q: "Waar heb je vooral last van?", options: Object.values(REGIONS) },
  { id: "klacht", type: "text", q: "Beschrijf je klacht in een paar woorden.", ph: "Bijv. pijn onderin mijn rug na verhuizen", src: "dossier" },
  { id: "duur", type: "single", q: "Hoe lang heb je deze klacht al?", options: ["Korter dan 1 week", "1 tot 6 weken", "6 tot 12 weken", "Langer dan 3 maanden"], src: "dossier" },
  { id: "ontstaan", type: "single", q: "Hoe is het begonnen?", options: ["Na een ongeluk, val of sportblessure", "Na tillen, een verkeerde beweging of overbelasting", "Vanzelf, zonder duidelijke reden", "Na een operatie"] },
  { id: "trauma", type: "single", q: "Hoe heftig was het ongeluk of de val?", options: ["Licht (bijv. struikelen, verzwikken)", "Flink (bijv. val van hoogte, verkeersongeval, harde klap)"], show: isTrauma },
  { id: "beloop", type: "single", q: "Hoe gaat het sinds het begin?", options: ["Het wordt erger", "Het wordt minder", "Het blijft gelijk", "Het wisselt"], src: "dossier" },
  { id: "pijn", type: "single", q: "Hoeveel pijn heb je gemiddeld? 0 = geen pijn, 10 = ergst denkbare pijn.", options: ["0","1","2","3","4","5","6","7","8","9","10"] },
];

const Q_REGION = {
  rug: [
    { id: "r_uitstr", type: "single", q: "Straalt de pijn uit naar je been?", options: ["Nee, alleen in mijn rug", "Naar bil of bovenbeen", "Tot onder de knie"], src: "rug" },
    { id: "r_tint", type: "single", q: "Heb je tintelingen of een doof gevoel in je been of voet?", options: ["Nee", "Ja"], show: a => a.r_uitstr !== "Nee, alleen in mijn rug", src: "rug" },
    { id: "r_hoest", type: "single", q: "Wordt de pijn in je been erger bij hoesten, niezen of persen?", options: ["Nee", "Ja"], show: a => a.r_uitstr !== "Nee, alleen in mijn rug", src: "rug" },
    { id: "r_cauda", type: "single", q: "Heb je sinds de klachten een doof gevoel rond je billen of schaamstreek, of moeite met plassen of je ontlasting ophouden?", options: ["Nee", "Ja"], stop: a => yes(a.r_cauda), src: "rug" },
    { id: "r_kracht", type: "single", q: "Is je been of voet krachteloos? Bijvoorbeeld: je kunt niet op je hakken of tenen lopen, of je voet 'klapt' bij het lopen.", options: ["Nee", "Ja, in één been", "Ja, in beide benen"], stop: a => a.r_kracht === "Ja, in beide benen", src: "rug" },
    { id: "r_snel", type: "single", q: "Is dat krachtverlies de afgelopen 2 dagen ontstaan of snel erger geworden?", options: ["Nee", "Ja"], show: a => a.r_kracht === "Ja, in één been", stop: a => yes(a.r_snel), src: "rug" },
    { id: "r_claud", type: "single", q: "Krijg je alleen pijn in je benen bij staan of lopen, die overgaat als je gaat zitten of vooroverbuigt?", options: ["Nee", "Ja"], src: "rug" },
    { id: "r_infl", type: "multi", q: "Herken je een of meer van deze punten? (meerdere mogelijk)", options: ["'s Ochtends langer dan 30 minuten stijf", "Beter door bewegen, niet door rust", "'s Nachts wakker van de rugpijn", "Al meer dan 5 jaar rugpijn", "Bechterew, psoriasis of darmontsteking in de familie", NONE], src: "rug" },
  ],
  nek: [
    { id: "n_menin", type: "single", q: "Heb je hevige hoofdpijn met koorts en een stijve nek (je kunt je kin niet naar je borst buigen)?", options: ["Nee", "Ja"], stop: a => yes(a.n_menin), src: "aanvulling" },
    { id: "n_cad", type: "multi", q: "Heb je sinds de nekklachten last van een van deze dingen?", options: ["Duizeligheid", "Misselijkheid of braken", "Dubbelzien of wazig zien", "Moeite met praten of slikken", "Plotselinge zwakte in arm of been", NONE], stop: a => ["Dubbelzien of wazig zien", "Moeite met praten of slikken", "Plotselinge zwakte in arm of been"].some(x => has(a.n_cad, x)), src: "nek" },
    { id: "n_myelo", type: "multi", q: "Merk je een van deze dingen?", options: ["Onhandige handen (bijv. moeite met knoopjes of schrijven)", "Moeite met lopen of je evenwicht", "Tintelingen of doof gevoel in beide armen of benen", "Problemen met plassen of ontlasting", NONE], stop: a => has(a.n_myelo, "Problemen met plassen of ontlasting"), src: "nek" },
    { id: "n_arm", type: "single", q: "Straalt de pijn uit naar je arm?", options: ["Nee", "Ja, tot de elleboog", "Ja, tot in de hand"], src: "nek" },
    { id: "n_tint", type: "single", q: "Heb je tintelingen, een doof gevoel of minder kracht in die arm of hand?", options: ["Nee", "Ja"], show: a => a.n_arm !== "Nee", src: "nek" },
    { id: "n_huid", type: "single", q: "Heb je aan één kant van je lichaam huiduitslag met blaasjes, of een brandende pijn of jeuk op de huid?", options: ["Nee", "Ja"], src: "nek" },
    { id: "n_slik", type: "single", q: "Heb je moeite met slikken, of hoofdpijn met braken?", options: ["Nee", "Ja"], src: "nek" },
    { id: "n_4wk", type: "single", q: "Ben je hiervoor al 4 weken of langer behandeld zonder dat het beter werd?", options: ["Nee", "Ja"], src: "nek" },
  ],
  schouder: [
    { id: "s_hart", type: "single", q: "Krijg je de pijn (ook) bij inspanning, samen met kortademigheid of een drukkend gevoel op de borst?", options: ["Nee", "Ja"], stop: a => yes(a.s_hart), src: "aanvulling" },
    { id: "s_trauma", type: "single", q: "Kun je je arm sinds het ongeluk nog zelf optillen, en ziet de schouder er normaal uit?", options: ["Ja, dat gaat", "Nee, ik kan mijn arm niet optillen", "De schouder ziet er scheef of vervormd uit"], show: isTrauma, src: "aanvulling" },
    { id: "s_warm", type: "single", q: "Is je schouder rood, warm en gezwollen?", options: ["Nee", "Ja"], src: "aanvulling" },
    { id: "s_pmr", type: "single", q: "Heb je pijn en stijfheid in beide schouders én in je heupen of bovenbenen, vooral 's ochtends (langer dan 45 minuten)?", options: ["Nee", "Ja"], src: "aanvulling" },
    { id: "s_rca", type: "single", q: "Heb je ook nieuwe hoofdpijn bij je slapen, pijn bij het kauwen of zie je plotseling slechter?", options: ["Nee", "Ja"], show: a => yes(a.s_pmr), stop: a => yes(a.s_rca), src: "aanvulling" },
    { id: "s_long", type: "single", q: "Rook je (of rookte je), en heb je een hoest die niet overgaat of heb je bloed opgehoest?", options: ["Nee", "Ja"], src: "aanvulling" },
    { id: "s_nek", type: "single", q: "Begint de pijn in je nek, of heb je tintelingen in je arm of hand?", options: ["Nee", "Ja"], src: "aanvulling" },
  ],
  knie: jointQuestions("k", "knie"),
  heup: jointQuestions("h", "heup"),
  enkel: [
    { id: "e_kuit", type: "single", q: "Is je kuit dik, rood, warm of pijnlijk?", options: ["Nee", "Ja"], src: "aanvulling" },
    { id: "e_lopen", type: "single", q: "Kon je direct na het ongeluk én nu 4 stappen lopen (ook al ging het mank)?", options: ["Ja", "Nee"], show: isTrauma, src: "enkel" },
    { id: "e_druk", type: "single", q: "Doet het erg pijn als je drukt op de achterkant of punt van je enkelknobbels, op het uitstekende bot halverwege de buitenkant van je voet, of op het bot aan de binnenkant van je middenvoet?", options: ["Nee", "Ja", "Weet ik niet"], show: isTrauma, src: "enkel" },
    { id: "e_knap", type: "single", q: "Voelde of hoorde je iets 'knappen' achter je enkel, alsof iemand je een trap gaf?", options: ["Nee", "Ja"], show: isTrauma, src: "aanvulling" },
    { id: "e_warm", type: "single", q: "Is je enkel of voet rood, warm en gezwollen zonder dat je je hebt bezeerd?", options: ["Nee", "Ja"], show: a => !isTrauma(a), src: "aanvulling" },
    { id: "e_wond", type: "single", q: "Heb je een wondje of rode plek aan je voet die niet geneest?", options: ["Nee", "Ja"], src: "aanvulling" },
    { id: "e_instab", type: "single", q: "Zwik je steeds opnieuw door, of voelt je enkel instabiel?", options: ["Nee", "Ja"], src: "enkel" },
    { id: "e_slot", type: "single", q: "Heb je af en toe een 'slot' of inklemmend gevoel in je enkel?", options: ["Nee", "Ja"], src: "enkel" },
  ],
  anders: [
    { id: "x_waar", type: "text", q: "Waar zit je klacht precies?", ph: "Bijv. elleboog, pols, kaak, bekkenbodem" },
  ],
};

function jointQuestions(p, naam) {
  const qs = [
    { id: `${p}_prot`, type: "single", q: `Heb je een ${naam}prothese (kunst${naam})?`, options: ["Nee", "Ja"], src: "artrose" },
    { id: `${p}_protk`, type: "multi", q: "Heb je een van deze klachten bij je prothese?", options: ["Koorts van 38,5 °C of hoger", "Wond is rood, gezwollen of lekt", "Plotseling hevige pijn in het gewricht", "Ik kan niet meer op het been staan (eerst wel)", "Pijn in de kuit, of rood/dik onderbeen", "Pijn wordt erger ondanks pijnstillers", NONE], show: a => yes(a[`${p}_prot`]), src: "artrose" },
    { id: `${p}_warm`, type: "single", q: `Is je ${naam} warm, rood en gezwollen?`, options: ["Nee", "Ja"], src: "artrose" },
    { id: `${p}_rust`, type: "single", q: `Heb je pijn en zwelling in rust, zonder dat je je ${naam} hebt bezeerd?`, options: ["Nee", "Ja"], src: "artrose" },
    { id: `${p}_hevig`, type: "single", q: "Is de pijn plotseling heel hevig geworden, zonder duidelijke reden?", options: ["Nee", "Ja"], src: "artrose" },
    { id: `${p}_stijf`, type: "single", q: `Ben je 's ochtends stijf in je ${naam}?`, options: ["Nee", "Ja, korter dan 30 minuten", "Ja, langer dan 30 minuten"], src: "artrose" },
    { id: `${p}_lopen`, type: "single", q: "Kon je direct na het ongeluk én nu 4 stappen lopen?", options: ["Ja", "Nee"], show: isTrauma, src: "aanvulling" },
  ];
  if (p === "k") {
    qs.splice(5, 0, { id: "k_slot", type: "single", q: "Zit je knie soms 'op slot' (je kunt hem dan niet strekken)?", options: ["Nee", "Soms even", "Ja, hij zit nu vast"], src: "artrose" });
    qs.push({ id: "k_dik", type: "single", q: "Werd je knie binnen 2 uur na het ongeluk dik?", options: ["Nee", "Ja"], show: isTrauma, src: "aanvulling" });
  } else {
    qs.splice(5, 0, { id: "h_lies", type: "single", q: "Heb je een zwelling in je lies?", options: ["Nee", "Ja"], src: "artrose" });
  }
  return qs;
}

const Q_GENERAL = [
  { id: "alg", type: "multi", q: "Heb je last van een van deze dingen?", options: ["Koorts of koude rillingen", "Nachtzweten", "Afgevallen zonder reden (meer dan 5 kg)", "Erg moe of algemeen ziek", NONE], src: "rug" },
  { id: "nacht", type: "single", q: "Heb je 's nachts pijn die niet minder wordt als je anders gaat liggen?", options: ["Nee", "Ja"], src: "rug" },
  { id: "vg", type: "multi", q: "Heb of had je een van deze aandoeningen?", options: ["Kanker (nu of vroeger)", "Botontkalking (osteoporose)", "Reuma of een andere ontstekingsziekte", "Diabetes", "Hart- of vaatziekte", "Longziekte (bijv. COPD)", "Verminderde weerstand", NONE], src: "dossier" },
  { id: "med", type: "multi", q: "Gebruik je een van deze medicijnen?", options: ["Prednison of andere corticosteroïden (langer dan 3 maanden)", "Bloedverdunners", "Medicijnen die je afweer onderdrukken", "Pijnstillers", NONE], src: "dossier" },
  { id: "operatie", type: "single", q: "Ben je de afgelopen 3 maanden geopereerd?", options: ["Nee", "Ja"], show: a => a.ontstaan !== "Na een operatie", src: "rug" },
];

const Q_PROGNOSIS = [
  { id: "eerder", type: "single", q: "Heb je deze klacht eerder gehad?", options: ["Nee, voor het eerst", "Ja, eerder"], src: "rug" },
  { id: "adl", type: "single", q: "Hoeveel last heb je ervan in je dagelijks leven?", options: ["Nauwelijks", "Behoorlijk", "Heel veel"], src: "rug" },
  { id: "werk", type: "single", q: "Werk je?", options: ["Ja, lichamelijk zwaar werk", "Ja, vooral zittend of licht werk", "Ja, maar ik zit nu ziek thuis", "Nee / niet van toepassing"], src: "rug" },
  { id: "angst", type: "single", q: "Ben je bang dat bewegen je klacht erger maakt?", options: ["Nee", "Een beetje", "Ja, erg"], src: "rug" },
  { id: "stemming", type: "single", q: "Voel je je de laatste weken vaak somber of gespannen, of pieker je veel over je klacht?", options: ["Nee", "Soms", "Vaak"], src: "rug" },
  { id: "verwacht", type: "single", q: "Verwacht je dat je klacht weer goed overgaat?", options: ["Ja", "Weet ik niet", "Nee"], src: "rug" },
];

const Q_END = [
  { id: "doel", type: "text", q: "Wat zou je graag weer (beter) willen kunnen?", ph: "Bijv. weer hardlopen", src: "dossier" },
  { id: "huisarts", type: "text", q: "Wie is je huisarts? (naam en plaats)", ph: "Bijv. dr. Jansen, Noordwijk", src: "dossier" },
  { id: "toestemming", type: "single", q: "Mogen wij je huisarts op de hoogte brengen van de uitkomst van deze screening?", options: ["Ja", "Nee"], src: "dossier" },
];

function questionFlow(a) {
  return [...Q_START, ...(Q_REGION[a.regioKey] || []), ...Q_GENERAL, ...Q_PROGNOSIS, ...Q_END];
}

// ---------- rode vlaggen ----------
// level: spoed | rood | oranje | info.   termijn (rood): vandaag | 2 werkdagen | regulier.
// call112: bij spoed wordt de patiënt geadviseerd 112 te bellen i.p.v. huisarts/HAP.
const FLAGS = [
  // Onderrug
  { region: "rug", cluster: "Neurologisch noodgeval", label: "Zadelanesthesie of mictie-/defecatiestoornis (verdenking cauda-equinasyndroom)", crit: "Doof gevoel rond billen/schaamstreek of moeite met plassen/ontlasting", level: "spoed", src: "rug", when: a => yes(a.r_cauda) },
  { region: "rug", cluster: "Neurologisch noodgeval", label: "Motorische uitval in beide benen", crit: "Krachtverlies in beide benen", level: "spoed", src: "rug", when: a => a.r_kracht === "Ja, in beide benen" },
  { region: "rug", cluster: "Neurologisch noodgeval", label: "Progressief krachtverlies < 48 uur", crit: "Krachtverlies in één been, ontstaan of verergerd in de afgelopen 2 dagen", level: "spoed", src: "rug", when: a => yes(a.r_snel) },
  { region: "rug", cluster: "LRS", label: "LRS met mogelijk ernstige motorische uitval (bij MRC ≤ 3 → huisarts)", crit: "Krachtverlies in één been, niet snel progressief", level: "rood", termijn: "2 werkdagen", src: "rug", when: a => a.r_kracht === "Ja, in één been" && !yes(a.r_snel) },
  { region: "rug", cluster: "LRS", label: "Vermoeden LRS met ernstige pijn (NPRS ≥ 8)", crit: "Uitstraling onder de knie of neurologische klachten in het been én pijn ≥ 8", level: "rood", termijn: "2 werkdagen", src: "rug", when: a => lrs(a) && +a.pijn >= 8 },
  { region: "rug", cluster: "LRS", label: "Vermoeden lumbosacraal radiculair syndroom — neurologisch onderzoek bij intake", crit: "Uitstraling onder de knie, tintelingen/doof gevoel of pijn bij hoesten/niezen", level: "info", src: "rug", when: a => lrs(a) },
  { region: "rug", cluster: "Differentiaaldiagnose", label: "Bedacht zijn op vasculaire of neurogene claudicatio (Verbiest)", crit: "Beenpijn alleen bij staan/lopen, over bij zitten", level: "oranje", src: "rug", when: a => yes(a.r_claud) },
  { region: "rug", cluster: "Inflammatoire aandoening", label: "Meerdere kenmerken van inflammatoire rugpijn (axiale spondyloartritis)", crit: "3 of meer inflammatoire kenmerken", level: "rood", termijn: "regulier", src: "rug", when: a => cnt(a.r_infl) >= 3 },
  { region: "rug", cluster: "Inflammatoire aandoening", label: "Twee kenmerken van inflammatoire rugpijn", crit: "2 inflammatoire kenmerken", level: "oranje", src: "rug", when: a => cnt(a.r_infl) === 2 },
  { region: "rug", cluster: "Diversen", label: "Toenemende postoperatieve pijn", crit: "Ontstaan na operatie (of operatie < 3 mnd) én klachten worden erger", level: "rood", termijn: "2 werkdagen", src: "rug", when: a => (a.ontstaan === "Na een operatie" || yes(a.operatie)) && a.beloop === "Het wordt erger" },

  // Nek
  { region: "nek", cluster: "Systemische ziekte", label: "Hoofdpijn, koorts en nekstijfheid (verdenking meningitis)", crit: "Hevige hoofdpijn + koorts + stijve nek", level: "spoed", call112: true, src: "aanvulling", when: a => yes(a.n_menin) },
  { region: "nek", cluster: "Cervicale arteriële disfunctie", label: "Neurologische/cerebrovasculaire uitval", crit: "Dubbelzien, moeite met praten/slikken of plotselinge zwakte in arm/been", level: "spoed", call112: true, src: "nek", when: a => ["Dubbelzien of wazig zien", "Moeite met praten of slikken", "Plotselinge zwakte in arm of been"].some(x => has(a.n_cad, x)) },
  { region: "nek", cluster: "Cervicale arteriële disfunctie", label: "Duizeligheid en/of misselijkheid/braken bij nekpijn — niet manipuleren, eerst medisch beoordelen", crit: "Duizeligheid of misselijkheid/braken", level: "rood", termijn: "2 werkdagen", src: "nek", when: a => has(a.n_cad, "Duizeligheid") || has(a.n_cad, "Misselijkheid of braken") },
  { region: "nek", cluster: "Ruggenmerg / cervicale myelopathie", label: "Blaas- of darmstoornis bij nekpijn", crit: "Problemen met plassen of ontlasting", level: "spoed", src: "nek", when: a => has(a.n_myelo, "Problemen met plassen of ontlasting") },
  { region: "nek", cluster: "Ruggenmerg / cervicale myelopathie", label: "Wijdverspreide neurologische tekenen (verdenking cervicale myelopathie)", crit: "Onhandige handen, loop-/evenwichtsproblemen of tintelingen in beide armen/benen", level: "rood", termijn: "2 werkdagen", src: "nek", when: a => !has(a.n_myelo, "Problemen met plassen of ontlasting") && cnt(a.n_myelo) >= 1 },
  { region: "nek", cluster: "Systemische ziekte", label: "Eenzijdige huiduitslag/brandende pijn (verdenking herpes zoster)", crit: "Huiduitslag met blaasjes of brandende pijn aan één kant", level: "rood", termijn: "2 werkdagen", src: "nek", when: a => yes(a.n_huid) },
  { region: "nek", cluster: "Maligne tumor", label: "Slikproblemen of hoofdpijn met braken", crit: "Moeite met slikken of hoofdpijn met braken", level: "rood", termijn: "2 werkdagen", src: "nek", when: a => yes(a.n_slik) },
  { region: "nek", cluster: "Maligne tumor", label: "Geen verbetering na 4 weken behandeling", crit: "≥ 4 weken behandeld zonder verbetering", level: "oranje", src: "nek", when: a => yes(a.n_4wk) },
  { region: "nek", cluster: "Graad III", label: "Vermoeden nekpijn graad III (cervicaal radiculair syndroom) — Spurling/tractietest bij intake", crit: "Uitstraling naar de arm met tintelingen, doof gevoel of krachtverlies", level: "info", src: "nek", when: a => a.n_arm !== "Nee" && yes(a.n_tint) },

  // Schouder
  { region: "schouder", cluster: "Cardiaal", label: "Schouderpijn bij inspanning met kortademigheid/druk op de borst", crit: "Pijn bij inspanning + kortademig of drukkend gevoel op de borst", level: "spoed", call112: true, src: "aanvulling", when: a => yes(a.s_hart) },
  { region: "schouder", cluster: "Reuscelarteritis", label: "Nieuwe hoofdpijn slaap/kauwpijn/visusklachten bij PMR-beeld", crit: "Hoofdpijn bij slapen, kauwpijn of plots slechter zien", level: "spoed", src: "aanvulling", when: a => yes(a.s_rca) },
  { region: "schouder", cluster: "Fractuur / luxatie", label: "Vervormde schouder na trauma (verdenking luxatie/fractuur)", crit: "Schouder ziet er scheef of vervormd uit na ongeluk", level: "rood", termijn: "vandaag", src: "aanvulling", when: a => a.s_trauma === "De schouder ziet er scheef of vervormd uit" },
  { region: "schouder", cluster: "Fractuur / cuffruptuur", label: "Arm niet meer actief te heffen na trauma (fractuur of acute cuffruptuur)", crit: "Kan arm na ongeluk niet zelf optillen", level: "rood", termijn: "2 werkdagen", src: "aanvulling", when: a => a.s_trauma === "Nee, ik kan mijn arm niet optillen" },
  { region: "schouder", cluster: "Infectie / artritis", label: "Rode, warme, gezwollen schouder met koorts (verdenking septische artritis)", crit: "Rood/warm/gezwollen + koorts", level: "rood", termijn: "vandaag", src: "aanvulling", when: a => yes(a.s_warm) && fever(a) },
  { region: "schouder", cluster: "Infectie / artritis", label: "Rode, warme, gezwollen schouder", crit: "Rood/warm/gezwollen, geen koorts", level: "rood", termijn: "2 werkdagen", src: "aanvulling", when: a => yes(a.s_warm) && !fever(a) },
  { region: "schouder", cluster: "Systemische ziekte", label: "Beeld passend bij polymyalgia rheumatica", crit: "Pijn/stijfheid beide schouders + heupen, ochtendstijf > 45 min, leeftijd ≥ 50", level: "rood", termijn: "2 werkdagen", src: "aanvulling", when: a => yes(a.s_pmr) && a.age >= 50 },
  { region: "schouder", cluster: "Maligne tumor", label: "Roken met aanhoudende hoest/hemoptoë (o.a. Pancoast-tumor)", crit: "Rookt/rookte + aanhoudende hoest of bloed opgehoest", level: "rood", termijn: "2 werkdagen", src: "aanvulling", when: a => yes(a.s_long) },
  { region: "schouder", cluster: "Differentiaaldiagnose", label: "Mogelijk cervicale oorsprong — nek meeonderzoeken", crit: "Pijn begint in de nek of tintelingen arm/hand", level: "info", src: "aanvulling", when: a => yes(a.s_nek) },

  // Knie en heup (artrose-richtlijn)
  ...jointFlags("k", "knie"),
  ...jointFlags("h", "heup"),
  { region: "knie", cluster: "Rode vlag artrose", label: "Ernstige slotklachten knie", crit: "Knie zit nu op slot", level: "rood", termijn: "2 werkdagen", src: "artrose", when: a => a.k_slot === "Ja, hij zit nu vast" },
  { region: "knie", cluster: "Rode vlag artrose", label: "Intermitterende slotklachten", crit: "Knie zit soms even op slot", level: "info", src: "artrose", when: a => a.k_slot === "Soms even" },
  { region: "knie", cluster: "Trauma", label: "Snelle zwelling na trauma (haemarthros, mogelijk kruisband-/meniscusletsel)", crit: "Knie binnen 2 uur dik na ongeluk", level: "oranje", src: "aanvulling", when: a => yes(a.k_dik) },
  { region: "heup", cluster: "Rode vlag artrose", label: "Zwelling in de lies", crit: "Zwelling in de lies", level: "rood", termijn: "2 werkdagen", src: "artrose", when: a => yes(a.h_lies) },
  { region: "heup", cluster: "Kinderen", label: "Heupklachten bij een kind — altijd laten beoordelen", crit: "Leeftijd < 16 met heupklachten", level: "oranje", src: "aanvulling", when: a => a.age < 16 },

  // Enkel / voet
  { region: "enkel", cluster: "Fractuur (Ottawa ankle rules)", label: "Ottawa ankle rules positief — röntgen geïndiceerd", crit: "Binnen 1 week na trauma: kan geen 4 stappen lopen of drukpijn op malleoli/basis MT-V/os naviculare", level: "rood", termijn: "vandaag", src: "enkel", when: a => isTrauma(a) && a.duur === "Korter dan 1 week" && (a.e_lopen === "Nee" || a.e_druk === "Ja") },
  { region: "enkel", cluster: "Fractuur (Ottawa ankle rules)", label: "Ottawa-criteria positief, maar trauma > 1 week geleden", crit: "Na > 1 week: kan niet lopen of drukpijn op botpunten", level: "oranje", src: "enkel", when: a => isTrauma(a) && a.duur !== "Korter dan 1 week" && (a.e_lopen === "Nee" || a.e_druk === "Ja") },
  { region: "enkel", cluster: "Achillespeesruptuur", label: "'Knap' achter de enkel (verdenking achillespeesruptuur)", crit: "Voelde/hoorde iets knappen achter de enkel", level: "rood", termijn: "2 werkdagen", src: "aanvulling", when: a => yes(a.e_knap) },
  { region: "enkel", cluster: "Trombose", label: "Dikke, rode, warme of pijnlijke kuit (verdenking trombose)", crit: "Kuit dik/rood/warm/pijnlijk", level: "rood", termijn: "vandaag", src: "aanvulling", when: a => yes(a.e_kuit) },
  { region: "enkel", cluster: "Artritis / infectie", label: "Rood, warm, gezwollen gewricht zonder trauma (o.a. jicht, infectie)", crit: "Rood/warm/gezwollen zonder letsel", level: "rood", termijn: "2 werkdagen", src: "aanvulling", when: a => yes(a.e_warm) },
  { region: "enkel", cluster: "Diabetische voet", label: "Niet-genezende wond bij diabetes", crit: "Wond/rode plek die niet geneest + diabetes", level: "rood", termijn: "2 werkdagen", src: "aanvulling", when: a => yes(a.e_wond) && has(a.vg, "Diabetes") },
  { region: "enkel", cluster: "Differentiaaldiagnose", label: "Inklemmingsklachten (los fragment / kraakbeenletsel)", crit: "Slot of inklemmend gevoel", level: "oranje", src: "enkel", when: a => yes(a.e_slot) },
  { region: "enkel", cluster: "Functionele instabiliteit", label: "Functionele instabiliteit — binnen de richtlijn", crit: "Zwikt steeds opnieuw door", level: "info", src: "enkel", when: a => yes(a.e_instab) },

  // Iets anders
  { region: "anders", cluster: "Patroon", label: "Klachtgebied niet automatisch gescreend — therapeut beoordeelt het patroon", crit: "Klachtgebied 'Iets anders'", level: "oranje", src: "dossier", when: () => true },

  // Algemeen (alle regio's)
  { region: "alle", cluster: "Infectie", label: "Koorts of koude rillingen", crit: "Koorts of rillingen", level: "rood", termijn: "vandaag", src: "rug", when: a => fever(a) },
  { region: "alle", cluster: "Infectie", label: "Nachtzweten met verhoogd infectierisico", crit: "Nachtzweten + verminderde weerstand, afweeronderdrukkers of recente operatie", level: "rood", termijn: "2 werkdagen", src: "rug", when: a => has(a.alg, "Nachtzweten") && !fever(a) && infRisk(a) },
  { region: "alle", cluster: "Tumor", label: "Maligniteit in de voorgeschiedenis met bijkomende alarmsignalen", crit: "Kanker + (gewichtsverlies, nachtpijn, nachtzweten, moeheid of leeftijdsgrens)", level: "rood", termijn: "2 werkdagen", src: "rug", when: a => cancer(a) && tumorSigns(a) >= 1 },
  { region: "alle", cluster: "Tumor", label: "Maligniteit in de voorgeschiedenis", crit: "Kanker, zonder andere alarmsignalen", level: "oranje", src: "rug", when: a => cancer(a) && tumorSigns(a) === 0 },
  { region: "alle", cluster: "Tumor", label: "Combinatie van algemene alarmsignalen", crit: "≥ 2 van: gewichtsverlies, nachtpijn, nachtzweten, moeheid (zonder kanker)", level: "rood", termijn: "2 werkdagen", src: "rug", when: a => !cancer(a) && generalSigns(a) >= 2 },
  { region: "alle", cluster: "Tumor", label: "Eén algemeen alarmsignaal", crit: "Eén van: gewichtsverlies, nachtpijn, nachtzweten, moeheid", level: "oranje", src: "rug", when: a => !cancer(a) && generalSigns(a) === 1 && !(a.regioKey === "schouder" && onlyNightPain(a)) },
  { region: "alle", cluster: "Fractuur", label: "Hoogenergetisch trauma", crit: "Flinke val, verkeersongeval of harde klap", level: "rood", termijn: "vandaag", src: "rug", when: a => highEnergy(a) },
  { region: "alle", cluster: "Fractuur", label: "Trauma bij verhoogd fractuurrisico", crit: "Ongeluk/val + osteoporose, langdurig corticosteroïden of leeftijd ≥ 70", level: "rood", termijn: "2 werkdagen", src: "rug", when: a => isTrauma(a) && !highEnergy(a) && (has(a.vg, "Botontkalking (osteoporose)") || cortico(a) || a.age >= 70) },
  { region: "alle", cluster: "Tumor", label: "Recente klachten bij leeftijd < 18 jaar", crit: "Leeftijd < 18 en klachten < 6 weken (rug)", level: "oranje", src: "rug", when: a => a.regioKey === "rug" && a.age < 18 && recent(a) },
  { region: "alle", cluster: "Afstemming", label: "Verminderde weerstand / afweeronderdrukkers — infectierisico", crit: "Verminderde weerstand of afweeronderdrukkende medicatie", level: "info", src: "nek", when: a => infRisk(a) },
  { region: "alle", cluster: "Afstemming", label: "Chronische aandoening — afstemming met huisarts aanbevolen, ook bij 'pluis'", crit: "Diabetes, hart-/vaatziekte, longziekte of reuma", level: "info", src: "dossier", when: a => ["Diabetes", "Hart- of vaatziekte", "Longziekte (bijv. COPD)", "Reuma of een andere ontstekingsziekte"].some(x => has(a.vg, x)) },
  { region: "alle", cluster: "Afstemming", label: "Bloedverdunners na trauma — let op bloedingen/hematoom", crit: "Bloedverdunners + ongeluk/val", level: "info", src: "aanvulling", when: a => has(a.med, "Bloedverdunners") && isTrauma(a) },
  { region: "alle", cluster: "WGBO", label: "Minderjarige — toestemming ouder/voogd regelen", crit: "Leeftijd < 16 (< 12: ouders volledig informeren; 12–15: dubbele toestemming)", level: "info", src: "dossier", when: a => a.age < 16 },
];

function jointFlags(p, naam) {
  const region = p === "k" ? "knie" : "heup";
  return [
    { region, cluster: "Prothese", label: `Alarmsignaal bij ${naam}prothese (infectie, trombose, loslating of fractuur)`, crit: "Koorts ≥ 38,5 °C, wond rood/lekt, plots hevige pijn, niet kunnen staan, kuitpijn/rood onderbeen of toenemende pijn", level: "rood", termijn: "vandaag", src: "artrose", when: a => cnt(a[`${p}_protk`]) >= 1 },
    { region, cluster: "Rode vlag artrose", label: `Warme, rode, gezwollen ${naam} met koorts (verdenking septische artritis)`, crit: "Warm/rood/gezwollen + koorts", level: "rood", termijn: "vandaag", src: "artrose", when: a => yes(a[`${p}_warm`]) && fever(a) },
    { region, cluster: "Rode vlag artrose", label: `Warme, rode, gezwollen ${naam}`, crit: "Warm/rood/gezwollen", level: "rood", termijn: "2 werkdagen", src: "artrose", when: a => yes(a[`${p}_warm`]) && !fever(a) },
    { region, cluster: "Rode vlag artrose", label: "Pijn en zwelling in rust zonder trauma", crit: "Pijn + zwelling in rust", level: "rood", termijn: "2 werkdagen", src: "artrose", when: a => yes(a[`${p}_rust`]) },
    { region, cluster: "Rode vlag artrose", label: "Onverklaarde hevige pijn", crit: "Plotseling hevige pijn zonder reden", level: "rood", termijn: "2 werkdagen", src: "artrose", when: a => yes(a[`${p}_hevig`]) },
    { region, cluster: "Fractuur", label: "Kan niet belasten na trauma (verdenking fractuur)", crit: "Geen 4 stappen kunnen lopen na ongeluk", level: "rood", termijn: "vandaag", src: "aanvulling", when: a => a[`${p}_lopen`] === "Nee" },
    { region, cluster: "Inflammatoir", label: "Ochtendstijfheid > 30 minuten — past minder bij artrose", crit: "Ochtendstijf langer dan 30 minuten", level: "oranje", src: "artrose", when: a => a[`${p}_stijf`] === "Ja, langer dan 30 minuten" },
    { region, cluster: "Patroon", label: `Klinisch beeld past bij artrose ${naam} (leeftijd ≥ 45, ochtendstijfheid ≤ 30 min)`, crit: "Leeftijd ≥ 45 en geen of korte ochtendstijfheid", level: "info", src: "artrose", when: a => a.age >= 45 && a[`${p}_stijf`] !== "Ja, langer dan 30 minuten" },
  ];
}

// ---------- hulpfuncties regels ----------
function cnt(v) { return Array.isArray(v) ? v.filter(x => x !== NONE).length : 0; }
function fever(a) { return has(a.alg, "Koorts of koude rillingen") || has(a.k_protk, "Koorts van 38,5 °C of hoger") || has(a.h_protk, "Koorts van 38,5 °C of hoger"); }
function cancer(a) { return has(a.vg, "Kanker (nu of vroeger)"); }
function cortico(a) { return has(a.med, "Prednison of andere corticosteroïden (langer dan 3 maanden)"); }
function infRisk(a) { return has(a.vg, "Verminderde weerstand") || has(a.med, "Medicijnen die je afweer onderdrukken") || yes(a.operatie) || a.ontstaan === "Na een operatie"; }
function lrs(a) { return a.r_uitstr === "Tot onder de knie" || yes(a.r_tint) || yes(a.r_hoest); }
function generalSigns(a) {
  return ["Afgevallen zonder reden (meer dan 5 kg)", "Nachtzweten", "Erg moe of algemeen ziek"].filter(x => has(a.alg, x)).length + (yes(a.nacht) ? 1 : 0);
}
function onlyNightPain(a) { return yes(a.nacht) && generalSigns(a) === 1; }
function tumorSigns(a) {
  const ageCut = a.regioKey === "rug" ? 55 : 50; // rug: KNGF 2021 (> 55 jr), nek: KNGF 2016 (> 50 jr)
  return generalSigns(a) + (a.age > ageCut ? 1 : 0);
}

// Prognostische factoren voor aanhoudende klachten (KNGF Lage rugpijn 2021, B.2)
const PROGNOSTIC = [
  { label: "Eerdere episoden", when: a => a.eerder === "Ja, eerder" },
  { label: "Hoge mate van beperkingen", when: a => a.adl === "Heel veel" },
  { label: "Hoge pijnintensiteit (NPRS ≥ 7)", when: a => +a.pijn >= 7 },
  { label: "Uitstralende pijn in been of arm", when: a => (a.r_uitstr && a.r_uitstr !== "Nee, alleen in mijn rug") || (a.n_arm && a.n_arm !== "Nee") },
  { label: "Pijngerelateerde bewegingsangst", when: a => a.angst === "Ja, erg" },
  { label: "Psychosociale stress / somberheid", when: a => a.stemming === "Vaak" },
  { label: "Negatieve verwachting over herstel", when: a => a.verwacht === "Nee" },
  { label: "Hoge fysieke belasting op het werk", when: a => a.werk === "Ja, lichamelijk zwaar werk" },
  { label: "Werkverzuim", when: a => a.werk === "Ja, maar ik zit nu ziek thuis" },
  { label: "Chronisch beloop (> 3 maanden)", when: a => a.duur === "Langer dan 3 maanden" },
];

// ---------- triage ----------
const LEVEL_RANK = { info: 0, oranje: 1, rood: 2, spoed: 3 };
const TERMIJN_RANK = { regulier: 0, "2 werkdagen": 1, vandaag: 2 };

function evaluate(a) {
  const hits = FLAGS.filter(f => (f.region === "alle" || f.region === a.regioKey) && safe(f.when, a));
  let level = "groen";
  for (const f of hits) if (f.level !== "info" && (level === "groen" || LEVEL_RANK[f.level] > LEVEL_RANK[level])) level = f.level;
  const termijn = level === "rood"
    ? hits.filter(f => f.level === "rood").map(f => f.termijn).sort((x, y) => TERMIJN_RANK[y] - TERMIJN_RANK[x])[0]
    : null;
  const call112 = hits.some(f => f.level === "spoed" && f.call112);
  const prognostic = PROGNOSTIC.filter(p => safe(p.when, a)).map(p => p.label);
  const risk = prognostic.length <= 1 ? "laag" : prognostic.length <= 3 ? "verhoogd" : "hoog";
  return { level, termijn, call112, hits, prognostic, risk, classification: classify(a, hits) };
}
function safe(fn, a) { try { return !!fn(a); } catch { return false; } }

function classify(a, hits) {
  const serious = hits.some(f => f.level === "spoed" || f.level === "rood");
  if (serious && a.regioKey !== "nek") return "Vermoeden specifieke of ernstige pathologie — zie rode vlaggen";
  switch (a.regioKey) {
    case "rug": return lrs(a) ? "Vermoeden lumbosacraal radiculair syndroom (LRS)" : "Aspecifieke lage rugpijn";
    case "nek": {
      if (hits.some(f => f.region === "nek" && (f.level === "spoed" || f.level === "rood"))) return "Nekpijn graad IV (vermoeden ernstige pathologie)";
      if (a.n_arm !== "Nee" && yes(a.n_tint)) return "Vermoeden nekpijn graad III (CRS)";
      return a.adl === "Nauwelijks" ? "Nekpijn graad I" : "Nekpijn graad II";
    }
    case "knie": case "heup": return hits.some(f => f.label.startsWith("Klinisch beeld past bij artrose")) ? `Klinisch beeld passend bij artrose ${a.regioKey}` : `${REGIONS[a.regioKey]}klachten`;
    case "enkel": return isTrauma(a) ? "Acuut enkelletsel" : "Enkel-/voetklachten zonder recent trauma";
    default: return REGIONS[a.regioKey] + "klachten";
  }
}
