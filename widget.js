/* Vooraf — knop + chatvenster voor op de website van een praktijk (demoversie).
   Gebruik:
   <script src="https://studioannema.github.io/vooraf-demo/widget.js"
           data-praktijk="Naam praktijk" data-site="praktijk.nl" data-kleur="1F5F5B" async></script>
   Optioneel: data-tekst="Start je screening". Er worden geen gegevens verstuurd. */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script || window.__voorafWidget) return;
  window.__voorafWidget = true;

  var base = script.src.replace(/widget\.js(\?.*)?$/, "");
  var attr = function (k) { return (script.getAttribute("data-" + k) || "").trim(); };
  var kleur = /^#?[0-9a-f]{6}$/i.test(attr("kleur")) ? "#" + attr("kleur").replace("#", "") : "#1F5F5B";
  var tekst = attr("tekst") || "Start je screening";
  var params = new URLSearchParams({ embed: "1" });
  ["praktijk", "site"].forEach(function (k) { if (attr(k)) params.set(k, attr(k)); });
  params.set("kleur", kleur.slice(1));

  var host = document.createElement("div");
  host.setAttribute("data-vooraf", "");
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
  root.innerHTML =
    '<style>' +
    ':host{all:initial}' +
    '.btn{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;align-items:center;gap:10px;' +
    'background:' + kleur + ';color:#fff;border:0;border-radius:999px;padding:13px 20px 13px 16px;' +
    'font:600 16px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;' +
    'box-shadow:0 6px 20px rgba(0,0,0,.18);transition:transform .15s}' +
    '.btn:hover{transform:translateY(-1px)}' +
    '.btn:focus-visible{outline:3px solid #fff;outline-offset:-6px}' +
    '.btn svg{width:20px;height:20px;flex:none}' +
    '.panel{position:fixed;right:20px;bottom:88px;z-index:2147483000;width:400px;height:min(660px,calc(100vh - 120px));' +
    'border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.25)}' +
    '.panel[hidden]{display:none}' +
    '.panel iframe{width:100%;height:100%;border:0;display:block}' +
    '.close{position:absolute;top:10px;right:10px;z-index:1;width:34px;height:34px;border-radius:50%;border:0;' +
    'background:rgba(255,255,255,.22);color:#fff;font:400 22px/1 system-ui,sans-serif;cursor:pointer}' +
    '.close:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '@media (max-width:600px){.panel{right:0;bottom:0;width:100%;height:100%;border-radius:0}' +
    '.btn{right:16px;bottom:16px}}' +
    '@media (prefers-reduced-motion:reduce){.btn{transition:none}}' +
    '</style>' +
    '<div class="panel" role="dialog" aria-label="Online screening" hidden>' +
    '<button class="close" type="button" aria-label="Sluit de screening">×</button></div>' +
    '<button class="btn" type="button" aria-expanded="false">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4.8" fill="#fff" fill-opacity=".22"/>' +
    '<path d="M6.6 12.4 10.4 17.4 17.6 6.6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<span></span></button>';

  var btn = root.querySelector(".btn"), panel = root.querySelector(".panel"), close = root.querySelector(".close");
  root.querySelector(".btn span").textContent = tekst;

  function open() {
    if (!panel.querySelector("iframe")) {
      var f = document.createElement("iframe");
      f.src = base + "demo.html?" + params.toString();
      f.title = "Online screening";
      f.allow = "clipboard-write";
      panel.appendChild(f);
    }
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    btn.hidden = window.matchMedia("(max-width:600px)").matches;
    close.focus();
  }
  function shut() {
    panel.hidden = true;
    btn.hidden = false;
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  }
  btn.addEventListener("click", function () { panel.hidden ? open() : shut(); });
  close.addEventListener("click", shut);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) shut(); });

  (document.body || document.documentElement).appendChild(host);
})();
