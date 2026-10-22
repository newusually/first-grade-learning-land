/*
 * math-page.js — 应用层 / 数学测试卷
 * 从题库池抽题（含真题融合 + 乘除混合），渲染、判分、记录薄弱知识点，结束给出针对性小结。
 */
(function () {
  "use strict";
  var App = window.App, U = App.U, IMG = App.IMG, Speech = App.Speech, Banks = App.Banks;
  function $(id) { return document.getElementById(id); }
  var quiz = [], idx = 0, score = 0, answered = false;
  var PRAISE = ["答对啦，真棒！", "太厉害了！", "完全正确！", "你真是数学小能手！"];
  var CHEER = ["没关系，再想一想哦。", "差一点点，加油！"];

  function renderScene(sc) {
    var el = $("scene"); el.innerHTML = "";
    if (!sc) return;
    var kind = sc[0][0], e = sc[0][1], a = sc[0][2], b = sc[0][3];
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

  function loadQ() {
    answered = false; var q = quiz[idx];
    $("qno").textContent = "第 " + (idx + 1) + " 题 · " + q.tag;
    $("qtext").innerHTML = q.html;
    $("eq").textContent = ""; $("eq").className = "eqshow";
    $("vd").textContent = ""; $("vd").className = "verdict";
    renderScene(q.scene);
    if ($("passageBox")) $("passageBox").innerHTML = "";
    var aa = $("ansarea"); aa.innerHTML = "";
    if (q.type === "n") {
      aa.innerHTML = "<div class='answer'><input id='inp' type='number' inputmode='numeric' placeholder='？' autocomplete='off'>" +
        "<button class='btn bigbtn' id='okBtn'>✔ 检查</button><button class='btn bigbtn next' id='nxBtn' style='display:none'>下一题 ▶</button></div>";
      $("okBtn").onclick = check; $("nxBtn").onclick = next;
      $("inp").addEventListener("keydown", function (e) { if (e.key === "Enter") answered ? next() : check(); });
      setTimeout(function () { $("inp").focus(); }, 500);
    } else {
      aa.innerHTML = "<div class='answer'><div class='cmpbtns'><button data-v='>'>＞</button><button data-v='<'>＜</button><button data-v='='>＝</button></div>" +
        "<button class='btn bigbtn next' id='nxBtn' style='display:none'>下一题 ▶</button></div>";
      aa.querySelectorAll("[data-v]").forEach(function (b) { b.onclick = function () { if (!answered) doCmp(b.dataset.v, b); }; });
      $("nxBtn").onclick = next;
    }
    setTimeout(function () { Speech.speak(q.say); }, 700);
  }

  function showResult(q, ok, extra) {
    answered = true;
    if (ok) { score += 10; $("sc").textContent = score; U.confetti(); Speech.speak(U.pick(PRAISE));
      $("vd").textContent = "✔ 答对啦！+10 分"; $("vd").className = "verdict good"; Banks.record(q.kp, true); }
    else {
      $("card").classList.add("shake"); setTimeout(function () { $("card").classList.remove("shake"); }, 500);
      Speech.speak(U.pick(CHEER));
      $("vd").textContent = "✘ 正确答案：" + extra; $("vd").className = "verdict bad"; Banks.record(q.kp, false);
      if (q.teach) { var t = document.createElement("div"); t.className = "teach"; t.textContent = "💡 " + q.teach; $("vd").parentNode.appendChild(t); }
    }
    $("eq").textContent = q.eq; $("eq").classList.add("show");
    var okB = $("okBtn"); if (okB) okB.style.display = "none";
    var nx = $("nxBtn"); if (nx) { nx.style.display = ""; nx.textContent = (idx === quiz.length - 1) ? "看成绩 🏁" : "下一题 ▶"; }
  }
  function check() {
    if (answered) return; var q = quiz[idx];
    var v = $("inp").value.trim(); if (v === "") return;
    var ok = parseInt(v, 10) === q.ans;
    if (ok) { $("inp").className = "ok"; } else { $("inp").className = "no"; }
    $("inp").disabled = true; showResult(q, ok, q.ans);
  }
  function doCmp(v, btn) {
    if (answered) return; var q = quiz[idx]; var ok = v === q.cmp;
    btn.style.borderColor = ok ? "#2ecc71" : "#e74c3c"; btn.style.background = ok ? "#eafff2" : "#ffefef";
    showResult(q, ok, q.cmp);
  }
  function next() {
    idx++;
    if (idx >= quiz.length) {
      var stars = score >= (quiz.length * 10 * 0.9) ? "🌟🌟🌟" : score >= (quiz.length * 10 * 0.6) ? "🌟🌟" : "🌟";
      $("card").innerHTML = "<div class='done'><div class='medal'>🏆</div><h2>测试完成！得分 " + score + " 分</h2><div class='stars'>" + stars + "</div>" +
        "<p>共 " + quiz.length + " 题，答对 " + (score / 10) + " 题 · 再来一轮换个新卷子！</p>" +
        "<button class='btn bigbtn' onclick='location.reload()'>🔄 再测一次</button>" +
        "<button class='btn bigbtn next' onclick=\"location.href='巩固练习.html'\">🎯 薄弱点巩固</button>" +
        "<button class='btn bigbtn next' onclick=\"location.href='口算动画课堂.html'\">🏠 返回动画课堂</button></div>";
      U.confetti(40); Speech.speak("测试完成！你得了" + score + "分，真棒！"); return;
    }
    loadQ();
  }

  $("spkBtn").onclick = function () { var q = quiz[idx]; if (q) Speech.speak(q.say); };
  Banks.loadExternal().then(function () {
    quiz = Banks.draw("math", App.config.counts.math || 18);
    loadQ();
  });
  setTimeout(function () { if (!quiz.length) { quiz = Banks.draw("math", App.config.counts.math || 18); loadQ(); } }, 1500);
})();
