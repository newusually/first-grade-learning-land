/*
 * speech.js — 业务层 / 语音与音效
 * 负责：挑选中文语音、朗读文本（答错/答对/读题）、WebAudio 音效、移动端音频解锁。
 * 兼容：speechSynthesis / AudioContext 在所有调用处 try-catch；老内核无语音则静默。
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  var voice = null;

  function pickVoice() {
    if (!("speechSynthesis" in w)) return;
    try {
      var vs = w.speechSynthesis.getVoices();
      voice = vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf("zh") === 0; })
                 .filter(function (v) { return /Xiaoxiao|Yunxi|Huihui|Yaoyao|Female|Chinese/.test(v.name); })[0]
             || vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf("zh") === 0; })[0]
             || null;
    } catch (e) { voice = null; }
  }
  try { pickVoice(); if (w.speechSynthesis) w.speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}

  function speak(text, opt) {
    opt = opt || {};
    if (!("speechSynthesis" in w) || !text) return;
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

  /* ---------- WebAudio 音效（无需外部文件） ---------- */
  var AC = null;
  function ac() {
    if (!AC) {
      try { AC = new (w.AudioContext || w.webkitAudioContext)(); } catch (e) { AC = null; }
    }
    return AC;
  }
  // 移动端（微信/QQ/钉钉）需用户手势后才能出声：首次触摸/点击解锁
  (function unlock() {
    function fn() {
      var c = ac();
      if (c && c.state === "suspended") { try { c.resume(); } catch (e) {} }
      if ("speechSynthesis" in w) { try { w.speechSynthesis.getVoices(); } catch (e) {} }
    }
    w.document.addEventListener("touchstart", fn, { passive: true });
    w.document.addEventListener("pointerdown", fn);
    w.document.addEventListener("click", fn);
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

  App.Speech = { speak: speak, sfx: sfx, pickVoice: pickVoice };
})(window);
