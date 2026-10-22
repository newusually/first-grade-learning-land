/*
 * chinese-learn-page.js — 应用层 / 语文学习小课堂
 * 标签页：拼音跟读 / 认字卡片 / 组词造句 / 课文背诵 / 知识点总结。
 */
(function () {
  "use strict";
  var App = window.App, Speech = App.Speech, U = App.U, CL = App.ChineseLearn, IMG = App.IMG;
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

  /* ---- 拼音 ---- */
  var py = CL.pinyin;
  function chip(text, ex) {
    return "<span class='pychip' onclick='CLICK.py(\"" + text + "\")'>" + text + (ex ? "<i>" + ex + "</i>" : "") + "</span>";
  }
  $("pyBox").innerHTML =
    "<div class='pysec'><div class='pyh'>声母</div><div class='pyrow'>" + py.shengmu.map(function (s) { return chip(s, py.examples[s]); }).join("") + "</div></div>" +
    "<div class='pysec'><div class='pyh'>韵母</div><div class='pyrow'>" + py.yunmu.map(function (s) { return chip(s, py.examples[s]); }).join("") + "</div></div>" +
    "<div class='pysec'><div class='pyh'>整体认读</div><div class='pyrow'>" + py.zhengti.map(function (s) { return chip(s, py.examples[s]); }).join("") + "</div></div>" +
    "<div class='hint'>👆 点一读一读，跟着声音念（点“读”按钮可跟读）</div>";

  /* ---- 认字 ---- */
  $("charBox").innerHTML = "<div class='chargrid'>" + CL.characters.map(function (c, i) {
    return "<div class='charcard' onclick='CLICK.char(" + i + ")'><div class='charbig'>" + c.zi + "</div><div class='charpy' id='cpy" + i + "'>？？</div><div class='charimg' id='cimg" + i + "'></div></div>";
  }).join("") + "</div><div class='hint'>👆 点一张字卡，翻出拼音和图片</div>";

  /* ---- 组词造句 ---- */
  var practiceIdx = 0;
  function nextPractice() {
    var box = $("pracBox");
    if (practiceIdx % 2 === 0) {
      var z = CL.guidedZuci();
      box.innerHTML = "<div class='qtext' style='font-size:18px'>用“<b>" + z.zi + "</b>”组词，选出正确的：</div>" +
        "<div class='opts'>" + z.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div><div class='gfb' id='pfb'></div>";
      bindPractice(z.ans, "“" + z.zi + "”可以组成：" + z.words.join("、"));
    } else {
      var j = CL.guidedZaoju();
      box.innerHTML = "<div class='qtext' style='font-size:18px'>用“<b>" + j.word + "</b>”造句，选最通顺的一句：<br><span style='color:#888'>" + j.tmpl + "</span></div>" +
        "<div class='opts'>" + j.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div><div class='gfb' id='pfb'></div>";
      bindPractice(j.ans, "通顺的句子是：" + j.tmpl.replace("____", j.opts[j.ans]));
    }
    practiceIdx++;
  }
  function bindPractice(ans, explain) {
    var box = $("pracBox");
    box.querySelectorAll(".opt").forEach(function (op) {
      op.onclick = function () {
        if (box.dataset.done) return; box.dataset.done = "1";
        var i = +op.dataset.i, ok = i === ans;
        box.querySelectorAll(".opt").forEach(function (x) { x.classList.add("x"); });
        op.classList.add(ok ? "ok" : "no");
        if (!ok) { var r = box.querySelectorAll(".opt")[ans]; if (r) r.classList.add("ok"); }
        var fb = $("pfb");
        fb.innerHTML = (ok ? "✔ 很棒！" : "✘ 再想想：") + "<span class='gexplain'>" + explain + "</span>";
        fb.className = "gfb " + (ok ? "good" : "bad");
        if (ok) U.confetti(12);
        Speech.speak(ok ? "很棒！" : explain);
      };
    });
  }
  $("pracNext").onclick = function () { var b = $("pracBox"); b.dataset.done = ""; nextPractice(); };
  nextPractice();

  /* ---- 课文背诵 ---- */
  $("textBox").innerHTML = "<div class='textlist'>" + CL.texts.map(function (t, i) {
    return "<div class='textitem' onclick='CLICK.text(" + i + ")'><div class='ttitle'>" + t.title + "</div><div class='tbody' id='tbody" + i + "' style='display:none'>" + t.body + "<div class='hint'>" + t.tip + "</div><button class='btn spk' onclick='event.stopPropagation();CLICK.recite(" + i + ")'>🔊 跟读/背诵</button></div></div>";
  }).join("") + "</div>";

  /* ---- 知识点 ---- */
  $("kpBox").innerHTML = "<div class='kpwrap'>" + CL.summary.map(function (s) {
    return "<div class='kpcol'><div class='kphead'>" + s.cat + "</div><ul>" + s.points.map(function (p) { return "<li>" + p + "</li>"; }).join("") + "</ul></div>";
  }).join("") + "</div>";

  /* ---- 交互暴露 ---- */
  window.CLICK = {
    py: function (s) { Speech.speak(s, { rate: 0.7 }); },
    char: function (i) {
      var c = CL.characters[i];
      $("cpy" + i).textContent = c.py;
      $("cimg" + i).innerHTML = IMG.svg(c.img) || "⭐";
      Speech.speak(c.zi + "，" + c.py);
    },
    text: function (i) {
      var el = $("tbody" + i); el.style.display = (el.style.display === "none" ? "" : "none");
    },
    recite: function (i) { Speech.speak(CL.texts[i].body); }
  };
})();
