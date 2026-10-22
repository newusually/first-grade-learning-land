/*
 * chinese-page.js — 应用层 / 语文测试卷
 * 题型：看拼音/选读音/数笔画/量词/课文/阅读/反义词连线/看图说话/组词/造句/连词成句。
 * 从题库池抽题（含真题融合），判分、记录薄弱知识点，结束给出小结。
 */
(function () {
  "use strict";
  var App = window.App, U = App.U, Speech = App.Speech, Banks = App.Banks;
  function $(id) { return document.getElementById(id); }
  var quiz = [], idx = 0, score = 0, answered = false;
  var PRAISE = ["答对啦，真棒！", "太厉害了！", "完全正确！", "你真是语文小达人！"];
  var CHEER = ["没关系，再想一想哦。", "差一点点，加油！", "再读一读，试一次！"];

  function loadQ() {
    answered = false; var q = quiz[idx];
    if (q._raw) { q.opts = U.shuffled(q._raw.opts); q.ans = q.opts.indexOf(q._raw.ans); }
    if (q.passage) { var pb = $("passageBox"); if (pb) pb.innerHTML = "<div class='passage'>" + q.passage + "</div>"; }
    $("qno").textContent = "第 " + (idx + 1) + " 题 · " + q.tag;
    $("qtext").innerHTML = q.html;
    $("eq").textContent = ""; $("vd").textContent = ""; $("vd").className = "verdict";
    var bd = $("body2"); bd.innerHTML = "";
    if (q.type === "match") { renderMatch(q, bd); }
    else if (q.type === "speak") {
      bd.innerHTML = q.html + "<div class='ctr'><button class='btn bigbtn' id='doneBtn'>🎤 说好啦</button></div>";
      $("doneBtn").onclick = function () { if (answered) return; answered = true; score += 10; $("sc").textContent = score;
        U.confetti(); Speech.speak("说得真好！"); $("vd").textContent = "✔ 说得真好！+10 分"; $("vd").className = "verdict good"; Banks.record(q.kp, true); showNext(); };
    } else {
      bd.innerHTML = "<div class='opts" + (q.opts.length <= 2 ? " c1" : "") + "'>" +
        q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>";
      bd.querySelectorAll(".opt").forEach(function (el) { el.onclick = function () { doOpt(q, +el.dataset.i, el); }; });
    }
    setTimeout(function () { Speech.speak(q.say); }, 700);
  }

  function doOpt(q, i, el) {
    if (answered) return; answered = true;
    var ok = i === q.ans;
    document.querySelectorAll(".opt").forEach(function (x) { x.classList.add("x"); });
    el.classList.add(ok ? "ok" : "no");
    if (!ok) { var right = document.querySelectorAll(".opt")[q.ans]; if (right) right.classList.add("ok"); }
    if (ok) { score += 10; $("sc").textContent = score; U.confetti(); Speech.speak(U.pick(PRAISE));
      $("vd").textContent = "✔ 答对啦！+10 分"; $("vd").className = "verdict good"; Banks.record(q.kp, true); }
    else {
      $("card").classList.add("shake"); setTimeout(function () { $("card").classList.remove("shake"); }, 500);
      Speech.speak(U.pick(CHEER)); Banks.record(q.kp, false);
      $("vd").textContent = "✘ 正确答案：" + (q.speakAns || q.opts[q.ans]); $("vd").className = "verdict bad";
      if (q.teach) { var t = document.createElement("div"); t.className = "teach"; t.textContent = "💡 " + q.teach; $("vd").parentNode.appendChild(t); }
    }
    showNext();
  }

  var selL = -1, selR = -1, matched = 0;
  function renderMatch(q, bd) {
    selL = -1; selR = -1; matched = 0; q.leftEls = []; q.rightEls = [];
    bd.innerHTML = "<div class='match'><div class='col' id='colL'></div><div class='col' id='colR'></div></div>" +
      "<div class='hint'>👆 先点左边的字，再点右边它的反义词</div>" +
      "<div class='ctr'><button class='btn bigbtn next' id='nxBtn' style='display:none'>下一题 ▶</button></div>";
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
        Speech.speak("全部连对啦！"); $("vd").textContent = "✔ 全部连对！+10 分"; $("vd").className = "verdict good"; Banks.record(q.kp, true); showNext(); }
    } else {
      le.classList.add("err"); re.classList.add("err"); Speech.speak("不对哦，再想想");
      setTimeout(function () { le.classList.remove("err", "sel"); re.classList.remove("err", "sel"); }, 450);
      selL = -1; selR = -1;
    }
  }

  function showNext() {
    var nx = $("nxBtn");
    if (nx) { nx.style.display = ""; nx.textContent = (idx === quiz.length - 1) ? "看成绩 🏁" : "下一题 ▶"; nx.onclick = next; return; }
    var ctr = $("body2").querySelector(".ctr");
    if (ctr) { ctr.innerHTML = "<button class='btn bigbtn next' id='nxBtn2'>" + (idx === quiz.length - 1 ? "看成绩 🏁" : "下一题 ▶") + "</button>"; $("nxBtn2").onclick = next; return; }
  }
  function next() {
    idx++;
    if (idx >= quiz.length) {
      var stars = score >= (quiz.length * 10 * 0.9) ? "🌟🌟🌟" : score >= (quiz.length * 10 * 0.6) ? "🌟🌟" : "🌟";
      $("card").innerHTML = "<div class='done'><div class='medal'>🎓</div><h2>测试完成！得分 " + score + " 分</h2><div class='stars'>" + stars + "</div>" +
        "<p>共 " + quiz.length + " 题，答对 " + (score / 10) + " 题 · 语文小达人就是你！</p>" +
        "<button class='btn bigbtn' onclick='location.reload()'>🔄 再测一次</button>" +
        "<button class='btn bigbtn next' onclick=\"location.href='巩固练习.html'\">🎯 薄弱点巩固</button>" +
        "<button class='btn bigbtn next' onclick=\"location.href='口算动画课堂.html'\">🏠 返回动画课堂</button></div>";
      U.confetti(40); Speech.speak("测试完成！你得了" + score + "分，你真是语文小达人！"); return;
    }
    loadQ();
  }

  $("spkBtn").onclick = function () { var q = quiz[idx]; if (q) Speech.speak(q.say); };
  Banks.loadExternal().then(function () {
    quiz = Banks.draw("chinese", App.config.counts.chinese || 16);
    loadQ();
  });
  setTimeout(function () { if (!quiz.length) { quiz = Banks.draw("chinese", App.config.counts.chinese || 16); loadQ(); } }, 1500);
})();
