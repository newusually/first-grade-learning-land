/*
 * config.js — 基础层 / 全局配置
 * 站点级常量、导航链接、主题色、题库路径。供各业务层与页面层引用。
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  App.config = {
    title: "一年级趣味学习乐园",
    // 四个子页面链接（保留主页.html 与 index.html 同名双入口）
    pages: {
      home: "主页.html",
      abacus: "口算动画课堂.html",
      problems: "看图学应用.html",
      math: "数学测试卷.html",
      chinese: "语文测试卷.html"
    },
    // 外部题库目录（可选，覆盖内置随机题库；不存在则自动回退内置）
    bankDir: "题库",
    author: "为一年级小朋友打造 · 语音 + 动画 + 随机出题",
    // 各页题量（可在版本迭代中调整）
    counts: {
      problems: 15,
      math: 18,
      chinese: 16
    }
  };
})(window);
