/* =====================================================================
   SupersCrypt — hero injection demo + page interactions
   Vanilla JS, no dependencies. Pure presentation: no real cryptography.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------
     1. The demo "file": each line as syntax-highlighted cleartext HTML.
        `shield` marks a verified-block boundary (function / class start).
     ----------------------------------------------------------------- */
  var LINES = [
    { html: '<span class="tok-com">// @enc-block · SupersCrypt v1</span>', shield: false },
    { html: '<span class="tok-key">function</span> <span class="tok-fn">validateSession</span><span class="tok-punc">(</span><span class="tok-var">user</span><span class="tok-punc">) {</span>', shield: true },
    { html: '  <span class="tok-key">const</span> token <span class="tok-punc">=</span> user<span class="tok-punc">.</span>session<span class="tok-punc">.</span>jwt', shield: false },
    { html: '  <span class="tok-key">if</span> <span class="tok-punc">(!</span><span class="tok-fn">verify</span><span class="tok-punc">(</span>token<span class="tok-punc">,</span> vaultKey<span class="tok-punc">)) {</span>', shield: false },
    { html: '    <span class="tok-key">return</span> <span class="tok-punc">{</span> ok<span class="tok-punc">:</span> <span class="tok-key">false</span> <span class="tok-punc">}</span>', shield: false },
    { html: '  <span class="tok-punc">}</span>', shield: false },
    { html: '  <span class="tok-key">return</span> <span class="tok-punc">{</span> ok<span class="tok-punc">:</span> <span class="tok-key">true</span><span class="tok-punc">,</span> uid<span class="tok-punc">:</span> user<span class="tok-punc">.</span>id <span class="tok-punc">}</span>', shield: false },
    { html: '<span class="tok-punc">}</span>', shield: false },
    { html: '<span class="tok-key">class</span> <span class="tok-fn">PaymentVault</span> <span class="tok-key">extends</span> <span class="tok-fn">Core</span> <span class="tok-punc">{</span>', shield: true },
    { html: '  <span class="tok-fn">charge</span><span class="tok-punc">(</span><span class="tok-var">amount</span><span class="tok-punc">,</span> <span class="tok-var">ccy</span><span class="tok-punc">) {</span>', shield: false },
    { html: '    <span class="tok-key">return</span> <span class="tok-key">this</span><span class="tok-punc">.</span>gateway<span class="tok-punc">.</span><span class="tok-fn">submit</span><span class="tok-punc">(</span>amount<span class="tok-punc">)</span>', shield: false },
    { html: '  <span class="tok-punc">}</span>', shield: false },
    { html: '<span class="tok-punc">}</span>', shield: false }
  ];

  var HEX = "0123456789abcdef";
  function cipherFor(len) {
    // Produce a hex-ish scramble roughly matching the visible line length.
    var n = Math.max(8, Math.min(52, len));
    var out = "";
    for (var i = 0; i < n; i++) {
      out += HEX[(Math.random() * 16) | 0];
      if (i > 0 && i % 8 === 7 && i < n - 1) out += " ";
    }
    return out;
  }

  // Visible length of a line once tags are stripped — to size the cipher.
  function visibleLen(html) {
    var d = document.createElement("div");
    d.innerHTML = html;
    return (d.textContent || "").replace(/\s+/g, " ").trim().length;
  }

  var codeEl = document.getElementById("code");
  var rows = [];

  function buildRows() {
    if (!codeEl) return;
    var frag = document.createDocumentFragment();
    LINES.forEach(function (line, idx) {
      var cipher = cipherFor(visibleLen(line.html));

      var row = document.createElement("div");
      row.className = "code-row";

      var gutter = document.createElement("span");
      gutter.className = "gutter";
      gutter.textContent = idx + 1;
      if (line.shield) {
        var shield = document.createElement("span");
        shield.className = "shield";
        shield.title = "Cryptographically verified block";
        shield.textContent = "🛡️";
        gutter.appendChild(shield);
      }

      var content = document.createElement("span");
      content.className = "content";
      content.innerHTML = '<span class="cipher">' + cipher + "</span>";

      row.appendChild(gutter);
      row.appendChild(content);
      frag.appendChild(row);

      rows.push({ el: row, content: content, cipher: cipher, clear: line.html });
    });
    codeEl.appendChild(frag);
  }

  /* -----------------------------------------------------------------
     2. Lock / unlock transitions
     ----------------------------------------------------------------- */
  var toggleBtn = document.getElementById("demo-toggle");
  var statusEl = document.getElementById("demo-status");
  var unlocked = false;
  var animating = false;

  var LOCKED_MSG = "Ciphertext on the server — what GitHub actually stores.";
  var UNLOCKED_MSG = "Decrypted in-browser for an authorized viewer — keys never leave the vault.";

  function setToggle(state) {
    if (!toggleBtn) return;
    toggleBtn.setAttribute("aria-pressed", state ? "true" : "false");
    toggleBtn.querySelector(".demo-toggle-icon").textContent = state ? "🔒" : "🔓";
    toggleBtn.querySelector(".demo-toggle-label").textContent = state ? "Decrypted" : "Locked";
  }

  function unlock() {
    if (unlocked || animating) return;
    unlocked = true;
    setToggle(true);
    if (statusEl) statusEl.textContent = UNLOCKED_MSG;

    if (reduceMotion) {
      rows.forEach(function (r) {
        r.content.innerHTML = r.clear;
        r.el.classList.add("decrypted");
      });
      return;
    }

    animating = true;
    var i = 0;
    (function step() {
      if (i >= rows.length) { animating = false; return; }
      var r = rows[i];
      r.content.innerHTML = r.clear;
      r.el.classList.add("decrypted");
      i++;
      setTimeout(step, 90);
    })();
  }

  function lock() {
    if (!unlocked || animating) return;
    unlocked = false;
    setToggle(false);
    if (statusEl) statusEl.textContent = LOCKED_MSG;
    rows.forEach(function (r) {
      r.el.classList.remove("decrypted");
      r.content.innerHTML = '<span class="cipher">' + r.cipher + "</span>";
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      if (unlocked) lock(); else unlock();
    });
  }

  /* -----------------------------------------------------------------
     3. Auto-play the unlock once the demo scrolls into view
     ----------------------------------------------------------------- */
  function autoPlayWhenVisible() {
    var fig = document.querySelector(".demo");
    if (!fig) return;
    if (!("IntersectionObserver" in window)) { setTimeout(unlock, 600); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          setTimeout(unlock, reduceMotion ? 0 : 550);
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(fig);
  }

  /* -----------------------------------------------------------------
     4. Scroll reveals
     ----------------------------------------------------------------- */
  function initReveals() {
    var targets = document.querySelectorAll(".reveal, .reveal-group");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* -----------------------------------------------------------------
     5. Mobile nav toggle
     ----------------------------------------------------------------- */
  function initNav() {
    var btn = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* -----------------------------------------------------------------
     6. Lead form (demo mode — shows success, no backend)
     ----------------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById("pilot-form");
    var msg = document.getElementById("form-msg");
    if (!form) return;
    var input = form.querySelector('input[type="email"]');

    form.addEventListener("submit", function (e) {
      var valid = input && input.value &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());

      // In demo mode we never navigate away; a real endpoint in `action`
      // (with data-demo removed) would submit normally.
      if (form.getAttribute("data-demo") === "true") {
        e.preventDefault();
        if (!valid) {
          msg.textContent = "Please enter a valid work email.";
          msg.className = "form-msg err";
          if (input) input.focus();
          return;
        }
        msg.textContent = "✅ You're on the list — we'll be in touch shortly.";
        msg.className = "form-msg ok";
        form.reset();
      }
    });
  }

  /* ----------------------------------------------------------------- */
  function init() {
    buildRows();
    setToggle(false);
    autoPlayWhenVisible();
    initReveals();
    initNav();
    initForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
