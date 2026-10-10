// Vooraf — eigen huisstijl in de demo: logo ophalen of uploaden, hoofdkleur uit het logo halen.
// Alles gebeurt in de browser. Alleen het websiteadres gaat naar de logodienst (icon.horse).

const Huisstijl = (() => {
  function host(input) {
    let s = String(input || "").trim().toLowerCase();
    if (!s) return "";
    s = s.replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
    return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(s) ? s : "";
  }

  function loadImage(src, cors) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (cors) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Logo kon niet geladen worden"));
      img.src = src;
    });
  }

  // Logo via websiteadres. Met CORS zodat we de kleur kunnen uitlezen.
  async function logoFromSite(domain) {
    const img = await loadImage(`https://icon.horse/icon/${encodeURIComponent(domain)}?size=large`, true);
    if (img.naturalWidth < 8) throw new Error("Geen bruikbaar logo gevonden");
    return img;
  }

  function logoFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error("Kies een afbeelding (PNG, JPG of SVG)"));
      const r = new FileReader();
      r.onload = () => loadImage(r.result, false).then(resolve, reject);
      r.onerror = () => reject(new Error("Bestand kon niet gelezen worden"));
      r.readAsDataURL(file);
    });
  }

  // Verklein naar max 160px en bewaar als PNG (klein genoeg voor opslag in de browser).
  function toDataUrl(img, max = 160) {
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * k));
    c.height = Math.max(1, Math.round(img.naturalHeight * k));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  }

  const toHex = (r, g, b) => "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
  function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, s, l];
  }
  function hslToRgb(h, s, l) {
    if (!s) return [l * 255, l * 255, l * 255];
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return 255 * (t < 1/6 ? p + (q - p) * 6 * t : t < 1/2 ? q : t < 2/3 ? p + (q - p) * (2/3 - t) * 6 : p); };
    return [f(h + 1/3), f(h), f(h - 1/3)];
  }
  function luminance([r, g, b]) {
    const c = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    return .2126 * c(r) + .7152 * c(g) + .0722 * c(b);
  }
  const contrastWithWhite = rgb => 1.05 / (luminance(rgb) + .05);

  // Kies de meest kenmerkende kleur: veel pixels én verzadigd; wit, transparant en grijs tellen nauwelijks.
  function extractColor(img) {
    const c = document.createElement("canvas"), size = 64;
    c.width = c.height = size;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data; // gooit een fout als het logo geen CORS toestaat
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 128) continue;
      const [, s, l] = rgbToHsl(r, g, b);
      if (l > .93) continue; // (bijna) wit
      const key = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
      const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0, s: 0, l: 0 };
      e.n++; e.r += r; e.g += g; e.b += b; e.s += s; e.l += l;
      buckets.set(key, e);
    }
    let best = null, bestScore = 0;
    for (const e of buckets.values()) {
      const s = e.s / e.n, l = e.l / e.n;
      const score = e.n * (0.15 + s) * (l < .08 ? .3 : 1);
      if (score > bestScore) { bestScore = score; best = e; }
    }
    return best ? toHex(best.r / best.n, best.g / best.n, best.b / best.n) : null;
  }

  // Maak de kleur donker genoeg voor witte tekst (contrast ≥ 4.5, WCAG AA).
  function readable(hex) {
    let [h, s, l] = rgbToHsl(...hexToRgb(hex));
    let rgb = hslToRgb(h, s, l);
    while (contrastWithWhite(rgb) < 4.5 && l > .05) { l -= .02; rgb = hslToRgb(h, s, l); }
    return toHex(...rgb);
  }
  function soft(hex) {
    const [r, g, b] = hexToRgb(hex);
    return toHex(r + (255 - r) * .88, g + (255 - g) * .88, b + (255 - b) * .88);
  }
  function initials(name) {
    const words = String(name).replace(/fysio(therapie)?|praktijk|centrum/gi, " ").trim().split(/\s+/).filter(Boolean);
    const src = words.length ? words : String(name).trim().split(/\s+/);
    return src.slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  }

  return { host, logoFromSite, logoFromFile, toDataUrl, extractColor, readable, soft, initials };
})();
