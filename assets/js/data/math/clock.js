/*
 * clock.js — 数据层 / 数学·时间
 * 纯 JSON 数据（人教版一年级为基础整理），JS 只负责调用，不在这里写逻辑。
 * 结构：{ meta:{name, icon}, pages:[ {id, title, items:[...]}, ... ] } 分类 + 分页
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  App.DATA = App.DATA || {};
  App.DATA.math = App.DATA.math || {};
  App.DATA.math.clock =
{"meta": {"name": "钟表与日历", "icon": "🕐"}, "pages": [{"id": "clock", "title": "认识钟表", "items": [{"name": "时针", "en": "hour hand", "f": "最短最粗，走一大格是 1 小时", "eg": "时针走一圈是 12 小时"}, {"name": "分针", "en": "minute hand", "f": "长一些，走一小格是 1 分钟", "eg": "分针走一圈是 60 分钟"}, {"name": "秒针", "en": "second hand", "f": "最细最长，走一小格是 1 秒", "eg": "秒针走一圈是 60 秒"}, {"name": "整时", "en": "o'clock", "f": "分针指 12，时针指几就几时", "eg": "时针指 8、分针指 12，就是 8 时"}, {"name": "半时", "en": "half past", "f": "分针指 6，时针走过几", "eg": "时针过 3、分针指 6，就是 3 时半"}]}, {"id": "week", "title": "星期与日历", "items": [{"name": "星期一", "en": "Monday", "f": "一周的第 1 天", "eg": "星期一要升旗"}, {"name": "星期三", "en": "Wednesday", "f": "一周的第 3 天", "eg": "星期三有体育课"}, {"name": "星期六", "en": "Saturday", "f": "一周的第 6 天", "eg": "星期六不用上学"}, {"name": "星期日", "en": "Sunday", "f": "一周的第 7 天", "eg": "星期日也叫星期天"}]}, {"id": "year", "title": "年、月、日", "items": [{"name": "一年", "en": "year", "f": "12 个月，约 365 天", "eg": "2026 年是平年"}, {"name": "大月", "en": "big month", "f": "31 天：1、3、5、7、8、10、12 月", "eg": "七月是大月"}, {"name": "小月", "en": "small month", "f": "30 天：4、6、9、11 月", "eg": "六月是小月"}, {"name": "二月", "en": "February", "f": "平年 28 天，闰年 29 天", "eg": "2028 年二月有 29 天"}]}]};
})(window);
