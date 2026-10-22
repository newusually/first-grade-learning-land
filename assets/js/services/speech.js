/*
 * speech.js — 服务层 / 语音与音效
 * 负责：中文/英文/拼音三类朗读、WebAudio 音效、移动端音频解锁、"读整篇文档"顺序播报。
 * 兼容要点：
 *   1) 老内核/无语音环境：静默降级，不报错；
 *   2) 手机端语音列表异步返回：先入待读队列，拿到中文语音或用户首次手势后自动补读；
 *   3) 拼音绝不用英文读法：统一走 speakPinyin（呼读音），英文走 speakEn，两者不混。
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  var voice = null, enVoice = null;
  var pendZh = [], pendEn = [], flushing = false;

  function pickVoice() {
    if (!("speechSynthesis" in w)) return;
    try {
      var vs = w.speechSynthesis.getVoices() || [];
      voice = vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf("zh") === 0; })
                 .filter(function (v) { return /Xiaoxiao|Yunxi|Huihui|Yaoyao|Female|Chinese|Ting|Sinji/.test(v.name); })[0]
             || vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf("zh") === 0; })[0]
             || null;
      enVoice = vs.filter(function (v) { return v.lang && /^en/i.test(v.lang); })[0] || null;
    } catch (e) { voice = null; enVoice = null; }
    if (voice && pendZh.length) flush("zh");
    if (enVoice && pendEn.length) flush("en");
  }
  try { pickVoice(); if (w.speechSynthesis) w.speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}

  function speakEn(text, opt) {
    opt = opt || {};
    if (!("speechSynthesis" in w) || !text) return;
    if (!enVoice) pickVoice();
    if (!enVoice) { pendEn.push({ t: text, o: opt }); return; }
    try {
      w.speechSynthesis.cancel();
      var u = new w.SpeechSynthesisUtterance(String(text));
      u.lang = "en-US";
      if (enVoice) u.voice = enVoice;
      u.rate = (typeof opt.rate === "number") ? opt.rate : 0.85;
      u.pitch = (typeof opt.pitch === "number") ? opt.pitch : 1.0;
      w.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------- 拼音朗读：按中文呼读音读，绝不被读成英文字母 ---------- */
  var PY_INIT = { b: "波", p: "坡", m: "摸", f: "佛", d: "得", t: "特", n: "呢", l: "勒", g: "哥", k: "科", h: "喝", j: "鸡", q: "七", x: "西", zh: "知", ch: "吃", sh: "诗", z: "资", c: "刺", s: "思", r: "日", y: "衣", w: "乌" };
  var PY_WHOLE = { zhi: "知", chi: "吃", shi: "诗", ri: "日", zi: "资", ci: "刺", si: "思", yi: "衣", wu: "乌", yu: "迂", ye: "耶", yue: "月", yuan: "元", yin: "音", yun: "云", ying: "英" };
  var PY_FIN = {
    a: "啊", o: "喔", e: "鹅", i: "衣", u: "乌", "ü": "迂", ai: "爱", ei: "欸", ui: "威", ao: "熬", ou: "欧", iu: "优",
    ie: "耶", "üe": "约", ue: "约", er: "儿", an: "安", en: "恩", in: "音", un: "温", "ün": "晕", ang: "昂", eng: "鞥", ing: "英", ong: "翁",
    ia: "呀", iao: "腰", ian: "烟", iang: "央", iong: "拥", ua: "蛙", uo: "窝", uai: "外", uan: "弯", uang: "汪", ueng: "翁"
  };
  // 声母表（长的放前面，保证 zh/ch/sh 优先匹配）
  var PY_INIT_KEYS = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "z", "c", "s", "r", "y", "w"];
  // 声调符号 → 无声调字母
  var PY_TONE = { "ā": "a", "á": "a", "ǎ": "a", "à": "a", "ē": "e", "é": "e", "ě": "e", "è": "e", "ī": "i", "í": "i", "ǐ": "i", "ì": "i", "ō": "o", "ó": "o", "ǒ": "o", "ò": "o", "ū": "u", "ú": "u", "ǔ": "u", "ù": "u", "ǖ": "ü", "ǘ": "ü", "ǚ": "ü", "ǜ": "ü", "ń": "n", "ň": "n", "ḿ": "m" };
  function pyNorm(t) {
    var s = String(t).toLowerCase().replace(/[0-9]/g, "").replace(/u:/g, "ü"), out = "", i, ch;
    for (i = 0; i < s.length; i++) {
      ch = s.charAt(i);
      if (PY_TONE[ch]) { out += PY_TONE[ch]; continue; }
      if (ch === "v") { out += "ü"; continue; }
      out += ch;
    }
    return out;
  }
  // 把一个无声调音节拆成「声母呼读音 + 韵母汉字」，如 ma -> 摸 啊；zhuang -> 知 汪
  function pySyllable(low) {
    var i, init = "", fin, a, b;
    for (i = 0; i < PY_INIT_KEYS.length; i++) {
      var k = PY_INIT_KEYS[i];
      if (low.indexOf(k) === 0 && low.length > k.length) { init = k; break; }
    }
    fin = init ? low.slice(init.length) : low;
    if (fin === "ê") fin = "e";
    a = PY_INIT[init] || "";
    b = PY_FIN[fin];
    if (!b) return null;
    return a ? (a + " " + b) : b;
  }
  function speakPinyin(py, opt) {
    py = String(py || "").trim();
    if (!py) return;
    var tokens = py.split(/[\s,，、]+/), out = [], i, t, low, c, piece;
    for (i = 0; i < tokens.length; i++) {
      t = tokens[i]; if (!t) continue;
      low = pyNorm(t);
      if (!low) continue;
      if (PY_INIT[low]) { out.push(PY_INIT[low]); continue; }
      if (PY_WHOLE[low]) { out.push(PY_WHOLE[low]); continue; }
      if (PY_FIN[low]) { out.push(PY_FIN[low]); continue; }
      if (/^[bpmfdtnlgkhjqxzcsryw]+$/.test(low) && low.length > 1) { // 无声母字母串，如 bpm
        var cs = low.split("");
        for (c = 0; c < cs.length; c++) { if (PY_INIT[cs[c]]) out.push(PY_INIT[cs[c]]); }
        continue;
      }
      piece = pySyllable(low);           // 普通音节（可带调）：ma -> 摸 啊；hǎo -> 喝 奥
      if (piece) { out.push(piece); continue; }
      if (/^[\u4e00-\u9fa5]/.test(t)) { out.push(t); continue; }  // 汉字原样
      if (/^[bpmfdtnlgkhjqxzcsryw]+$/.test(low)) {                // 认不出的一串字母：按声母逐个读，绝不读英文
        var cs2 = low.split("");
        for (c = 0; c < cs2.length; c++) { if (PY_INIT[cs2[c]]) out.push(PY_INIT[cs2[c]]); }
        continue;
      }
      out.push(t);
    }
    speak(out.join(" "), opt || { rate: 0.75 });
  }

  function speak(text, opt) {
    opt = opt || {};
    if (!("speechSynthesis" in w) || !text) return;
    if (!voice) pickVoice();
    if (!voice) { pendZh.push({ t: text, o: opt }); return; }
    try {
      w.speechSynthesis.cancel();
      var u = new w.SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g, ""));
      u.lang = "zh-CN";
      if (voice) u.voice = voice;
      u.rate = (typeof opt.rate === "number") ? opt.rate : 0.95;
      u.pitch = (typeof opt.pitch === "number") ? opt.pitch : 1.15;
      w.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------- 待读队列补读（手机端语音延迟/需手势解锁） ---------- */
  function flush(kind) {
    if (flushing) return;
    var q = kind === "en" ? pendEn : pendZh;
    if (!q.length) return;
    flushing = true;
    var one = q.shift();
    if (kind === "en") speakEn(one.t, one.o); else speak(one.t, one.o);
    setTimeout(function () { flushing = false; flush(kind); }, 60);
  }
  function flushAll() { pickVoice(); flush("zh"); flush("en"); }

  /* ---------- 顺序播报：用于"把整篇内容读完" ---------- */
  var seqRunning = false;
  function seq(list) {
    if (!list || !list.length) return;
    if (seqRunning) { try { w.speechSynthesis.cancel(); } catch (e) {} }
    seqRunning = true;
    var i = 0;
    (function step() {
      if (i >= list.length) { seqRunning = false; return; }
      var item = list[i++];
      if (typeof item === "function") { item(step); return; }
      var txt = (item && typeof item === "object") ? item.t : item;
      var isEn = (item && typeof item === "object") ? !!item.en : false;
      var done = false;
      var onend = function () { if (done) return; done = true; setTimeout(step, 120); };
      try {
        if ("speechSynthesis" in w) {
          w.speechSynthesis.cancel();
          var u = new w.SpeechSynthesisUtterance(String(txt).replace(/<[^>]+>/g, ""));
          if (isEn) { u.lang = "en-US"; if (enVoice) u.voice = enVoice; u.rate = 0.85; }
          else { u.lang = "zh-CN"; if (voice) u.voice = voice; u.rate = 0.95; }
          u.onend = onend; u.onerror = onend;
          w.speechSynthesis.speak(u);
          setTimeout(onend, Math.max(2600, String(txt).length * 340)); // 兜底：老内核不触发 onend
          return;
        }
      } catch (e) {}
      onend();
    })();
  }

  /* ---------- 自动读题（受全站"自动朗读"开关控制） ---------- */
  function autoRead(text, opt) {
    if (!App.Store || !App.Store.state || !App.Store.state.autoRead) return;
    if (!text) return;
    setTimeout(function () { speak(text, opt); }, 250);
  }

  /* ---------- WebAudio 音效（无需外部文件） ---------- */
  var AC = null;
  function ac() {
    if (!AC) { try { AC = new (w.AudioContext || w.webkitAudioContext)(); } catch (e) { AC = null; } }
    return AC;
  }
  // 移动端（微信/QQ/钉钉）需用户手势后才能出声：首次触摸/点击/按键解锁并补读待读队列
  (function unlock() {
    function fn() { flushAll(); var c = ac(); if (c && c.state === "suspended") { try { c.resume(); } catch (e) {} } }
    w.document.addEventListener("touchstart", fn, { passive: true });
    w.document.addEventListener("pointerdown", fn);
    w.document.addEventListener("click", fn);
    w.document.addEventListener("keydown", fn);
    setTimeout(flushAll, 800);
    setTimeout(flushAll, 2500);
  })();

  function tone(freq, dur, type, vol) {
    var c = ac(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || "triangle"; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
    } catch (e) {}
  }
  var sfx = {
    pop: function () { tone(560 + Math.random() * 320, 0.12, "triangle", 0.10); },
    off: function () { tone(300, 0.16, "sawtooth", 0.07); },
    right: function () { tone(523, 0.18, "sine", 0.14); setTimeout(function () { tone(659, 0.18, "sine", 0.14); }, 140); setTimeout(function () { tone(784, 0.3, "sine", 0.15); }, 280); },
    wrong: function () { tone(220, 0.25, "square", 0.08); }
  };

  App.Speech = {
    speak: speak,
    speakEn: speakEn,
    speakPinyin: speakPinyin,
    seq: seq,
    autoRead: autoRead,
    flushAll: flushAll,
    pickVoice: pickVoice,
    sfx: sfx
  };
})(window);
