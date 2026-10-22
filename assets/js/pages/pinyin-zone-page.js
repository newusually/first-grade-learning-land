/*
 * pinyin-zone-page.js — 应用层 / 拼音专区
 * 标签页：写法 / 组成 / 拼读 / 记忆 / 朗读 / 组词填字。
 */
(function () {
  "use strict";
  var App = window.App, Speech = App.Speech, U = App.U, PZ = App.PinyinZone;
  function $(id) { return document.getElementById(id); }

  /* ---- 标签切换 ---- */
  document.querySelectorAll(".ltab").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll(".ltab").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      document.querySelectorAll(".lpanel").forEach(function (p) { p.style.display = "none"; });
      var p = $(b.dataset.tab); if (p) p.style.display = "";
    };
  });

  /* ---- 1. 写法（四线三格） ---- */
  function renderWrite() {
    var cards = PZ.writeCards();
    var html = "<div class='pz-intro'>📝 拼音写在<b>四线三格</b>里，每个字母都有自己住的地方：</div><div class='sxs-wrap'>";
    html += cards.map(function (c) {
      return "<div class='sxscard' onclick='PZCLICK.read(\"" + c.s + "\")'>" +
        "<div class='sxs'><span class='sxs-letter'>" + c.s + "</span></div>" +
        "<div class='sxs-pos'>" + c.pos + "</div>" +
        "<div class='sxs-name'>" + c.s + "</div></div>";
    }).join("");
    html += "</div><div class='hint'>👆 点一点字母，听一听怎么读（占格：中格/上中格/中下格/上中下格）</div>";
    $("writeBox").innerHTML = html;
  }

  /* ---- 2. 组成（声+韵+调） ---- */
  function renderCompose() {
    var box = $("composeBox");
    function show() {
      var q = PZ.composeQuiz();
      box.dataset.done = "";
      box.innerHTML =
        "<div class='pz-intro'>🧩 一个音节 = <b>声母</b> + <b>韵母</b>（再加声调）。把它们拼起来：</div>" +
        "<div class='compose'>" +
        "<div class='cpart'><span class='clab'>声母</span><span class='cval'>" + q.parts[0] + "</span></div>" +
        "<span class='cplus'>+</span>" +
        "<div class='cpart'><span class='clab'>韵母</span><span class='cval'>" + q.parts[1] + "</span></div>" +
        "<span class='cplus'>=</span>" +
        "<div class='cpart cres'><span class='clab'>拼出来</span><span class='cval' id='cres'>？</span></div>" +
        "</div>" +
        "<div class='ctr'>" +
        "<button class='btn' onclick='PZCLICK.pin()'>🔊 拼一拼</button>" +
        "<button class='btn next' onclick='PZCLICK.composeNext()'>下一组 ▶</button>" +
        "</div>" +
        "<div class='gfb' id='composefb'></div>";
      box._q = q;
    }
    window.PZCLICK = window.PZCLICK || {};
    window.PZCLICK.composeNext = show;
    window.PZCLICK.pin = function () {
      var q = box._q;
      $("cres").textContent = q.blended;
      var fb = $("composefb");
      fb.innerHTML = "拼出来是 <b>" + q.blended + "</b> → " + q.word;
      fb.className = "gfb good";
      Speech.speak(q.blended, { rate: 0.7 });
      setTimeout(function () { Speech.speak(q.word); }, 700);
    };
    show();
  }

  /* ---- 3. 拼读练习 ---- */
  function renderBlend() {
    var box = $("blendBox");
    function show() {
      var q = PZ.blendQuiz();
      box.dataset.done = "";
      box.innerHTML =
        "<div class='qtext'>把下面两部分<b>拼</b>起来，是哪个音节？</div>" +
        "<div class='blend-show'>" + q.show + "</div>" +
        "<div class='opts'>" + q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>" +
        "<div class='gfb' id='blendfb'></div>" +
        "<div class='ctr'><button class='btn next' onclick='PZCLICK.blendNext()'>下一题 ▶</button></div>";
      box._q = q;
      bindOpts(box, "blendfb", function (ok) {
        if (ok) { Speech.speak(q.full, { rate: 0.7 }); setTimeout(function () { Speech.speak(q.ansWord); }, 600); }
      });
    }
    window.PZCLICK = window.PZCLICK || {};
    window.PZCLICK.blendNext = show;
    show();
  }

  /* ---- 4. 形象记忆 ---- */
  function renderMem() {
    var cards = PZ.memoryCards();
    var html = "<div class='pz-intro'>🧠 用口诀记住拼音长什么样：</div><div class='mem-wrap'>";
    html += cards.map(function (c, i) {
      return "<div class='memcard' onclick='PZCLICK.read(\"" + c.k + "\")'>" +
        "<div class='mem-k'>" + c.k + "</div><div class='mem-tip'>" + c.tip + "</div></div>";
    }).join("");
    html += "</div><div class='hint'>👆 点一张，读一读这个拼音</div>";
    $("memBox").innerHTML = html;
  }

  /* ---- 5. 四声朗读 ---- */
  function renderTone() {
    var box = $("toneBox");
    function show() {
      var q = PZ.toneQuiz();
      box.dataset.done = "";
      box.innerHTML =
        "<div class='qtext'>这个拼音是 <b>" + q.syl + "</b>（" + q.zi + "），它读第几声？</div>" +
        "<div class='tone-show'>" + q.syl + "</div>" +
        "<div class='opts'>" + q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>" +
        "<div class='gfb' id='tonefb'></div>" +
        "<div class='ctr'><button class='btn spk' onclick='PZCLICK.readTone()'>🔊 听一听</button><button class='btn next' onclick='PZCLICK.toneNext()'>下一题 ▶</button></div>";
      box._q = q;
      window.PZCLICK = window.PZCLICK || {};
      window.PZCLICK.readTone = function () { Speech.speak(q.syl, { rate: 0.7 }); };
      window.PZCLICK.toneNext = show;
      bindOpts(box, "tonefb", function (ok) {
        if (ok) Speech.speak(q.note);
      });
    }
    show();
  }

  /* ---- 6. 组词填字 ---- */
  function renderFill() {
    var box = $("fillBox");
    function show() {
      var q = PZ.fillQuiz();
      box.dataset.done = "";
      box.innerHTML =
        "<div class='qtext'>下面的拼音是 <b>" + q.py + "</b>，应该写哪个字？</div>" +
        "<div class='fill-show'>" + q.py + "</div>" +
        "<div class='opts'>" + q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>" +
        "<div class='gfb' id='fillfb'></div>" +
        "<div class='ctr'><button class='btn next' onclick='PZCLICK.fillNext()'>下一题 ▶</button></div>";
      box._q = q;
      window.PZCLICK = window.PZCLICK || {};
      window.PZCLICK.fillNext = show;
      bindOpts(box, "fillfb", function (ok) {
        if (ok) Speech.speak(q.py);
      });
    }
    show();
  }

  /* ---- 选项绑定通用 ---- */
  function bindOpts(box, fbId, after) {
    box.querySelectorAll(".opt").forEach(function (op) {
      op.onclick = function () {
        if (box.dataset.done) return; box.dataset.done = "1";
        var i = +op.dataset.i, q = box._q, ok = (i === q.ans);
        box.querySelectorAll(".opt").forEach(function (x) { x.classList.add("x"); });
        op.classList.add(ok ? "ok" : "no");
        if (!ok) { var r = box.querySelectorAll(".opt")[q.ans]; if (r) r.classList.add("ok"); }
        var fb = $(fbId);
        fb.innerHTML = (ok ? "✔ 真棒！" : "✘ 再想想：正确答案是 ") + "<span class='gexplain'>" +
          (ok ? "" : (q.ansWord || q.opts[q.ans])) + "</span>";
        fb.className = "gfb " + (ok ? "good" : "bad");
        if (ok) { U.confetti(12); Speech.sfx.right(); } else { Speech.sfx.wrong(); }
        if (after) after(ok);
      };
    });
  }

  /* ---- 交互暴露 ---- */
  window.PZCLICK = window.PZCLICK || {};
  window.PZCLICK.read = function (s) { Speech.speak(s, { rate: 0.7 }); };

  renderWrite();
  renderCompose();
  renderBlend();
  renderMem();
  renderTone();
  renderFill();
})();
