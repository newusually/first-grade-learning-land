/*
 * review-page.js — 应用层 / 薄弱点巩固练习
 * 读取 localStorage 中记录的薄弱知识点，针对性抽题练习（数学/语文/应用题三库融合）。
 * 无薄弱点时给出综合混合练习。统一渲染器支持 应用题场景、数学数字/比大小、语文选择/连线/跟说。
 */
(function () {
  "use strict";
  var App = window.App, U = App.U, IMG = App.IMG, Speech = App.Speech, Banks = App.Banks;
  function $(id) { return document.getElementById(id); }

  var quiz = [], idx = 0, score = 0, answered = false;
  var PRAISE = ["答对啦，真棒！", "太厉害了！", "完全正确！", "你真是学习小能手！"];
  var CHEER = ["没关系，再想一想哦。", "差一点点，加油！", "再仔细看看哦。"];

  /* ---------- 薄弱点列表 ---------- */
  function renderWeak() {
    var box = $("weakBox"); if (!box) return;
    var list = Banks.weakList();
    if (!list.length) {
      box.innerHTML = "<div class='weakEmpty'>🌈 太棒了，现在还没有薄弱点！来做一套综合练习吧～</div>";
      return;
    }
    box.innerHTML = "<div class='weakTitle'>📌 需要巩固的知识点（点击可单独练习）：</div><div class='weakChips'>" +
      list.map(function (w, i) {
        return "<span class='wchip' data-i='" + i + "'>" + w.kp + " <b>×" + w.n + "</b></span>";
      }).join("") + "</div>";
    box.querySelectorAll(".wchip").forEach(function (c) {
      c.onclick = function () {
        var w = list[+c.dataset.i];
        startWith([w.kp]);
      };
    });
  }

  /* ---------- 组卷 ---------- */
  function startWith(kps) {
    quiz = [];
    ["problems", "math", "chinese"].forEach(function (t) {
      var qs = Banks.draw(t, 6, { kps: kps || [] });
      quiz = quiz.concat(qs);
    });
    if (!quiz.length) {
      quiz = quiz.concat(Banks.draw("problems", 5)).concat(Banks.draw("math", 5)).concat(Banks.draw("chinese", 5));
    }
    quiz = U.shuffled(quiz).slice(0, Math.min(15, quiz.length));
    idx = 0; score = 0; $("sc").textContent = 0;
    $("startWrap").style.display = "none";
    $("quizWrap").style.display = "";
    loadQ();
  }

  /* ---------- 场景渲染（应用题） ---------- */
  function em(e, i, delay) {
    var s = document.createElement("span"); s.className = "em idle";
    s.innerHTML = IMG.svg(e) || "⭐"; s.style.animationDelay = delay + "ms, " + (delay + 500) + "ms"; s.dataset.i = i;
    return s;
  }
  function op(o, delay) { var s = document.createElement("span"); s.className = "op"; s.textContent = o; s.style.animationDelay = delay + "ms"; return s; }
  function renderProblemScene(q) {
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

  /* ---------- 场景渲染（数学 add/sub/line） ---------- */
  function renderMathScene(q) {
    var el = $("scene"); el.innerHTML = "";
    if (!q.scene) return;
    var kind = q.scene[0][0], e = q.scene[0][1], a = q.scene[0][2], b = q.scene[0][3];
    var row = document.createElement("div"); row.className = "row";
    if (kind === "add" || kind === "sub") {
      if (kind === "add") {
        for (var i = 0; i < a; i++) { var s = document.createElement("span"); s.className = "em"; s.innerHTML = IMG.svg(e); s.style.animationDelay = (i * 120) + "ms"; row.appendChild(s); }
        var o = document.createElement("span"); o.className = "op"; o.textContent = "＋"; row.appendChild(o);
        for (var j = 0; j < b; j++) { var s2 = document.createElement("span"); s2.className = "em"; s2.innerHTML = IMG.svg(e); s2.style.animationDelay = ((a + j) * 120) + "ms"; row.appendChild(s2); }
      } else {
        for (var k = 0; k < a; k++) { var s3 = document.createElement("span"); s3.className = "em"; s3.innerHTML = IMG.svg(e); s3.style.animationDelay = (k * 110) + "ms"; if (k >= a - b) s3.classList.add("gone"); row.appendChild(s3); }
      }
      el.appendChild(row);
    } else if (kind === "line") {
      var n = a + b - 1;
      for (var m = 1; m <= n; m++) {
        var s4 = document.createElement("span"); s4.className = "em"; s4.innerHTML = IMG.svg(m === a ? "rabbit" : "chick");
        s4.style.animationDelay = (m * 120) + "ms";
        if (m === a) { s4.style.filter = "drop-shadow(0 0 8px gold)"; s4.style.transform = "scale(1.3)"; }
        el.appendChild(s4); if (m < n) el.appendChild(document.createTextNode(" "));
      }
      var c = document.createElement("div"); c.style.cssText = "font-size:13px;color:#888;margin-top:6px"; c.textContent = "👆 红圈里是小明"; el.appendChild(c);
    }
  }

  /* ---------- 语文 连线 ---------- */
  var selL = -1, selR = -1, matched = 0;
  function renderMatch(q, bd) {
    selL = -1; selR = -1; matched = 0; q.leftEls = []; q.rightEls = [];
    bd.innerHTML = "<div class='match'><div class='col' id='colL'></div><div class='col' id='colR'></div></div>" +
      "<div class='hint'>👆 先点左边的字，再点右边它的反义词</div>";
    q.left.forEach(function (w, i) {
      var d = document.createElement("div"); d.className = "mi"; d.textContent = w;
      d.onclick = function () { if (d.classList.contains("done")) return; selL = i;
        [].concat(q.leftEls, q.rightEls).forEach(function (x) { x.classList.remove("sel"); }); d.classList.add("sel"); tryMatch(q); };
      q.leftEls.push(d); $("colL").appendChild(d);
    });
    q.right.forEach(function (w, i) {
      var d = document.createElement("div"); d.className = "mi"; d.textContent = w;
      d.onclick = function () { if (d.classList.contains("done")) return; selR = i;
        [].concat(q.leftEls, q.rightEls).forEach(function (x) { x.classList.remove("sel"); }); d.classList.add("sel"); tryMatch(q); };
      q.rightEls.push(d); $("colR").appendChild(d);
    });
  }
  function tryMatch(q) {
    if (selL < 0 || selR < 0) return;
    var lw = q.left[selL], rw = q.right[selR];
    var ok = q.pairs.some(function (p) { return (p[0] === lw && p[1] === rw) || (p[1] === lw && p[0] === rw); });
    var le = q.leftEls[selL], re = q.rightEls[selR];
    if (ok) {
      le.classList.add("done"); re.classList.add("done"); le.classList.remove("sel"); re.classList.remove("sel");
      matched++; Speech.speak(lw + "对" + rw); selL = -1; selR = -1;
      if (matched === q.pairs.length) { answered = true; score += 10; $("sc").textContent = score; U.confetti();
        Speech.speak("全部连对啦！"); showResult(q, true, ""); }
    } else {
      le.classList.add("err"); re.classList.add("err"); Speech.speak("不对哦，再想想");
      setTimeout(function () { le.classList.remove("err", "sel"); re.classList.remove("err", "sel"); }, 450);
      selL = -1; selR = -1;
    }
  }

  /* ---------- 加载一题 ---------- */
  function loadQ() {
    answered = false; var q = quiz[idx];
    var tag = q.tag ? (" · " + q.tag) : (q.kp ? (" · " + q.kp) : "");
    $("qno").textContent = "第 " + (idx + 1) + " 题" + tag;
    $("qtext").innerHTML = q.html ? q.html : U.hlNums(q.text || "");
    $("eq").textContent = ""; $("eq").className = "eqshow";
    $("vd").textContent = ""; $("vd").className = "verdict";
    $("scene").style.display = ""; $("body2").innerHTML = "";
    if ($("passageBox")) $("passageBox").innerHTML = "";
    if (q.passage && $("passageBox")) $("passageBox").innerHTML = "<div class='passage'>" + q.passage + "</div>";

    var aa = $("ansarea");
    var isProblem = !!q.kind;
    var isMath = (q.type === "n" || q.type === "cmp" || (q.scene && !q.opts));
    var isChinese = !isProblem && !isMath;

    if (isProblem) { renderProblemScene(q); }
    else if (isMath) { renderMathScene(q); }

    if (isChinese && q.type === "match") {
      $("scene").style.display = "none";
      renderMatch(q, $("body2"));
      aa.innerHTML = "<div class='ctr'><button class='btn bigbtn next' id='nxBtn' style='display:none'>下一题 ▶</button></div>";
      $("nxBtn").onclick = next;
    } else if (isChinese && q.type === "speak") {
      $("scene").style.display = "none";
      $("body2").innerHTML = q.html + "<div class='ctr'><button class='btn bigbtn' id='doneBtn'>🎤 说好啦</button></div>";
      $("doneBtn").onclick = function () { if (answered) return; answered = true; score += 10; $("sc").textContent = score;
        U.confetti(); Speech.speak("说得真好！"); showResult(q, true, ""); };
    } else if (isChinese) {
      $("scene").style.display = "none";
      if (q._raw) { q.opts = U.shuffled(q._raw.opts); q.ans = q.opts.indexOf(q._raw.ans); }
      aa.innerHTML = "";
      $("body2").innerHTML = "<div class='opts" + (q.opts && q.opts.length <= 2 ? " c1" : "") + "'>" +
        q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>";
      $("body2").querySelectorAll(".opt").forEach(function (el) { el.onclick = function () { doOpt(q, +el.dataset.i, el); }; });
    } else if (isMath && q.type === "cmp") {
      aa.innerHTML = "<div class='answer'><div class='cmpbtns'><button data-v='>'>＞</button><button data-v='<'>＜</button><button data-v='='>＝</button></div>" +
        "<button class='btn bigbtn next' id='nxBtn' style='display:none'>下一题 ▶</button></div>";
      aa.querySelectorAll("[data-v]").forEach(function (b) { b.onclick = function () { if (!answered) doCmp(q, b.dataset.v, b); }; });
      $("nxBtn").onclick = next;
    } else {
      // 应用题 / 数学数字题
      var isOrd = q.kind === "ord";
      aa.innerHTML = "<div class='answer'><input id='inp' type='" + (isOrd ? "text" : "number") + "' inputmode='numeric' placeholder='？' autocomplete='off'>" +
        "<button class='btn bigbtn' id='okBtn'>✔ 检查</button><button class='btn bigbtn next' id='nxBtn' style='display:none'>下一题 ▶</button></div>";
      $("okBtn").onclick = function () { checkProblem(q); };
      $("nxBtn").onclick = next;
      $("inp").addEventListener("keydown", function (e) { if (e.key === "Enter") { answered ? next() : checkProblem(q); } });
      if (!isOrd) setTimeout(function () { if ($("inp")) $("inp").focus(); }, 400);
    }
    setTimeout(function () { Speech.speak(q.say || q.text || ""); }, 700);
  }

  /* ---------- 判定 ---------- */
  function showResult(q, ok, extra) {
    answered = true;
    if (ok) { score += 10; $("sc").textContent = score; U.confetti(); Speech.speak(U.pick(PRAISE));
      $("vd").textContent = "✔ 答对啦！+10 分"; $("vd").className = "verdict good"; Banks.record(q.kp || q.tag || "综合", true); }
    else {
      $("card").classList.add("shake"); setTimeout(function () { $("card").classList.remove("shake"); }, 500);
      Speech.speak(U.pick(CHEER));
      $("vd").textContent = "✘ 正确答案：" + extra; $("vd").className = "verdict bad"; Banks.record(q.kp || q.tag || "综合", false);
      if (q.teach) { var t = document.createElement("div"); t.className = "teach"; t.textContent = "💡 " + q.teach; $("vd").parentNode.appendChild(t); }
    }
    $("eq").textContent = q.eq || ""; if (q.eq) $("eq").classList.add("show");
    var nx = $("nxBtn"); if (nx) { nx.style.display = ""; nx.textContent = (idx === quiz.length - 1) ? "看成绩 🏁" : "下一题 ▶"; }
  }

  function checkProblem(q) {
    if (answered) return;
    var v = $("inp").value.trim(); if (v === "") { if ($("inp")) $("inp").focus(); return; }
    if (q.kind === "ord") {
      var ok = (v === q.textAns || v === String(q.k) || (q.row && IMG.get(q.row[q.k - 1]) && IMG.get(q.row[q.k - 1]).name === v));
      if (ok) { score += 10; $("sc").textContent = score; $("inp").className = "ok"; $("inp").disabled = true; U.confetti(); Speech.speak(U.pick(PRAISE));
        $("vd").textContent = "✔ 答对啦！+10 分"; $("vd").className = "verdict good"; $("eq").textContent = q.textAns; $("eq").classList.add("show"); Banks.record(q.kp, true); showNextOnly(); }
      else { $("card").classList.add("shake"); setTimeout(function () { $("card").classList.remove("shake"); }, 500); Speech.speak(q.textAns);
        $("vd").textContent = "✘ 再看看哦"; $("vd").className = "verdict bad"; $("eq").textContent = "正确答案：" + q.textAns; $("eq").classList.add("show"); Banks.record(q.kp, false); showNextOnly(); }
      return;
    }
    var ok2 = parseInt(v, 10) === q.ans;
    if (q.kind === "sub" || q.kind === "sub2") {
      var ems = q.els || [], t = 400;
      var go = function (from, n) { for (var i = from; i < from + n; i++) { (function (i) { setTimeout(function () { if (ems[i]) ems[i].classList.add("gone"); }, t); })(i); t += 260; } };
      if (q.kind === "sub") go(q.goneFrom, q.b); else { go(q.goneFrom, q.b); go(q.goneFrom + q.b, q.c); }
    }
    if (ok2) { score += 10; $("sc").textContent = score; $("inp").className = "ok"; $("inp").disabled = true; U.confetti(); Speech.speak(U.pick(PRAISE));
      $("vd").textContent = "✔ 答对啦！+10 分"; $("vd").className = "verdict good"; $("eq").textContent = q.eq; $("eq").classList.add("show"); Banks.record(q.kp, true); }
    else { $("inp").className = "no"; $("inp").disabled = true; $("card").classList.add("shake"); setTimeout(function () { $("card").classList.remove("shake"); }, 500);
      Speech.speak(U.pick(CHEER)); $("vd").textContent = "✘ 正确答案：" + q.ans; $("vd").className = "verdict bad"; $("eq").textContent = q.eq; $("eq").classList.add("show"); Banks.record(q.kp, false);
      if (q.teach) { var t2 = document.createElement("div"); t2.className = "teach"; t2.textContent = "💡 " + q.teach; $("vd").parentNode.appendChild(t2); } }
    showNextOnly();
  }
  function showNextOnly() {
    var okB = $("okBtn"); if (okB) okB.style.display = "none";
    var nx = $("nxBtn"); if (nx) { nx.style.display = ""; nx.textContent = (idx === quiz.length - 1) ? "看成绩 🏁" : "下一题 ▶"; }
  }

  function doOpt(q, i, el) {
    if (answered) return; answered = true;
    var ok = i === q.ans;
    document.querySelectorAll(".opt").forEach(function (x) { x.classList.add("x"); });
    el.classList.add(ok ? "ok" : "no");
    if (!ok) { var right = document.querySelectorAll(".opt")[q.ans]; if (right) right.classList.add("ok"); }
    showResult(q, ok, q.speakAns || (q.opts ? q.opts[q.ans] : ""));
  }
  function doCmp(q, v, btn) {
    if (answered) return; var ok = v === q.cmp;
    btn.style.borderColor = ok ? "#2ecc71" : "#e74c3c"; btn.style.background = ok ? "#eafff2" : "#ffefef";
    showResult(q, ok, q.cmp);
  }

  function next() {
    idx++;
    if (idx >= quiz.length) {
      var stars = score >= (quiz.length * 10 * 0.9) ? "🌟🌟🌟" : score >= (quiz.length * 10 * 0.6) ? "🌟🌟" : "🌟";
      $("card").innerHTML = "<div class='done'><div class='medal'>🏅</div><h2>巩固完成！得分 " + score + " 分</h2><div class='stars'>" + stars + "</div>" +
        "<p>共 " + quiz.length + " 题，答对 " + (score / 10) + " 题 · 薄弱点一点点变少啦！</p>" +
        "<button class='btn bigbtn' onclick='location.reload()'>🔄 再练一次</button>" +
        "<button class='btn bigbtn next' onclick=\"location.href='主页.html'\">🏠 返回主页</button></div>";
      U.confetti(40); Speech.speak("巩固完成！你得了" + score + "分，真棒！"); return;
    }
    loadQ();
  }

  /* ---------- 启动 ---------- */
  $("startBtn").onclick = function () { Banks.loadExternal().then(function () { startWith(null); }); };
  $("startAllBtn").onclick = function () { Banks.loadExternal().then(function () { startWith(null); }); };
  $("clearBtn").onclick = function () { Banks.clearWeak(); renderWeak(); Speech.speak("已清空薄弱点记录"); };
  $("spkBtn").onclick = function () { var q = quiz[idx]; if (q) Speech.speak(q.say || q.text || ""); };
  renderWeak();
  // 自动尝试加载外部题库（失败回退内置）
  Banks.loadExternal();
})();
