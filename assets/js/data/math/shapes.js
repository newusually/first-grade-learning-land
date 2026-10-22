/*
 * shapes.js — 数据层 / 数学·图形
 * 纯 JSON 数据（人教版一年级为基础整理），JS 只负责调用，不在这里写逻辑。
 * 结构：{ meta:{name, icon}, pages:[ {id, title, items:[...]}, ... ] } 分类 + 分页
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  App.DATA = App.DATA || {};
  App.DATA.math = App.DATA.math || {};
  App.DATA.math.shapes =
{"meta": {"name": "图形认识", "icon": "🔺"}, "pages": [{"id": "plane", "title": "平面图形", "items": [{"name": "长方形", "en": "rectangle", "f": "对边相等，4 个直角", "eg": "课本封面是长方形"}, {"name": "正方形", "en": "square", "f": "四边一样长，4 个直角", "eg": "手帕是正方形"}, {"name": "三角形", "en": "triangle", "f": "3 条边，3 个角", "eg": "红领巾是三角形"}, {"name": "圆", "en": "circle", "f": "没有角，边缘光滑", "eg": "车轮是圆形"}, {"name": "平行四边形", "en": "parallelogram", "f": "对边平行且相等", "eg": "伸缩门是平行四边形"}]}, {"id": "solid", "title": "立体图形", "items": [{"name": "正方体", "en": "cube", "f": "6 个面都是正方形", "eg": "魔方是正方体"}, {"name": "长方体", "en": "cuboid", "f": "6 个面，相对的面一样", "eg": "牙膏盒是长方体"}, {"name": "圆柱", "en": "cylinder", "f": "上下一样粗，能滚动", "eg": "易拉罐是圆柱"}, {"name": "球", "en": "sphere", "f": "没有平面，到处能滚", "eg": "篮球是球"}]}, {"id": "build", "title": "图形拼组", "items": [{"name": "七巧板", "en": "tangram", "f": "7 块板拼出各种形状", "eg": "能拼出小猫、小船、房子"}, {"name": "对称", "en": "symmetry", "f": "对折后两边一样", "eg": "蝴蝶翅膀是对称的"}, {"name": "拼图形", "en": "combine", "f": "两个三角拼成正方形", "eg": "两个圆能拼成葫芦"}]}]};
})(window);
