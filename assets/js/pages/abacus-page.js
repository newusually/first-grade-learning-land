/*
 * abacus-page.js — 应用层 / 口算动画课堂
 * 负责：模式切换、数字调节（按模式限范围）、图形选择、播放/重播、速度、语音/音效开关，
 * 并调用业务层 App.Abacus 引擎渲染动画（支持 加/减/凑十/乘/除/混合）。
 */
(function () {
  "use strict";
  var App = window.App, Speech = App.Speech, Abacus = App.Abacus;
  function $(id) { return document.getElementById(id); }

  var PICKER = ["cat", "dog", "rabbit", "bird", "fish", "flower", "apple", "star", "tree", "butterfly", "duck", "pig", "bear", "frog", "monkey", "grape", "leaf", "sun", "heart", "balloon"];

  var S = { mode: "add", a: 3, b: 2, emoIdx: 0, emo: PICKER[0], voice: true, sfx: true, speed: 1, pickerIds: PICKER };
  Abacus.setEmoByIndex(S);

  var els = { playBtn: $("btn-play"), tPlay: $("t-play"), steps: $("steps"), say: $("say") };

  function maxA() { return S.mode === "sub" ? 20 : 10; }
  function clampNums() {
    if (S.mode === "sub") { if (S.a > 20) S.a = 20; if (S.b >= S.a) S.b = Math.max(1, S.a - 1); }
    else if (S.mode === "carry") { if (S.a < 10 && S.a + S.b <= 10) S.b = Math.min(10, 11 - S.a); if (S.a > 10) S.a = 10; }
    else if (S.mode === "mul" || S.mode === "div") { S.a = Math.min(4, S.a); S.b = Math.min(4, S.b); }
    else { if (S.a > 10) S.a = 10; if (S.a + S.b > 20) S.b = 20 - S.a; }
    $("a-val").textContent = S.a; $("b-val").textContent = S.b;
  }
  function resetStage() {
    if ($("row")) $("row").innerHTML = "";
    if ($("topLabel")) $("topLabel").textContent = "";
    if ($("qlabel")) $("qlabel").textContent = "";
    if ($("steps")) $("steps").textContent = "";
    var path = $("bracePath"); if (path) { path.style.transition = "none"; path.style.strokeDashoffset = 460; }
    if ($("e-a")) $("e-a").textContent = S.a;
    if ($("e-b")) $("e-b").textContent = S.b;
    var op = S.mode === "sub" ? "－" : S.mode === "mul" ? "×" : S.mode === "div" ? "÷" : "＋";
    if ($("e-op")) $("e-op").textContent = op;
    var ans = $("e-ans"); if (ans) { ans.textContent = "?"; ans.classList.remove("reveal"); }
  }

  function applyModeUI() {
    var labels = { add: "加法", sub: "减法", carry: "凑十法", mul: "乘法", div: "除法", mixed: "混合" };
    ["add", "sub", "carry", "mul", "div", "mixed"].forEach(function (m) {
      var b = $("m-" + m); if (b) b.classList.toggle("on", S.mode === m);
    });
    if ($("t-hint")) $("t-hint").textContent = "选“" + (labels[S.mode] || "") + "”：数 1、数 2 最大到 " + maxA() + "（乘除法自动适配），点“开始”看动画！";
    clampNums(); resetStage();
  }

  function setMode(m) { S.mode = m; Abacus.stop(els); applyModeUI(); }

  // 模式按钮
  ["add", "sub", "carry", "mul", "div", "mixed"].forEach(function (m) {
    var b = $("m-" + m); if (b) b.onclick = function () { setMode(m); };
  });
  $("btn-replay").onclick = function () { Abacus.stop(els); setTimeout(function () { $("btn-play").click(); }, 100); };
  $("btn-play").onclick = function () {
    if (!App.Abacus) return;
    Abacus.stop(els);
    Abacus.run(els, S);
  };
  $("btn-voice").onclick = function () { S.voice = !S.voice; $("btn-voice").classList.toggle("on", S.voice); if (!S.voice) try { speechSynthesis.cancel(); } catch (e) {} };
  $("btn-sfx").onclick = function () { S.sfx = !S.sfx; $("btn-sfx").classList.toggle("on", S.sfx); };
  $("speed").onchange = function (e) { S.speed = parseFloat(e.target.value); };

  function bindNum(key, isB) {
    $(key + "-plus").onclick = function () {
      if (key === "a") S.a = Math.min(maxA(), S.a + 1); else S.b = Math.min(S.mode === "mul" || S.mode === "div" ? 4 : 10, S.b + 1);
      if (isB && S.mode === "sub" && S.b >= S.a) S.b = Math.max(1, S.a - 1);
      if (!isB && S.mode === "sub" && S.a <= S.b) S.a = S.b + 1;
      if (S.mode !== "sub" && S.a + S.b > 20) { if (isB) S.b = 20 - S.a; else S.a = 20 - S.b; }
      if (S.mode === "carry" && S.a < 10 && S.a + S.b <= 10 && isB) S.b = Math.min(10, 11 - S.a);
      clampNums(); resetStage();
    };
    $(key + "-minus").onclick = function () {
      var lo = (isB && S.mode === "carry" && S.a < 10) ? 11 - S.a : 1;
      S[key] = Math.max(lo, S[key] - 1);
      if (!isB && S.mode === "sub" && S.a <= S.b) S.a = Math.min(20, S.b + 1);
      if (isB && S.mode === "sub" && S.b >= S.a) S.b = Math.max(1, S.a - 1);
      clampNums(); resetStage();
    };
  }
  bindNum("a", false); bindNum("b", true);

  // 图形选择
  Abacus.renderPicker($("emo"), S, function () { Abacus.renderPicker($("emo"), S, arguments.callee); resetStage(); });

  // 启动
  applyModeUI();
  Abacus.renderPicker($("emo"), S, function () { resetStage(); });
  if ("speechSynthesis" in window) try { window.speechSynthesis.getVoices(); } catch (e) {}
})();
