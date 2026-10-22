/*
 * growth-page.js — 应用层 / 成长小课堂
 * 渲染 App.Social.topics（霸凌应对/人际交往/学习方法/做人处事），含故事、好方法、互动自测。
 */
(function () {
  "use strict";
  var App = window.App, Speech = App.Speech, U = App.U;
  function $(id) { return document.getElementById(id); }
  var topics = (App.Social && App.Social.topics) || [];
  var box = $("topicBox");
  var CAST = { bully: ["boy", "bear"], friend: ["girl", "rabbit"], study: ["kid", "cat"], manners: ["teacher", "panda"], sharing: ["girl", "monkey"], calm: ["boy", "frog"], body: ["girl", "rabbit"], respect: ["teacher", "bear"], sos: ["kid", "dog"] };
  if (!box) return;
  var html = "";
  topics.forEach(function (t, idx) {
    var tips = t.tips.map(function (x) { return "<li>" + x + "</li>"; }).join("");
    var cast = CAST[t.id] || ["kid", "cat"];
    html += "<div class='gcard'>" +
      "<div class='ghead'><span class='gicon'>" + t.icon + "</span><div><div class='gcat'>" + t.cat + "</div><div class='gtitle'>" + t.title + "</div></div>" +
      "<button class='btn spk' onclick='GROWTH.read(" + idx + ")'>🔊 读给我听</button></div>" +
      "<div class='gcast' id='cast" + idx + "'>" + App.Anim.stage({ people: [cast[0]], animals: [cast[1]] }) + "</div>" +
      "<div class='gstory'>" + t.story + "</div>" +
      "<div class='gtip'><b>✅ 好方法</b><ul>" + tips + "</ul></div>" +
      "<div class='gquiz' id='quiz" + idx + "'></div>" +
      "</div>";
  });
  box.innerHTML = html;

  // 渲染每题自测
  topics.forEach(function (t, idx) {
    var qz = t.quiz;
    var el = $("quiz" + idx);
    el.innerHTML = "<div class='qtext' style='font-size:16px'>" + qz.q + "</div>" +
      "<div class='opts'>" + qz.opts.map(function (o, i) { return "<div class='opt' data-i='" + i + "'>" + o + "</div>"; }).join("") + "</div>" +
      "<div class='gfb' id='gfb" + idx + "'></div>";
    el.querySelectorAll(".opt").forEach(function (op) {
      op.onclick = function () {
        if (el.dataset.done) return; el.dataset.done = "1";
        var i = +op.dataset.i, ok = i === qz.a;
        el.querySelectorAll(".opt").forEach(function (x) { x.classList.add("x"); });
        op.classList.add(ok ? "ok" : "no");
        if (!ok) { var r = el.querySelectorAll(".opt")[qz.a]; if (r) r.classList.add("ok"); }
        var fb = $("gfb" + idx);
        fb.innerHTML = (ok ? "✔ 你真棒！" : "✘ 再想想：") + "<span class='gexplain'>" + qz.explain + "</span>";
        fb.className = "gfb " + (ok ? "good" : "bad");
        if (ok) U.confetti(14);
        Speech.speak(ok ? "你真棒！" : qz.explain);
      };
    });
  });

  window.GROWTH = {
    read: function (i) {
      var t = topics[i];
      if (App.Anim) App.Anim.celebrate(document.getElementById("cast" + i));
      Speech.speak(t.title + "。" + t.story + "。" + t.tips.join("。") + "。");
    }
  };
})();
