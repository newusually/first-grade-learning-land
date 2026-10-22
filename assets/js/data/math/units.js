/*
 * units.js — 数据层 / 数学·单位换算
 * 纯 JSON 数据（人教版一年级为基础整理），JS 只负责调用，不在这里写逻辑。
 * 结构：{ meta:{name, icon}, pages:[ {id, title, items:[...]}, ... ] } 分类 + 分页
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  App.DATA = App.DATA || {};
  App.DATA.math = App.DATA.math || {};
  App.DATA.math.units =
{"meta": {"name": "单位与换算", "icon": "📏"}, "pages": [{"id": "length", "title": "长度单位", "items": [{"name": "厘米", "sym": "cm", "rel": "1 米 = 100 厘米", "eg": "食指宽约 1 厘米"}, {"name": "米", "sym": "m", "rel": "1 米 = 10 分米", "eg": "课桌高约 70 厘米"}, {"name": "分米", "sym": "dm", "rel": "1 分米 = 10 厘米", "eg": "手掌长约 1 分米"}, {"name": "千米", "sym": "km", "rel": "1 千米 = 1000 米", "eg": "操场一圈约 200 米"}]}, {"id": "weight", "title": "重量单位", "items": [{"name": "克", "sym": "g", "rel": "1 千克 = 1000 克", "eg": "一枚 2 分硬币约 1 克"}, {"name": "千克", "sym": "kg", "rel": "1 千克 = 1 公斤", "eg": "两袋盐约重 1 千克"}, {"name": "吨", "sym": "t", "rel": "1 吨 = 1000 千克", "eg": "一头大象约重 4 吨"}]}, {"id": "volume", "title": "容量单位", "items": [{"name": "毫升", "sym": "mL", "rel": "1 升 = 1000 毫升", "eg": "一小勺水约 5 毫升"}, {"name": "升", "sym": "L", "rel": "1 升 = 1000 毫升", "eg": "一大瓶可乐约 2 升"}]}, {"id": "time", "title": "时间单位", "items": [{"name": "秒", "sym": "s", "rel": "1 分 = 60 秒", "eg": "眨一下眼约 1 秒"}, {"name": "分", "sym": "min", "rel": "1 时 = 60 分", "eg": "一节课约 40 分钟"}, {"name": "时", "sym": "h", "rel": "1 天 = 24 时", "eg": "睡一晚约 10 小时"}, {"name": "天", "sym": "d", "rel": "1 周 = 7 天", "eg": "一个星期有 7 天"}]}, {"id": "money", "title": "人民币单位", "items": [{"name": "分", "sym": "1分", "rel": "1 角 = 10 分", "eg": "一分钱很少啦"}, {"name": "角", "sym": "1角", "rel": "1 元 = 10 角", "eg": "一块橡皮约 5 角"}, {"name": "元", "sym": "1元", "rel": "1 元 = 10 角", "eg": "一个笔记本约 3 元"}]}, {"id": "convert", "title": "换算练习", "items": [{"name": "3 米 = ? 厘米", "sym": "300", "rel": "3 × 100 = 300", "eg": "米换厘米，后面加两个 0"}, {"name": "5 千克 = ? 克", "sym": "5000", "rel": "5 × 1000 = 5000", "eg": "千克换克，加三个 0"}, {"name": "2 时 = ? 分", "sym": "120", "rel": "2 × 60 = 120", "eg": "时换分，乘 60"}, {"name": "4 元 = ? 角", "sym": "40", "rel": "4 × 10 = 40", "eg": "元换角，乘 10"}]}]};
})(window);
