/*
 * english-zone-page.js — 应用层 / 英语专区
 * 标签页：字母 / 单词 / 组词 / 句子 / 完形填空 / 听力 / 背诵 / 记忆妙招。
 */
(function () {
  "use strict";
  var App = window.App, Speech = App.Speech, U = App.U, IMG = App.IMG, EZ = App.EnglishZone;
  function $(id) { return document.getElementById(id); }

  document.querySelectorAll(".ltab").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll(".ltab").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      document.querySelectorAll(".lpanel").forEach(function (p) { p.style.display = "none"; });
      var p = $(b.dataset.tab); if (p) p.style.display = "";
    };
  });

  /* ---- 1. 字母 ---- */
  function renderLetters() {
    var html = "<div class='ez-intro'>🔤 点字母卡片，听一听它的发音和例词：</div><div class='letter-wrap'>";
    html += EZ.LETTERS.map(function (L, i) {
      return "<div class='letter-card' onclick='EZCLICK.letter(" + i + ")'>" +
        "<div class='lc-up'>" + L.up + "</div><div class='lc-low'>" + L.low + "</div>" +
        (L.img ? "<div class='lc-img'>" + (IMG.svg(L.img) || "") + "</div>" : "<div class='lc-img lc-noimg'>" + L.word + "</div>") +
        "<div class='lc-word'>" + L.word + " " + L.zh + "</div></div>";
    }).join("");
    html += "</div>";
    $("letterBox").innerHTML = html;
    window.EZCLICK = window.EZCLICK || {};
    window.EZCLICK.letter = function (i) {
      var L = EZ.LETTERS[i];
      Speech.speakEn(L.low, { rate: 0.8 });
      setTimeout(function () { Speech.speakEn(L.word, { rate: 0.8 }); }, 650);
    };
  }

  /* ---- 2. 单词 ---- */
  function renderVocab() {
    var html = "<div class='ez-intro'>📚 点单词卡，听一听、看一看意思：</div><div class='vocab-wrap'>";
    html += EZ.VOCAB.map(function (v, i) {
      return "<div class='vocab-card' onclick='EZCLICK.vocab(" + i + ")'>" +
        (v.img ? "<div class='vc-img'>" + (IMG.svg(v.img) || "") + "</div>" : "<div class='vc-img vc-noimg'>" + v.en + "</div>") +
        "<div class='vc-en'>" + v.en + "</div><div class='vc-zh' id='vczh" + i + "'>？</div></div>";
    }).join("");
    html += "</div>";
    $("vocabBox").innerHTML = html;
    window.EZCLICK = window.EZCLICK || {};
    window.EZCLICK.vocab = function (i) {
      var v = EZ.VOCAB[i];
      $("vczh" + i).textContent = v.zh;
      Speech.speakEn(v.en, { rate: 0.85 });
    };
  }

  /* ---- 3. 组词（CVC 拼写） ---- */
  function renderCvc() {
    var box = $("cvcBox");
    function show() {
      var q = EZ.cvcQuiz();
      box._q = q; box._picked = [];
      box.innerHTML =
        "<div class='qtext'>看图/提示，把下面的字母拼成单词：</div>" +
        "<div class='cvc-show'>" + (q.img ? (IMG.svg(q.img) || "") : "<span class='cvc-hint'>" + q.word.length + " 个字母</span>") + "</div>" +
        "<div class='order-pool' id='cvcPool'>" + q.tiles.map(function (c) {
          return "<span class='oword' data-w='" + c + "' onclick='EZCLICK.cvcPick(this)'>" + c + "</span>";
        }).join("") + "</div>" +
        "<div class='order-ans' id='cvcAns'><span class='ph'>点字母，拼到这里 →</span></div>" +
        "<div class='ctr'>" +
        "<button class='btn' onclick='EZCLICK.cvcCheck()'>✅ 检查</button>" +
        "<button class='btn' onclick='EZCLICK.cvcClear()'>↺ 重拼</button>" +
        "<button class='btn next' onclick='EZCLICK.cvcNext()'>换一个 ▶</button>" +
        "</div>" +
        "<div class='gfb' id='cvcfb'></div>";
      window.EZCLICK = window.EZCLICK || {};
      window.EZCLICK.cvcNext = show;
    }
    window.EZCLICK = window.EZCLICK || {};
    window.EZCLICK.cvcPick = function (el) {
      if (el.classList.contains("used")) return;
      el.classList.add("used");
      var ans = $("cvcAns"); var ph = ans.querySelector(".ph"); if (ph) ans.innerHTML = "";
      var s = document.createElement("span"); s.className = "oword in"; s.textContent = el.dataset.w; ans.appendChild(s);
    };
    window.EZCLICK.cvcClear = function () {
      var pool = $("cvcPool"); if (pool) pool.querySelectorAll(".oword").forEach(function (x) { x.classList.remove("used"); });
      $("cvcAns").innerHTML = "<span class='ph'>点字母，拼到这里 →</span>";
    };
    window.EZCLICK.cvcCheck = function () {
      var q = box._q;
      var got = Array.prototype.slice.call($("cvcAns").querySelectorAll(".oword.in")).map(function (x) { return x.textContent; }).join("");
      var fb = $("cvcfb");
      if (got === q.word) {
        fb.innerHTML = "✔ 拼对啦：" + q.word;
        fb.className = "gfb good"; U.confetti(14); Speech.sfx.right(); Speech.speakEn(q.word, { rate: 0.85 });
      } else {
        fb.innerHTML = "✘ 再拼拼：正确答案是 <span class='gexplain'>" + q.word + "</span>";
        fb.className = "gfb bad"; Speech.sfx.wrong();
      }
    };
    show();
  }

  /* ---- 4. 句子（连词成句） ---- */
  function renderSentence() {
    var box = $("sentBox");
    function show() {
      var q = EZ.sentenceQuiz();
      box._q = q;
      box.innerHTML =
        "<div class='qtext'>把词排成一句通顺的英文（点词排顺序）：</div>" +
        "<div class='order-pool' id='sentPool'>" + q.shuffled.map(function (w) {
          return "<span class='oword' data-w='" + w + "' onclick='EZCLICK.sentPick(this)'>" + w + "</span>";
        }).join("") + "</div>" +
        "<div class='order-ans' id='sentAns'><span class='ph'>点上面的词，排到这里 →</span></div>" +
        "<div class='ctr'>" +
        "<button class='btn' onclick='EZCLICK.sentCheck()'>✅ 检查</button>" +
        "<button class='btn' onclick='EZCLICK.sentClear()'>↺ 重排</button>" +
        "<button class='btn next' onclick='EZCLICK.sentNext()'>换一题 ▶</button>" +
        "</div>" +
        "<div class='gfb' id='sentfb'></div>";
      window.EZCLICK = window.EZCLICK || {};
      window.EZCLICK.sentNext = show;
    }
    window.EZCLICK = window.EZCLICK || {};
    window.EZCLICK.sentPick = function (el) {
      if (el.classList.contains("used")) return; el.classList.add("used");
      var ans = $("sentAns"); var ph = ans.querySelector(".ph"); if (ph) ans.innerHTML = "";
      var s = document.createElement("span"); s.className = "oword in"; s.textContent = el.dataset.w; ans.appendChild(s);
    };
    window.EZCLICK.sentClear = function () {
      var pool = $("sentPool"); if (pool) pool.querySelectorAll(".oword").forEach(function (x) { x.classList.remove("used"); });
      $("sentAns").innerHTML = "<span class='ph'>点上面的词，排到这里 →</span>";
    };
    window.EZCLICK.sentCheck = function () {
      var q = box._q;
      var got = Array.prototype.slice.call($("sentAns").querySelectorAll(".oword.in")).map(function (x) { return x.textContent; }).join(" ");
      var right = q.words.join(" ");
      var fb = $("sentfb");
      if (got === right) {
        fb.innerHTML = "✔ 真棒！" + right;
        fb.className = "gfb good"; U.confetti(14); Speech.sfx.right(); Speech.speakEn(right, { rate: 0.8 });
      } else {
        fb.innerHTML = "✘ 再试试：正确是 <span class='gexplain'>" + right + "</span>";
        fb.className = "gfb bad"; Speech.sfx.wrong();
      }
    };
    show();
  }

  /* ---- 5. 完形填空 ---- */
  function renderCloze() {
    var box = $("clozeBox");
    function show() {
      var q = EZ.clozeQuiz();
      box.dataset.done = "";
      box.innerHTML =
        "<div class='qtext'>选一个词，把句子补充完整：</div>" +
        "<div class='cloze-show'>" + q.text.replace("___", "<span class='blank'>(　　)</span>") + "</div>" +
        "<div class='opts'>" + q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>" +
        "<div class='gfb' id='clozefb'></div>" +
        "<div class='ctr'><button class='btn next' onclick='EZCLICK.clozeNext()'>下一题 ▶</button></div>";
      box._q = q;
      window.EZCLICK = window.EZCLICK || {};
      window.EZCLICK.clozeNext = show;
      bindOpts(box, "clozefb", function (ok) { if (ok) Speech.speakEn(q.text.replace("___", q.opts[q.ans]), { rate: 0.8 }); });
    }
    show();
  }

  /* ---- 6. 听力 ---- */
  function renderListen() {
    var box = $("listenBox");
    function show() {
      var q = EZ.listenQuiz();
      box.dataset.done = "";
      box.innerHTML =
        "<div class='qtext'>👂 仔细听，选出你听到的词：</div>" +
        "<div class='ctr'><button class='bigbtn' onclick='EZCLICK.play()'>🔊 听一听</button>" +
        "<button class='btn' onclick='EZCLICK.play()'>🔁 再听一次</button></div>" +
        "<div class='opts'>" + q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>" +
        "<div class='gfb' id='listenfb'></div>" +
        "<div class='ctr'><button class='btn next' onclick='EZCLICK.listenNext()'>下一题 ▶</button></div>";
      box._q = q;
      window.EZCLICK = window.EZCLICK || {};
      window.EZCLICK.listenNext = show;
      window.EZCLICK.play = function () { Speech.speakEn(q.say, { rate: 0.8 }); };
      bindOpts(box, "listenfb", function (ok) { if (ok) Speech.speakEn(q.opts[q.ans], { rate: 0.8 }); });
      setTimeout(function () { Speech.speakEn(q.say, { rate: 0.8 }); }, 400);
    }
    show();
  }

  /* ---- 7. 背诵 ---- */
  function renderRecite() {
    var html = "<div class='ez-intro'>📜 跟着读一读、背一背：</div><div class='recite-list'>";
    html += EZ.RECITE.map(function (r, i) {
      return "<div class='recite-card'><div class='rc-title'>" + r.title + "</div>" +
        "<div class='rc-text'>" + r.text + "</div>" +
        "<button class='btn spk' onclick='EZCLICK.recite(" + i + ")'>🔊 跟我读</button></div>";
    }).join("");
    html += "</div>";
    $("reciteBox").innerHTML = html;
    window.EZCLICK = window.EZCLICK || {};
    window.EZCLICK.recite = function (i) { Speech.speakEn(EZ.RECITE[i].text, { rate: 0.8 }); };
  }

  /* ---- 8. 记忆妙招 ---- */
  function renderTips() {
    var html = "<div class='ez-intro'>💡 记英语单词的小妙招：</div><div class='tips-wrap'>";
    html += EZ.TIPS.map(function (t) {
      return "<div class='tip-card'><div class='tip-t'>" + t.t + "</div><div class='tip-d'>" + t.d + "</div></div>";
    }).join("");
    html += "</div>";
    $("tipsBox").innerHTML = html;
  }

  function bindOpts(box, fbId, after) {
    var q = box._q;
    box.querySelectorAll(".opt").forEach(function (op) {
      op.onclick = function () {
        if (box.dataset.done) return; box.dataset.done = "1";
        var i = +op.dataset.i, ok = (i === q.ans);
        box.querySelectorAll(".opt").forEach(function (x) { x.classList.add("x"); });
        op.classList.add(ok ? "ok" : "no");
        if (!ok) { var r = box.querySelectorAll(".opt")[q.ans]; if (r) r.classList.add("ok"); }
        var fb = $(fbId);
        fb.innerHTML = (ok ? "✔ 真棒！" : "✘ 再想想：") + "<span class='gexplain'>" + (ok ? "" : (q.opts[q.ans])) + "</span>";
        fb.className = "gfb " + (ok ? "good" : "bad");
        if (ok) { U.confetti(12); Speech.sfx.right(); } else { Speech.sfx.wrong(); }
        if (after) after(ok);
      };
    });
  }

  renderLetters();
  renderVocab();
  renderCvc();
  renderSentence();
  renderCloze();
  renderListen();
  renderRecite();
  renderTips();
})();
