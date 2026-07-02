/* =====================================================================
   Wooblywoo — shared site JS (nav, reveals, injection demo, form)
   Vanilla JS, no dependencies. All hooks are guarded, so every page
   can load this file safely whether or not the element exists.
   ===================================================================== */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Injection demo: a shared claims record ---------- */
  var LINES = [
    { html: '<span class="tok-com">// shared claims record · Wooblywoo</span>', shield: false },
    { html: '<span class="tok-punc">{</span>', shield: true },
    { html: '  <span class="tok-str">"policy_id"</span><span class="tok-punc">:</span> <span class="tok-str">"PLC-4471"</span><span class="tok-punc">,</span>', shield: false },
    { html: '  <span class="tok-str">"insured"</span><span class="tok-punc">:</span>   <span class="tok-str">"Jane Q. Doe"</span><span class="tok-punc">,</span>', shield: false },
    { html: '  <span class="tok-str">"ssn"</span><span class="tok-punc">:</span>       <span class="tok-str">"•••-••-4417"</span><span class="tok-punc">,</span>', shield: true },
    { html: '  <span class="tok-str">"claim"</span><span class="tok-punc">:</span>     <span class="tok-num">48200.00</span><span class="tok-punc">,</span>', shield: false },
    { html: '  <span class="tok-str">"status"</span><span class="tok-punc">:</span>    <span class="tok-str">"approved"</span><span class="tok-punc">,</span>', shield: false },
    { html: '  <span class="tok-str">"reinsurer"</span><span class="tok-punc">:</span> <span class="tok-str">"Acme Re"</span>', shield: false },
    { html: '<span class="tok-punc">}</span>', shield: false }
  ];
  var HEX = "0123456789abcdef";
  function cipherFor(len) {
    var n = Math.max(8, Math.min(52, len)), out = "";
    for (var i = 0; i < n; i++) { out += HEX[(Math.random() * 16) | 0]; if (i > 0 && i % 8 === 7 && i < n - 1) out += " "; }
    return out;
  }
  function visibleLen(html) { var d = document.createElement("div"); d.innerHTML = html; return (d.textContent || "").replace(/\s+/g, " ").trim().length; }

  var codeEl = document.getElementById("code");
  var rows = [];
  function buildRows() {
    if (!codeEl) return;
    var frag = document.createDocumentFragment();
    LINES.forEach(function (line, idx) {
      var cipher = cipherFor(visibleLen(line.html));
      var row = document.createElement("div"); row.className = "code-row";
      var gutter = document.createElement("span"); gutter.className = "gutter"; gutter.textContent = idx + 1;
      if (line.shield) { var s = document.createElement("span"); s.className = "shield"; s.title = "Cryptographically verified field"; s.textContent = "🛡️"; gutter.appendChild(s); }
      var content = document.createElement("span"); content.className = "content";
      content.innerHTML = '<span class="cipher">' + cipher + "</span>";
      row.appendChild(gutter); row.appendChild(content); frag.appendChild(row);
      rows.push({ el: row, content: content, cipher: cipher, clear: line.html });
    });
    codeEl.appendChild(frag);
  }

  var toggleBtn = document.getElementById("demo-toggle");
  var statusEl = document.getElementById("demo-status");
  var unlocked = false, animating = false;
  var LOCKED_MSG = "Ciphertext at rest — what your servers and cloud actually store.";
  var UNLOCKED_MSG = "Decrypted in-browser for an authorized viewer — keys never leave the vault.";

  function setToggle(state) {
    if (!toggleBtn) return;
    toggleBtn.setAttribute("aria-pressed", state ? "true" : "false");
    toggleBtn.querySelector(".demo-toggle-icon").textContent = state ? "🔒" : "🔓";
    toggleBtn.querySelector(".demo-toggle-label").textContent = state ? "Decrypted" : "Locked";
  }
  function unlock() {
    if (unlocked || animating || !rows.length) return;
    unlocked = true; setToggle(true); if (statusEl) statusEl.textContent = UNLOCKED_MSG;
    if (reduceMotion) { rows.forEach(function (r) { r.content.innerHTML = r.clear; r.el.classList.add("decrypted"); }); return; }
    animating = true; var i = 0;
    (function step() { if (i >= rows.length) { animating = false; return; } var r = rows[i]; r.content.innerHTML = r.clear; r.el.classList.add("decrypted"); i++; setTimeout(step, 90); })();
  }
  function lock() {
    if (!unlocked || animating) return;
    unlocked = false; setToggle(false); if (statusEl) statusEl.textContent = LOCKED_MSG;
    rows.forEach(function (r) { r.el.classList.remove("decrypted"); r.content.innerHTML = '<span class="cipher">' + r.cipher + "</span>"; });
  }
  if (toggleBtn) toggleBtn.addEventListener("click", function () { unlocked ? lock() : unlock(); });

  function autoPlayWhenVisible() {
    var fig = document.querySelector(".demo"); if (!fig) return;
    if (!("IntersectionObserver" in window)) { setTimeout(unlock, 600); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { setTimeout(unlock, reduceMotion ? 0 : 550); io.disconnect(); } }); }, { threshold: 0.4 });
    io.observe(fig);
  }

  /* ---------- 2. Scroll reveals ---------- */
  function initReveals() {
    var targets = document.querySelectorAll(".reveal, .reveal-group");
    if (reduceMotion || !("IntersectionObserver" in window)) { targets.forEach(function (t) { t.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- 3. Mobile nav ---------- */
  function initNav() {
    var btn = document.querySelector(".nav-toggle"), nav = document.getElementById("primary-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () { var open = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", open ? "true" : "false"); });
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
  }

  /* ---------- 4. Contact form → posts to Touchpoints.app ---------- */
  function ok(msg, form) { msg.textContent = "✅ Thanks — we'll be in touch shortly."; msg.className = "form-msg ok"; form.reset(); }
  function fail(msg) { msg.textContent = "Something went wrong — email hello@wooblywoo.example instead."; msg.className = "form-msg err"; }

  function initForm() {
    var form = document.getElementById("pilot-form"); if (!form) return;
    if (form.getAttribute("data-touchpoint") !== "true") return;
    var msg = document.getElementById("form-msg"), input = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = input && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((input.value || "").trim());
      if (!valid) { msg.textContent = "Please enter a valid work email."; msg.className = "form-msg err"; if (input) input.focus(); return; }
      if (btn) btn.disabled = true;
      msg.textContent = "Sending…"; msg.className = "form-msg";
      var body = new FormData(form);

      fetch(form.action, { method: "POST", body: body })
        .then(function (res) { if (res.ok) { ok(msg, form); } else { fail(msg); } })
        .catch(function () {
          return fetch(form.action, { method: "POST", mode: "no-cors", body: body })
            .then(function () { ok(msg, form); })
            .catch(function () { fail(msg); });
        })
        .then(function () { if (btn) btn.disabled = false; });
    });
  }

  function init() { buildRows(); setToggle(false); autoPlayWhenVisible(); initReveals(); initNav(); initForm(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
