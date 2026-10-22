/*
 * nature.js — 数据层 / 英语·动物自然
 * 纯 JSON 数据（人教PEP一年级起点 + 三年级起点基础词汇），JS 只负责调用。
 * 结构：{ meta:{name, icon}, pages:[ {id, title, items:[{en,cn,ph,img}]}, ... ] }
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  App.DATA = App.DATA || {};
  App.DATA.english = App.DATA.english || {};
  App.DATA.english.nature =
{"meta": {"name": "动物·自然·动作", "icon": "🐾"}, "pages": [{"id": "animals", "title": "动物", "items": [{"en": "cat", "cn": "猫", "ph": "/kæt/", "img": "🐱"}, {"en": "dog", "cn": "狗", "ph": "/dɒɡ/", "img": "🐶"}, {"en": "pig", "cn": "猪", "ph": "/pɪɡ/", "img": "🐷"}, {"en": "duck", "cn": "鸭子", "ph": "/dʌk/", "img": "🦆"}, {"en": "rabbit", "cn": "兔子", "ph": "/ˈræbɪt/", "img": "🐰"}, {"en": "horse", "cn": "马", "ph": "/hɔːs/", "img": "🐴"}, {"en": "cow", "cn": "奶牛", "ph": "/kaʊ/", "img": "🐮"}, {"en": "sheep", "cn": "羊", "ph": "/ʃiːp/", "img": "🐑"}, {"en": "monkey", "cn": "猴子", "ph": "/ˈmʌŋki/", "img": "🐵"}, {"en": "bird", "cn": "鸟", "ph": "/bɜːd/", "img": "🐦"}, {"en": "tiger", "cn": "老虎", "ph": "/ˈtaɪɡə/", "img": "🐯"}, {"en": "elephant", "cn": "大象", "ph": "/ˈelɪfənt/", "img": "🐘"}]}, {"id": "nature", "title": "自然与天气", "items": [{"en": "sun", "cn": "太阳", "ph": "/sʌn/", "img": "☀️"}, {"en": "moon", "cn": "月亮", "ph": "/muːn/", "img": "🌙"}, {"en": "star", "cn": "星星", "ph": "/stɑː/", "img": "⭐"}, {"en": "tree", "cn": "树", "ph": "/triː/", "img": "🌳"}, {"en": "flower", "cn": "花", "ph": "/ˈflaʊə/", "img": "🌸"}, {"en": "rain", "cn": "雨", "ph": "/reɪn/", "img": "🌧️"}, {"en": "snow", "cn": "雪", "ph": "/snəʊ/", "img": "❄️"}, {"en": "wind", "cn": "风", "ph": "/wɪnd/", "img": "💨"}]}, {"id": "actions", "title": "动作", "items": [{"en": "run", "cn": "跑", "ph": "/rʌn/", "img": "🏃"}, {"en": "jump", "cn": "跳", "ph": "/dʒʌmp/", "img": "🤸"}, {"en": "swim", "cn": "游泳", "ph": "/swɪm/", "img": "🏊"}, {"en": "sing", "cn": "唱歌", "ph": "/sɪŋ/", "img": "🎤"}, {"en": "dance", "cn": "跳舞", "ph": "/dɑːns/", "img": "💃"}, {"en": "read", "cn": "读书", "ph": "/riːd/", "img": "📖"}, {"en": "write", "cn": "写字", "ph": "/raɪt/", "img": "✍️"}, {"en": "draw", "cn": "画画", "ph": "/drɔː/", "img": "🎨"}]}, {"id": "toys", "title": "玩具与用品", "items": [{"en": "ball", "cn": "球", "ph": "/bɔːl/", "img": "⚽"}, {"en": "kite", "cn": "风筝", "ph": "/kaɪt/", "img": "🪁"}, {"en": "doll", "cn": "娃娃", "ph": "/dɒl/", "img": "🪆"}, {"en": "car", "cn": "小汽车", "ph": "/kɑː/", "img": "🚗"}, {"en": "plane", "cn": "飞机", "ph": "/pleɪn/", "img": "✈️"}, {"en": "boat", "cn": "小船", "ph": "/bəʊt/", "img": "⛵"}]}]};
})(window);
