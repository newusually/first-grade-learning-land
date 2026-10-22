/*
 * lessons-page.js — 应用层 / 教案中心
 * 渲染 1-6 年级 × 语文/数学/英语 的单元教案（人教版）。
 * 顶部有会跳动的小动物动画，每单元提供教学目标/重难点/过程/板书/作业，可点“读教案”听朗读。
 */
(function () {
  "use strict";
  var App = window.App, Speech = App.Speech, IMG = App.IMG;
  function $(id) { return document.getElementById(id); }
  if (!App.Lessons) return;

  var L = App.Lessons;
  var SUBJ_ICON = { "语文": "book", "数学": "star", "英语": "cat" };
  var MASCOTS = ["cat", "rabbit", "bear", "bird"];

  var grade = 1, subject = "语文";

  // 顶部动画小动物
  (function renderMascot() {
    var box = $("mascotRow");
    if (!box) return;
    var html = "";
    for (var i = 0; i < MASCOTS.length; i++) {
      html += "<span class='mascot m" + (i + 1) + "'>" + IMG.tag(MASCOTS[i], "imgspan") + "</span>";
    }
    box.innerHTML = html;
  })();

  function renderControls() {
    var gb = $("gradeBox"), sb = $("subjectBox");
    var ghtml = "", i;
    for (i = 0; i < L.grades.length; i++) {
      var g = L.grades[i];
      ghtml += "<span class='gbtn" + (g === grade ? " on" : "") + "' data-g='" + g + "'>" + g + "年级</span>";
    }
    gb.innerHTML = ghtml;
    var shtml = "";
    for (i = 0; i < L.subjects.length; i++) {
      var s = L.subjects[i];
      shtml += "<span class='sbtn" + (s === subject ? " on" : "") + "' data-s='" + s + "'>" + s + "</span>";
    }
    sb.innerHTML = shtml;

    gb.querySelectorAll(".gbtn").forEach(function (el) {
      el.onclick = function () { grade = +el.dataset.g; render(); };
    });
    sb.querySelectorAll(".sbtn").forEach(function (el) {
      el.onclick = function () { subject = el.dataset.s; render(); };
    });
  }

  function renderNote() {
    var nb = $("noteBox");
    if (subject === "英语") nb.innerHTML = "📝 " + L.note;
    else if (subject === "语文") nb.innerHTML = "📝 语文依据人民教育出版社（统编版/部编版）教材单元结构整理。";
    else nb.innerHTML = "📝 数学依据人教版（人民教育出版社）教材单元结构整理。";
  }

  function renderList() {
    var list = $("list");
    var units = (L.data[subject] && L.data[subject][grade]) || [];
    if (!units.length) { list.innerHTML = "<div class='lp-note'>该年级暂无教案。</div>"; return; }
    var icon = SUBJ_ICON[subject] || "book";
    var html = "", i;
    for (i = 0; i < units.length; i++) {
      var u = units[i];
      html += "<div class='lpcard'>" +
        "<div class='lpu'><span class='uicon'>" + IMG.tag(icon, "imgspan") + "</span>" + u.u + "</div>" +
        "<div class='lprow'><b>教学目标</b><span class='v'>" + u.goal + "</span></div>" +
        "<div class='lprow'><b>教学重难点</b><span class='v'>重点：" + u.key + "；难点：" + u.hard + "</span></div>" +
        "<div class='lprow'><b>教学过程</b><span class='v'>" + u.proc + "</span></div>" +
        "<div class='lprow'><b>板书设计</b><span class='v'>" + u.board + "</span></div>" +
        "<div class='lprow'><b>课后作业</b><span class='v'>" + u.hw + "</span></div>" +
        "<div class='lpactions'><button class='btn' data-i='" + i + "'>🔊 读教案</button></div>" +
        "</div>";
    }
    list.innerHTML = html;
    list.querySelectorAll(".lpactions .btn").forEach(function (el) {
      el.onclick = function () {
        var u = units[+el.dataset.i];
        Speech.sfx.pop();
        Speech.speak(u.u + "。" + u.goal + " 重点：" + u.key + "。");
      };
    });
  }

  function render() {
    renderControls();
    renderNote();
    renderList();
  }

  render();
})();
