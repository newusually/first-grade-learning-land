/*
 * english-test-page.js — 应用层 / 英语测试
 * 题型：choice(选词) / listen(听力) / spell(拼写) / cloze(完形填空)
 * 抽题含真题融合与内置随机生成，判分、记录薄弱知识点(kp)，结束给出小结。
 * 英文朗读使用 App.Speech.speakEn（需设备支持英文语音，无则静默）。
 */
(function () {
  "use strict";
  var App = window.App, U = App.U, Speech = App.Speech, Banks = App.Banks;
  function $(id) { return document.getElementById(id); }
  var quiz = [], idx = 0, score = 0, answered = false;
  var PRAISE = ["Great job!", "太棒啦！", "完全正确！", "你真是英语小达人！"];
  var CHEER = ["再想一想哦。", "差一点点，加油！", "再听/读一遍试试！"];

  function cur() { return quiz[idx]; }

  function loadQ() {
    answered = false;
    var q = cur();
    if (!q) return;
    // 选项打乱（choice/cloze/listen）
    if (q.type === "choice" || q.type === "cloze" || q.type === "listen") {
      if (!q._raw) q._raw = { opts: q.opts.slice(), ans: q.ans };
      q.opts = U.shuffled(q._raw.opts);
      q.ans = q.opts.indexOf(q._raw.opts[q._raw.ans]);
    }
    if (q.type === "spell") {
      if (!q._tiles) q._tiles = U.shuffled(q.tiles.slice());
      q.tiles = q._tiles;
    }
    $("no").textContent = (idx + 1);
    $("qno").textContent = "第 " + (idx + 1) + " 题 · " + (q.kp || "英语");
    var qtxt = (q.type === "listen") ? "🔊 听一听，选出你听到的单词：" : (q.q || q.text || "");
    $("qtext").textContent = qtxt;
    $("passageBox").innerHTML = "";
    $("scene").innerHTML = "";
    $("eq").textContent = "";
    $("vd").textContent = ""; $("vd").className = "verdict";
    $("ansarea").innerHTML = "";
    var bd = $("body2"); bd.innerHTML = "";

    if (q.type === "spell") renderSpell(q, bd);
    else if (q.type === "listen") renderListen(q, bd);
    else renderChoice(q, bd);

    setTimeout(function () {
      if (q.type === "listen") Speech.speakEn(q.say);
      else if (q.type === "spell") Speech.speakEn(q.word);
      else if (q.speak) Speech.speakEn(q.speak);
    }, 600);
  }

  function renderChoice(q, bd) {
    var html = "<div class='opts" + (q.opts.length <= 2 ? " c1" : "") + "'>" +
      q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + U.esc(o) + "</div>"; }).join("") + "</div>";
    bd.innerHTML = html;
    bd.querySelectorAll(".opt").forEach(function (el) {
      el.onclick = function () { doOpt(q, +el.dataset.i, el); };
    });
  }

  function renderListen(q, bd) {
    var b = document.createElement("button");
    b.className = "btn bigbtn";
    b.textContent = "🔊 再听一次";
    b.onclick = function () { Speech.speakEn(q.say); };
    bd.appendChild(b);
    bd.insertAdjacentHTML("beforeend", "<div class='opts" + (q.opts.length <= 2 ? " c1" : "") + "'>" +
      q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + U.esc(o) + "</div>"; }).join("") + "</div>");
    bd.querySelectorAll(".opt").forEach(function (el) {
      el.onclick = function () { doOpt(q, +el.dataset.i, el); };
    });
  }

  function renderSpell(q, bd) {
    bd.innerHTML = "<div class='spell-hint'>把字母按顺序拼成单词：<b>" + U.esc(q.word) + "</b></div>" +
      "<div class='slots' id='slots'></div>" +
      "<div class='tiles' id='tiles'></div>" +
      "<div class='ctr'><button class='btn bigbtn' id='chkBtn'>✔ 检查</button>" +
      "<button class='btn' id='speakBtn'>🔊 听单词</button></div>";
    var slotsEl = bd.querySelector("#slots");
    var tilesEl = bd.querySelector("#tiles");
    var slots = new Array(q.word.length);
    var i;
    for (i = 0; i < slots.length; i++) slots[i] = null;

    function addTile(ch) {
      var t = document.createElement("div");
      t.className = "tile"; t.textContent = ch;
      t.onclick = function () {
        if (answered) return;
        var empty = -1, k;
        for (k = 0; k < slots.length; k++) { if (!slots[k]) { empty = k; break; } }
        if (empty < 0) return;
        slots[empty] = ch; t.parentNode.removeChild(t); renderSlots();
      };
      tilesEl.appendChild(t);
    }
    function renderSlots() {
      slotsEl.innerHTML = "";
      for (var j = 0; j < q.word.length; j++) {
        (function (j) {
          var s = document.createElement("div");
          s.className = "sbox" + (slots[j] ? " filled" : "");
          s.textContent = slots[j] ? slots[j] : "";
          s.onclick = function () {
            if (answered) return;
            if (slots[j]) { addTile(slots[j]); slots[j] = null; renderSlots(); }
          };
          slotsEl.appendChild(s);
        })(j);
      }
    }
    q.tiles.forEach(addTile);
    renderSlots();

    bd.querySelector("#chkBtn").onclick = function () {
      if (answered) return; answered = true;
      var guess = slots.join("");
      var ok = (guess === q.word);
      if (ok) {
        score += 10; $("sc").textContent = score; U.confetti(); Speech.speakEn(q.word); Speech.speak("拼对啦！");
        $("vd").textContent = "✔ 拼写正确：" + q.word + " +10 分"; $("vd").className = "verdict good";
        Banks.record(q.kp, true); showNext();
      } else {
        $("card").classList.add("shake"); setTimeout(function () { $("card").classList.remove("shake"); }, 500);
        Speech.speak("再试试"); Banks.record(q.kp, false);
        $("vd").textContent = "✘ 正确拼写：" + q.word; $("vd").className = "verdict bad";
        var t = document.createElement("div"); t.className = "teach"; t.textContent = "💡 提示：按顺序把字母排好，再听一听 " + q.word;
        $("vd").parentNode.appendChild(t);
      }
    };
    bd.querySelector("#speakBtn").onclick = function () { Speech.speakEn(q.word); };
  }

  function doOpt(q, i, el) {
    if (answered) return; answered = true;
    var ok = (i === q.ans);
    document.querySelectorAll(".opt").forEach(function (x) { x.classList.add("x"); });
    el.classList.add(ok ? "ok" : "no");
    if (!ok) { var right = document.querySelectorAll(".opt")[q.ans]; if (right) right.classList.add("ok"); }
    if (ok) {
      score += 10; $("sc").textContent = score; U.confetti(); Speech.speak(U.pick(PRAISE));
      $("vd").textContent = "✔ 答对啦！+10 分"; $("vd").className = "verdict good"; Banks.record(q.kp, true);
    } else {
      $("card").classList.add("shake"); setTimeout(function () { $("card").classList.remove("shake"); }, 500);
      Speech.speak(U.pick(CHEER)); Banks.record(q.kp, false);
      $("vd").textContent = "✘ 正确答案：" + q.opts[q.ans]; $("vd").className = "verdict bad";
      if (q.teach) { var t = document.createElement("div"); t.className = "teach"; t.textContent = "💡 " + q.teach; $("vd").parentNode.appendChild(t); }
    }
    showNext();
  }

  function showNext() {
    if ($("nxBtn")) {
      var b = $("nxBtn");
      b.style.display = "";
      b.textContent = (idx === quiz.length - 1) ? "看成绩 🏁" : "下一题 ▶";
      b.onclick = next; return;
    }
    var wrap = document.createElement("div");
    wrap.className = "ctr";
    wrap.innerHTML = "<button class='btn bigbtn next' id='nxBtn2'>" + (idx === quiz.length - 1 ? "看成绩 🏁" : "下一题 ▶") + "</button>";
    $("body2").appendChild(wrap);
    $("nxBtn2").onclick = next;
  }

  function next() {
    idx++;
    if (idx >= quiz.length) {
      var stars = score >= (quiz.length * 10 * 0.9) ? "🌟🌟🌟" : score >= (quiz.length * 10 * 0.6) ? "🌟🌟" : "🌟";
      $("card").innerHTML = "<div class='done'><div class='medal'>🎓</div><h2>测试完成！得分 " + score + " 分</h2><div class='stars'>" + stars + "</div>" +
        "<p>共 " + quiz.length + " 题，答对 " + (score / 10) + " 题 · 英语小达人就是你！</p>" +
        "<button class='btn bigbtn' onclick='location.reload()'>🔄 再测一次</button>" +
        "<button class='btn bigbtn next' onclick=\"location.href='巩固练习.html'\">🎯 薄弱点巩固</button>" +
        "<button class='btn bigbtn next' onclick=\"location.href='英语专区.html'\">🔡 去英语专区</button></div>";
      U.confetti(40); Speech.speak("测试完成！你得了" + score + "分，你真是英语小达人！"); return;
    }
    loadQ();
  }

  $("spkBtn").onclick = function () {
    var q = cur(); if (!q) return;
    if (q.type === "listen") Speech.speakEn(q.say);
    else if (q.type === "spell") Speech.speakEn(q.word);
    else if (q.speak) Speech.speakEn(q.speak);
    else Speech.speakEn(q.q || q.text || "");
  };

  Banks.loadExternal().then(function () {
    quiz = Banks.draw("english", App.config.counts.english || 14);
    loadQ();
  });
  setTimeout(function () {
    if (!quiz.length) { quiz = Banks.draw("english", App.config.counts.english || 14); loadQ(); }
  }, 1500);
})();
