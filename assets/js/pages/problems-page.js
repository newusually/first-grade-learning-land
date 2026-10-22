/*
 * problems-page.js — 应用层 / 看图学应用
 * 流程：从题库池抽题（含外部真题融合 + 变种）→ 渲染动植物场景 → 作答 → 记录薄弱知识点。
 */
(function () {
  "use strict";
  var App = window.App, U = App.U, IMG = App.IMG, Speech = App.Speech, Banks = App.Banks;
  function $(id) { return document.getElementById(id); }

  var lv = 1, quiz = [], idx = 0, score = 0, answered = false;
  var PRAISE = ["答对啦，真棒！", "太厉害了！", "你真是数学小天才！", "完全正确！", "好聪明呀！"];
  var CHEER = ["没关系，再想一想哦。", "差一点点，加油！", "再仔细看看图哦。"];

  function em(e, i, delay) {
    var s = document.createElement("span"); s.className = "em idle";
    s.innerHTML = IMG.svg(e) || "⭐"; s.style.animationDelay = delay + "ms, " + (delay + 500) + "ms"; s.dataset.i = i;
    return s;
  }
  function op(o, delay) { var s = document.createElement("span"); s.className = "op"; s.textContent = o; s.style.animationDelay = delay + "ms"; return s; }

  function renderScene(q) {
    var sc = $("scene"); sc.innerHTML = "";
    if (q.kind === "add") {
      var r = document.createElement("div"); r.className = "row"; sc.appendChild(r);
      for (var i = 0; i < q.a; i++) r.appendChild(em(q.e, i, 120 + i * 130));
      r.appendChild(op("＋", 120 + q.a * 130));
      for (var j = 0; j < q.b; j++) r.appendChild(em(q.e, q.a + j, 240 + q.a * 130 + j * 130));
      var br = document.createElement("div"); br.className = "brace"; sc.appendChild(br);
      var c = document.createElement("div"); c.className = "cap q"; c.textContent = "？" + q.u; sc.appendChild(c);
    } else if (q.kind === "sub") {
      var c2 = document.createElement("div"); c2.className = "cap"; c2.textContent = q.a + " " + q.u; sc.appendChild(c2);
      var r2 = document.createElement("div"); r2.className = "row"; sc.appendChild(r2);
      q.els = [];
      for (var i2 = 0; i2 < q.a; i2++) { var e2 = em(q.e, i2, 100 + i2 * 90); r2.appendChild(e2); q.els.push(e2); }
      q.goneFrom = q.a - q.b;
    } else if (q.kind === "add2") {
      var r3 = document.createElement("div"); r3.className = "row"; sc.appendChild(r3);
      var d = 100;
      for (var a = 0; a < q.a; a++) { r3.appendChild(em(q.e, a, d)); d += 130; }
      r3.appendChild(op("＋", d)); d += 120;
      for (var b = 0; b < q.b; b++) { r3.appendChild(em(q.e, 100 + b, d)); d += 130; }
      r3.appendChild(op("＋", d)); d += 120;
      for (var c3 = 0; c3 < q.c; c3++) { r3.appendChild(em(q.e, 200 + c3, d)); d += 130; }
      var br3 = document.createElement("div"); br3.className = "brace"; sc.appendChild(br3);
      var c3b = document.createElement("div"); c3b.className = "cap q"; c3b.textContent = "？" + q.u; sc.appendChild(c3b);
    } else if (q.kind === "sub2") {
      var c4 = document.createElement("div"); c4.className = "cap"; c4.textContent = q.a + " " + q.u; sc.appendChild(c4);
      var r4 = document.createElement("div"); r4.className = "row"; sc.appendChild(r4);
      q.els = [];
      for (var i4 = 0; i4 < q.a; i4++) { var e4 = em(q.e, i4, 80 + i4 * 80); r4.appendChild(e4); q.els.push(e4); }
      q.goneFrom = q.a - q.b; q.gone1 = q.b;
    } else if (q.kind === "diff") {
      var wrap = document.createElement("div"); wrap.style.textAlign = "center";
      var rA = document.createElement("div"); rA.className = "row"; rA.appendChild(document.createTextNode("👦 "));
      for (var x = 0; x < q.a; x++) rA.appendChild(em(q.e, x, 100 + x * 90));
      var rB = document.createElement("div"); rB.className = "row"; rB.appendChild(document.createTextNode("👧 "));
      for (var y = 0; y < q.b; y++) rB.appendChild(em(q.e, 100 + y, 100 + y * 90));
      wrap.appendChild(rA); wrap.appendChild(rB); sc.appendChild(wrap);
    } else if (q.kind === "ord") {
      var r5 = document.createElement("div"); r5.className = "row"; sc.appendChild(r5);
      q.els = []; q.row.forEach(function (f, i) { var e5 = em(f, i, 120 + i * 150); r5.appendChild(e5); q.els.push(e5); });
    }
  }

  function loadQ() {
    answered = false; var q = quiz[idx];
    $("qno").textContent = "第 " + (idx + 1) + " 题";
    $("qtext").innerHTML = U.hlNums(q.text).replace(/(\d+)/g, "<b>$1</b>");
    $("eq").textContent = ""; $("eq").className = "eqshow";
    $("vd").textContent = ""; $("vd").className = "verdict";
    var aa = $("ansarea");
    var isOrd = q.kind === "ord";
    aa.innerHTML = "<div class='answer'><input id='inp' type='" + (isOrd ? "text" : "number") + "' inputmode='numeric' placeholder='？' autocomplete='off'>" +
      "<button class='btn bigbtn' id='okBtn'>✔ 检查</button><button class='btn bigbtn next' id='nxBtn' style='display:none'>下一题 ▶</button></div>";
    $("okBtn").onclick = check; $("nxBtn").onclick = next;
    $("inp").addEventListener("keydown", function (e) { if (e.key === "Enter") { answered ? next() : check(); } });
    if (!isOrd) setTimeout(function () { $("inp").focus(); }, 400);
    renderScene(q);
    setTimeout(function () { Speech.speak(q.text); }, 700);
  }

  function highlightCount(q) {
    var scene = $("scene"), ems = scene.querySelectorAll(".em"), i = 0;
    var tick = function () {
      if (i > 0 && ems[i - 1]) ems[i - 1].classList.remove("lit");
      if (i >= ems.length) return;
      ems[i].classList.add("lit"); i++; setTimeout(tick, 240);
    };
    if (ems.length) setTimeout(tick, 300);
  }

  function check() {
    if (answered) return; var q = quiz[idx];
    var v = $("inp").value.trim();
    if (v === "") { $("inp").focus(); return; }
    answered = true;
    if (q.kind === "ord") {
      var ok = (v === q.textAns || v === String(q.k) || v === IMG.get(q.row[q.k - 1]).name);
      finishOrd(q, ok); return;
    }
    var ok2 = parseInt(v, 10) === q.ans;
    if (q.kind === "sub" || q.kind === "sub2") {
      var ems = q.els || [], t = 400;
      var go = function (from, n) { for (var i = from; i < from + n; i++) { (function (i) { setTimeout(function () { if (ems[i]) ems[i].classList.add("gone"); }, t); })(i); t += 260; } };
      if (q.kind === "sub") go(q.goneFrom, q.b); else { go(q.goneFrom, q.b); go(q.goneFrom + q.b, q.c); }
    }
    if (ok2) {
      score += 10; $("sc").textContent = score; $("inp").className = "ok"; $("inp").disabled = true;
      U.confetti(); Speech.speak(U.pick(PRAISE));
      $("vd").textContent = "✔ 答对啦！+10 分"; $("vd").className = "verdict good";
      $("eq").textContent = q.eq; $("eq").classList.add("show"); highlightCount(q);
      Banks.record(q.kp, true);
    } else {
      $("inp").className = "no"; $("inp").disabled = true;
      $("card").classList.add("shake"); setTimeout(function () { $("card").classList.remove("shake"); }, 500);
      Speech.speak(U.pick(CHEER));
      $("vd").textContent = "✘ 正确答案：" + q.ans; $("vd").className = "verdict bad";
      $("eq").textContent = q.eq; $("eq").classList.add("show"); highlightCount(q);
      Banks.record(q.kp, false);
      if (q.teach) { var t = document.createElement("div"); t.className = "teach"; t.textContent = "💡 " + q.teach; $("eq").parentNode.appendChild(t); }
    }
    finish();
  }

  function finishOrd(q, ok) {
    if (ok) {
      score += 10; $("sc").textContent = score; $("inp").className = "ok"; $("inp").disabled = true;
      U.confetti(); Speech.speak(U.pick(PRAISE));
      $("vd").textContent = "✔ 答对啦！+10 分"; $("vd").className = "verdict good";
      $("eq").textContent = q.textAns; $("eq").classList.add("show"); Banks.record(q.kp, true);
    } else {
      $("card").classList.add("shake"); setTimeout(function () { $("card").classList.remove("shake"); }, 500);
      Speech.speak(q.textAns);
      $("vd").textContent = "✘ 再看看哦"; $("vd").className = "verdict bad";
      $("eq").textContent = "正确答案：" + q.textAns; $("eq").classList.add("show"); Banks.record(q.kp, false);
    }
    finish();
  }

  function finish() {
    $("okBtn").style.display = "none";
    $("nxBtn").style.display = ""; $("nxBtn").textContent = (idx === quiz.length - 1) ? "看成绩 🏁" : "下一题 ▶";
  }

  function next() {
    idx++;
    if (idx >= quiz.length) {
      var stars = score >= 90 ? "🌟🌟🌟" : score >= 60 ? "🌟🌟" : "🌟";
      $("card").innerHTML = "<div class='done'><div class='medal'>🏅</div><h2>闯关完成！得分 " + score + " 分</h2><div class='stars'>" + stars + "</div>" +
        "<p>答对 " + (score / 10) + " / " + quiz.length + " 题 · 换个难度再来挑战吧！</p>" +
        "<button class='btn bigbtn' onclick='location.reload()'>🔄 再来一轮</button>" +
        "<button class='btn bigbtn next' onclick=\"location.href='巩固练习.html'\">🎯 薄弱点巩固</button>" +
        "<button class='btn bigbtn next' onclick=\"location.href='口算动画课堂.html'\">🏠 返回动画课堂</button></div>";
      U.confetti(40); Speech.speak("闯关完成！你得了" + score + "分，真棒！"); return;
    }
    loadQ();
  }

  function restart(nlv) { lv = nlv || lv; score = 0; idx = 0; $("sc").textContent = 0;
    quiz = Banks.draw("problems", App.config.counts.problems || 15);
    loadQ();
  }

  // 难度按钮
  document.querySelectorAll(".lv").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll(".lv").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); restart(+b.dataset.lv);
    };
  });
  $("spkBtn").onclick = function () { var q = quiz[idx]; if (q) Speech.speak(q.text); };

  // 先加载外部题库（失败自动回退内置），再抽题
  Banks.loadExternal().then(function () { restart(1); });
  // 兜底：若 1.5 秒后还没题（极旧环境），直接抽内置
  setTimeout(function () { if (!quiz.length) restart(1); }, 1500);
})();
