/*
 * numbers.js — 数据层 / 数学·数字认知
 * 纯 JSON 数据（人教版一年级为基础整理），JS 只负责调用，不在这里写逻辑。
 * 结构：{ meta:{name, icon}, pages:[ {id, title, items:[...]}, ... ] } 分类 + 分页
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  App.DATA = App.DATA || {};
  App.DATA.math = App.DATA.math || {};
  App.DATA.math.numbers =
{"meta": {"name": "数字 0-20", "icon": "🔢"}, "pages": [{"id": "n0", "title": "认识 0-4", "items": [{"n": 0, "cn": "零", "py": "líng", "img": "⭐"}, {"n": 1, "cn": "一", "py": "yī", "img": "⭐"}, {"n": 2, "cn": "二", "py": "èr", "img": "⭐"}, {"n": 3, "cn": "三", "py": "sān", "img": "⭐"}, {"n": 4, "cn": "四", "py": "sì", "img": "⭐"}]}, {"id": "n5", "title": "认识 5-9", "items": [{"n": 5, "cn": "五", "py": "wǔ", "img": "⭐"}, {"n": 6, "cn": "六", "py": "liù", "img": "⭐"}, {"n": 7, "cn": "七", "py": "qī", "img": "⭐"}, {"n": 8, "cn": "八", "py": "bā", "img": "⭐"}, {"n": 9, "cn": "九", "py": "jiǔ", "img": "⭐"}]}, {"id": "n10", "title": "认识 10-14", "items": [{"n": 10, "cn": "十", "py": "shí", "img": "⭐"}, {"n": 11, "cn": "十一", "py": "shí yī", "img": "⭐"}, {"n": 12, "cn": "十二", "py": "shí èr", "img": "⭐"}, {"n": 13, "cn": "十三", "py": "shí sān", "img": "⭐"}, {"n": 14, "cn": "十四", "py": "shí sì", "img": "⭐"}]}, {"id": "n15", "title": "认识 15-19", "items": [{"n": 15, "cn": "十五", "py": "shí wǔ", "img": "⭐"}, {"n": 16, "cn": "十六", "py": "shí liù", "img": "⭐"}, {"n": 17, "cn": "十七", "py": "shí qī", "img": "⭐"}, {"n": 18, "cn": "十八", "py": "shí bā", "img": "⭐"}, {"n": 19, "cn": "十九", "py": "shí jiǔ", "img": "⭐"}]}]};
})(window);
