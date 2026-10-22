/*
 * school.js — 数据层 / 英语·学校文具
 * 纯 JSON 数据（人教PEP一年级起点 + 三年级起点基础词汇），JS 只负责调用。
 * 结构：{ meta:{name, icon}, pages:[ {id, title, items:[{en,cn,ph,img}]}, ... ] }
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  App.DATA = App.DATA || {};
  App.DATA.english = App.DATA.english || {};
  App.DATA.english.school =
{"meta": {"name": "学校与文具", "icon": "🏫"}, "pages": [{"id": "school", "title": "学校场所", "items": [{"en": "school", "cn": "学校", "ph": "/skuːl/", "img": "🏫"}, {"en": "classroom", "cn": "教室", "ph": "/ˈklɑːsruːm/", "img": "🚪"}, {"en": "library", "cn": "图书馆", "ph": "/ˈlaɪbrəri/", "img": "📚"}, {"en": "playground", "cn": "操场", "ph": "/ˈpleɪɡraʊnd/", "img": "🏃"}, {"en": "office", "cn": "办公室", "ph": "/ˈɒfɪs/", "img": "💼"}, {"en": "toilet", "cn": "厕所", "ph": "/ˈtɔɪlət/", "img": "🚻"}]}, {"id": "things", "title": "文具用品", "items": [{"en": "pen", "cn": "钢笔", "ph": "/pen/", "img": "🖊️"}, {"en": "pencil", "cn": "铅笔", "ph": "/ˈpensl/", "img": "✏️"}, {"en": "ruler", "cn": "尺子", "ph": "/ˈruːlə/", "img": "📏"}, {"en": "eraser", "cn": "橡皮", "ph": "/ɪˈreɪzə/", "img": "🧽"}, {"en": "book", "cn": "书", "ph": "/bʊk/", "img": "📕"}, {"en": "bag", "cn": "书包", "ph": "/bæɡ/", "img": "🎒"}, {"en": "crayon", "cn": "蜡笔", "ph": "/ˈkreɪən/", "img": "🖍️"}, {"en": "notebook", "cn": "笔记本", "ph": "/ˈnəʊtbʊk/", "img": "📓"}]}, {"id": "people", "title": "学校的人", "items": [{"en": "teacher", "cn": "老师", "ph": "/ˈtiːtʃə/", "img": "👩‍🏫"}, {"en": "student", "cn": "学生", "ph": "/ˈstjuːdnt/", "img": "🧑‍🎓"}, {"en": "boy", "cn": "男孩", "ph": "/bɔɪ/", "img": "👦"}, {"en": "girl", "cn": "女孩", "ph": "/ɡɜːl/", "img": "👧"}, {"en": "friend", "cn": "朋友", "ph": "/frend/", "img": "🤝"}, {"en": "classmate", "cn": "同学", "ph": "/ˈklɑːsmeɪt/", "img": "🧑‍🤝‍🧑"}]}, {"id": "subjects", "title": "科目", "items": [{"en": "Chinese", "cn": "语文", "ph": "/ˌtʃaɪˈniːz/", "img": "📖"}, {"en": "maths", "cn": "数学", "ph": "/mæθs/", "img": "🧮"}, {"en": "English", "cn": "英语", "ph": "/ˈɪŋɡlɪʃ/", "img": "🔤"}, {"en": "music", "cn": "音乐", "ph": "/ˈmjuːzɪk/", "img": "🎵"}, {"en": "art", "cn": "美术", "ph": "/ɑːt/", "img": "🎨"}, {"en": "PE", "cn": "体育", "ph": "/ˌpiː ˈiː/", "img": "⚽"}]}]};
})(window);
