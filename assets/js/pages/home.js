/*
 * home.js — 应用层 / 主页
 * 顶部寄语轮换（优先加载 banner.txt，失败用内置），首次进入轻声问好。
 */
(function () {
  "use strict";
  var App = window.App, Speech = App.Speech;
  var FALLBACK = ["今天也要加油哦！", "学习使我最快乐！", "每天进步一点点！", "我是识字小达人！", "口算大王就是我！", "答对了有彩带哦！", "棒棒的一天开始啦！"];
  var banner = document.getElementById("banner");
  if (banner) {
    try {
      App.ajax("banner.txt").then(function (t) {
        var s = (t && t.trim()) ? t.trim().split("\n")[0] : FALLBACK[new Date().getDate() % FALLBACK.length];
        banner.textContent = "🌟 " + s + " 🌟";
      }).catch(function () {
        banner.textContent = "🌟 " + FALLBACK[new Date().getDate() % FALLBACK.length] + " 🌟";
      });
    } catch (e) {
      banner.textContent = "🌟 " + FALLBACK[0] + " 🌟";
    }
  }
  // 轻量问好（用户首次触摸后才会出声，兼容手机）
  document.addEventListener("click", function once() {
    if (Speech) Speech.speak("欢迎来到一年级趣味学习乐园，开始学习吧！", { rate: 0.9 });
    document.removeEventListener("click", once);
  }, { once: true });
})();
