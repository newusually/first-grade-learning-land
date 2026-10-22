/*
 * writing-zone-page.js — 应用层 / 写作专区
 * 标签页：看图写话 / 句子仿写 / 连词成句 / 量词搭配 / 标点练习。
 */
(function () {
  "use strict";
  var App = window.App, Speech = App.Speech, U = App.U, IMG = App.IMG, WZ = App.WritingZone;
  function $(id) { return document.getElementById(id); }

  document.querySelectorAll(".ltab").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll(".ltab").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      document.querySelectorAll(".lpanel").forEach(function (p) { p.style.display = "none"; });
      var p = $(b.dataset.tab); if (p) p.style.display = "";
    };
  });

  /* ---- 1. 看图写话 ---- */
  function renderPicture() {
    var box = $("picBox");
    function show() {
      var t = WZ.pictureWrite();
      box._t = t;
      box.innerHTML =
        "<div class='pic-wrap'><div class='pic-img'>" + (IMG.svg(t.img) || "⭐") + "</div>" +
        "<div class='pic-words'>提示词：" + t.words.map(function (x) { return "<span class='pw'>" + x + "</span>"; }).join(" ") + "</div></div>" +
        "<div class='qtext'>用上面的词，写一句话吧：</div>" +
        "<textarea class='wt-area' id='wtArea' placeholder='在这里写一句话…'></textarea>" +
        "<div class='ctr'>" +
        "<button class='btn' onclick='WZCLICK.model()'>👀 看范例</button>" +
        "<button class='btn spk' onclick='WZCLICK.readModel()'>🔊 读范例</button>" +
        "<button class='btn next' onclick='WZCLICK.picNext()'>换一张 ▶</button>" +
        "</div>" +
        "<div class='gfb' id='picfb'></div>";
    }
    window.WZCLICK = window.WZCLICK || {};
    window.WZCLICK.picNext = show;
    window.WZCLICK.model = function () {
      var fb = $("picfb");
      fb.innerHTML = "范例：" + box._t.model;
      fb.className = "gfb good";
    };
    window.WZCLICK.readModel = function () { Speech.speak(box._t.model); };
    show();
  }

  /* ---- 2. 句子仿写 ---- */
  function renderImitate() {
    var box = $("imitBox");
    function show() {
      var q = WZ.imitateQuiz();
      box.dataset.done = "";
      box.innerHTML =
        "<div class='qtext'>范例：<b>" + q.model + "</b></div>" +
        "<div class='qtext'>照样子写：<b>" + q.tmpl + "</b></div>" +
        "<div class='opts'>" + q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>" +
        "<div class='gfb' id='imitfb'></div>" +
        "<div class='ctr'><button class='btn next' onclick='WZCLICK.imitNext()'>下一题 ▶</button></div>";
      box._q = q;
      window.WZCLICK = window.WZCLICK || {};
      window.WZCLICK.imitNext = show;
      bindOpts(box, "imitfb");
    }
    show();
  }

  /* ---- 3. 连词成句 ---- */
  function renderOrder() {
    var box = $("orderBox");
    function show() {
      var q = WZ.orderQuiz();
      box._q = q; box._picked = [];
      box.innerHTML =
        "<div class='qtext'>把这些词排成一句通顺的话（点词排顺序）：</div>" +
        "<div class='order-pool' id='orderPool'>" + q.shuffled.map(function (w, i) {
          return "<span class='oword' data-w='" + w + "' onclick='WZCLICK.pick(this)'>" + w + "</span>";
        }).join("") + "</div>" +
        "<div class='order-ans' id='orderAns'><span class='ph'>点上面的词，排到这里 →</span></div>" +
        "<div class='ctr'>" +
        "<button class='btn' onclick='WZCLICK.checkOrder()'>✅ 检查</button>" +
        "<button class='btn' onclick='WZCLICK.clearOrder()'>↺ 重排</button>" +
        "<button class='btn next' onclick='WZCLICK.orderNext()'>换一题 ▶</button>" +
        "</div>" +
        "<div class='gfb' id='orderfb'></div>";
      window.WZCLICK = window.WZCLICK || {};
      window.WZCLICK.orderNext = show;
    }
    window.WZCLICK = window.WZCLICK || {};
    window.WZCLICK.pick = function (el) {
      if (el.classList.contains("used")) return;
      el.classList.add("used");
      var ans = $("orderAns");
      var ph = ans.querySelector(".ph"); if (ph) ans.innerHTML = "";
      var s = document.createElement("span"); s.className = "oword in"; s.textContent = el.dataset.w;
      ans.appendChild(s);
    };
    window.WZCLICK.clearOrder = function () {
      var pool = $("orderPool");
      if (pool) pool.querySelectorAll(".oword").forEach(function (x) { x.classList.remove("used"); });
      $("orderAns").innerHTML = "<span class='ph'>点上面的词，排到这里 →</span>";
    };
    window.WZCLICK.checkOrder = function () {
      var q = box._q;
      var ans = $("orderAns");
      var got = Array.prototype.slice.call(ans.querySelectorAll(".oword.in")).map(function (x) { return x.textContent; });
      var right = q.words.join("");
      var gotStr = got.join("");
      var fb = $("orderfb");
      if (gotStr === right) {
        fb.innerHTML = "✔ 真棒！" + right;
        fb.className = "gfb good"; U.confetti(14); Speech.sfx.right();
      } else {
        fb.innerHTML = "✘ 再试试：正确是 <span class='gexplain'>" + right + "</span>";
        fb.className = "gfb bad"; Speech.sfx.wrong();
      }
    };
    show();
  }

  /* ---- 4. 量词搭配 ---- */
  function renderMeasure() {
    var box = $("measBox");
    function show() {
      var q = WZ.measureQuiz();
      box.dataset.done = "";
      box.innerHTML =
        "<div class='qtext'>一（ <b>？</b> ）" + q.noun + " —— 选哪个量词？</div>" +
        "<div class='opts'>" + q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>" +
        "<div class='gfb' id='measfb'></div>" +
        "<div class='ctr'><button class='btn next' onclick='WZCLICK.measNext()'>下一题 ▶</button></div>";
      box._q = q;
      window.WZCLICK = window.WZCLICK || {};
      window.WZCLICK.measNext = show;
      bindOpts(box, "measfb", function (ok) { if (ok) Speech.speak("一" + q.opts[q.ans] + q.noun); });
    }
    show();
  }

  /* ---- 5. 标点练习 ---- */
  function renderPunct() {
    var box = $("punctBox");
    function show() {
      var q = WZ.punctQuiz();
      box.dataset.done = "";
      box.innerHTML =
        "<div class='qtext'>这句话末尾应该用什么标点？</div>" +
        "<div class='punct-show'>" + q.sent + "（　　）</div>" +
        "<div class='opts'>" + q.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>" +
        "<div class='gfb' id='punctfb'></div>" +
        "<div class='ctr'><button class='btn next' onclick='WZCLICK.punctNext()'>下一题 ▶</button></div>";
      box._q = q;
      window.WZCLICK = window.WZCLICK || {};
      window.WZCLICK.punctNext = show;
      bindOpts(box, "punctfb", function (ok) { if (ok) Speech.speak(q.sent + q.opts[q.ans]); });
    }
    show();
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
        fb.innerHTML = (ok ? "✔ 真棒！" : "✘ 再想想：") + "<span class='gexplain'>" +
          (ok ? "" : (q.opts[q.ans])) + "</span>";
        fb.className = "gfb " + (ok ? "good" : "bad");
        if (ok) { U.confetti(12); Speech.sfx.right(); } else { Speech.sfx.wrong(); }
        if (after) after(ok);
      };
    });
  }

  renderPicture();
  renderImitate();
  renderOrder();
  renderMeasure();
  renderPunct();
})();
