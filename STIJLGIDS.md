# Vooraf — stijlgids (werknaam)

**Product:** white-label screeningsbot voor fysiotherapiepraktijken (B2B).
**Belofte:** de screening is gedaan vóór de patiënt binnenkomt; het verslag schrijft zichzelf.

## Concept: "Het dossier"
De site voelt als een goed bijgehouden patiëntdossier: papierkleurige achtergrond, gelinieerde
vlakken, monospace-labels zoals op een formulier. Geen SaaS-gradients of zwevende dashboards.

**Signatuur-element:** de triage-schaal (Groen · Oranje · Rood · Spoed) — een smalle balk met
vier vakken die op meerdere plekken terugkomt en laat zien waar een patiënt terechtkomt.

## Logo
- **Opbouw:** beeldmerk vóór het woordmerk. Het beeldmerk is een formuliervakje (radius 20% van
  de breedte) met een vinkje dat tegelijk de V van Vooraf is: twee rechte poten, links korter dan
  rechts, ronde lijnuiteinden. Het logo doet wat de naam zegt: vooraf afgevinkt.
- **Woordmerk:** "Vooraf" in Bricolage Grotesque 800, letter-spacing -0.03em, `currentColor`
  (inkt op licht, papier op donker).
- **Verhouding:** vakje = hoogte van de hoofdletter V (0,66em), op de basislijn; ruimte tot het
  woord = een derde van het vakje (0,22em).
- **Kleuren:** vakje altijd oker `--accent` (#B8612A), vinkje papier `--paper` (#F3EFE6), ook op
  donkere vlakken.
- **Minimale grootte:** vakje 16px (de favicon `favicon.svg` is alleen het vakje).
- **Vrije ruimte:** rondom minstens de helft van de hoogte van het vakje.
- **Bestanden:** inline SVG (viewBox 24×24) in de topbar; `favicon.svg`.

## Kleuren
| Rol | Hex |
|---|---|
| Papier (achtergrond) | `#F3EFE6` |
| Kaart | `#FBF9F4` |
| Inkt (tekst, primair) | `#1C2826` |
| Inkt zacht | `#56635F` |
| Lijn | `#D9D2C3` |
| Accent (oker, CTA) | `#B8612A` |
| Triage groen | `#3F7D4E` |
| Triage oranje | `#D08A1E` |
| Triage rood | `#B8372B` |
| Triage spoed | `#6E1420` |

## Typografie
- Display: **Bricolage Grotesque** (600–800)
- Body: **Source Sans 3** (400/600)
- Labels/formuliercodes: **IBM Plex Mono** (500), uppercase, letter-spacing .08em

## Componenten
- Knoppen: rechthoekig, radius 6px, oker vol of inkt-omlijnd.
- Kaarten: `#FBF9F4`, 1px lijn, radius 10px, geen zware schaduw.
- Labels: mono, klein, inkt zacht.

## Tone of voice
Nuchter, concreet, collegiaal — praat als een fysiotherapeut tegen een collega.
Geen "supercharge/naadloos/revolutionair". Altijd duidelijk: **de therapeut beslist**,
Vooraf verzamelt en ordent.
