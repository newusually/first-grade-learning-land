/*
 * speech.js — 服务层 / 语音与音效
 * 负责：中文/英文/拼音三类朗读、WebAudio 音效、移动端音频解锁、"读整篇文档"顺序播报。
 * 兼容要点：
 *   1) 老内核/无语音环境：静默降级，不报错；
 *   2) 手机端语音列表异步返回：先入待读队列，拿到中文语音或用户首次手势后自动补读；
 *   3) 拼音绝不用英文读法：统一走 speakPinyin（呼读音），英文走 speakEn，两者不混。
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  var voice = null, enVoice = null;
  var pendZh = [], pendEn = [], flushing = false;
  var PYD = App.PY_SYL || { SYL: {}, NEU: {} };
  var PYSYL = PYD.SYL || {}, PYNEU = PYD.NEU || {};

  function zhList() {
    try {
      return (w.speechSynthesis.getVoices() || []).filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf("zh") === 0; });
    } catch (e) { return []; }
  }
  function enList() {
    try {
      return (w.speechSynthesis.getVoices() || []).filter(function (v) { return v.lang && /^en/i.test(v.lang); });
    } catch (e) { return []; }
  }
  // 中文嗓音偏好：微软小晓/云希等童声/青年声优先（适合小朋友）
  var ZH_FAVOR = /Xiaoxiao|Yunxi|Xiaoyi|Yunjian|Yaoyao|Tingting|Huihui|Xiaomeng|Female|Sinji|Meijia/i;
  function pickVoice() {
    if (!("speechSynthesis" in w)) return;
    var want = (App.Store && App.Store.state && App.Store.state.voiceZh) || "";
    try {
      var zs = zhList();
      var fav = zs.filter(function (v) { return ZH_FAVOR.test(v.name); })[0] || null;
      if (want) { voice = zs.filter(function (v) { return v.name === want; })[0] || fav || zs[0] || null; }
      else { voice = fav || zs[0] || null; }
      var es = enList();
      var wantEn = (App.Store && App.Store.state && App.Store.state.voiceEn) || "";
      enVoice = wantEn ? (es.filter(function (v) { return v.name === wantEn; })[0] || es[0] || null) : (es[0] || null);
    } catch (e) { voice = null; enVoice = null; }
    if (voice && pendZh.length) flush("zh");
    if (enVoice && pendEn.length) flush("en");
  }
  try { pickVoice(); if (w.speechSynthesis) w.speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}

  /* ---------- 声音选择（像导航一样挑人声） ---------- */
  var VNAME = [
    [/Xiaoxiao/i, "晓晓 · 女声"], [/Xiaoyi/i, "晓伊 · 女声"], [/Xiaomeng/i, "晓梦 · 女声"], [/Xiaohan/i, "晓涵 · 女声"],
    [/Xiaomo/i, "晓墨 · 女声"], [/Xiaoxuan/i, "晓萱 · 女声"], [/Xiaoyue/i, "晓月 · 女声"], [/Xiaobei/i, "小贝 · 女声"],
    [/Yunxi/i, "云希 · 男声"], [/Yunjian/i, "云健 · 男声"], [/Yunxia/i, "云夏 · 男声"], [/Yunyang/i, "云扬 · 男声"],
    [/Yunze/i, "云泽 · 男声"], [/Huihui/i, "慧慧 · 女声"], [/Yaoyao/i, "瑶瑶 · 女声"], [/Tingting/i, "婷婷 · 女声"],
    [/Sinji/i, "新姬 · 女声"], [/Meijia/i, "美佳 · 女声"], [/Lili/i, "莉莉 · 女声"],
    [/Google.*(中国|Chinese|Mandarin|普通话)/i, "谷歌普通话 · 女声"], [/普通话/i, "普通话 · 女声"],
    [/female/i, "女声"], [/male/i, "男声"]
  ];
  function voiceLabel(v) {
    var i, t, online = /online|natural/i.test(v.name || "");
    for (i = 0; i < VNAME.length; i++) { if (VNAME[i][0].test(v.name || "")) return VNAME[i][1] + (online ? " · 在线" : ""); }
    t = (v.lang || "").toLowerCase().indexOf("zh") === 0 ? "中文语音" : "英文语音";
    return (v.name || "未知语音") + " · " + t + (online ? " · 在线" : "");
  }
  function listVoices() {
    var out = [], i, v;
    var zs = zhList(), es = enList();
    for (i = 0; i < zs.length; i++) { v = zs[i]; out.push({ name: v.name, lang: v.lang, kind: "zh", online: /online|natural/i.test(v.name || ""), label: voiceLabel(v) }); }
    for (i = 0; i < es.length; i++) { v = es[i]; out.push({ name: v.name, lang: v.lang, kind: "en", online: /online|natural/i.test(v.name || ""), label: voiceLabel(v) }); }
    return out;
  }
  function setVoice(name, kind) {
    if (!App.Store || !App.Store.state) return;
    if (kind === "en") App.Store.state.voiceEn = name || ""; else App.Store.state.voiceZh = name || "";
    App.Store.save();
    pickVoice();
  }
  function demoVoice(name, kind) {
    if (!("speechSynthesis" in w)) return;
    try {
      var vs = (kind === "en" ? enList() : zhList()).filter(function (v) { return v.name === name; })[0];
      w.speechSynthesis.cancel();
      var u = new w.SpeechSynthesisUtterance(kind === "en" ? "Hello! I am your English voice." : "你好，我是你的朗读小老师，我们一起来学拼音吧！");
      u.lang = kind === "en" ? "en-US" : "zh-CN";
      if (vs) u.voice = vs;
      var stD = currentStyle();
      u.rate = 0.9;
      u.pitch = stD ? stD.pitch : (kind === "en" ? 1.0 : 1.15);
      w.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* =====================================================
   * 云端嗓音（联网）：谷歌翻译 TTS + 有道词典音，声音更多
   * 用 <audio> 播放，不受同源策略限制；失败自动回退本机嗓音
   * ===================================================== */
  var CLOUD = [
    { id: "g-zh",   name: "谷歌普通话 · 女声",   lang: "zh-CN", tl: "zh-CN", spd: 1,   src: "g",  tag: "云端" },
    { id: "g-zh-s", name: "谷歌慢速 · 教学音",   lang: "zh-CN", tl: "zh-CN", spd: 0.4, src: "g",  tag: "云端" },
    { id: "g-tw",   name: "谷歌台湾国语 · 女声", lang: "zh-TW", tl: "zh-TW", spd: 1,   src: "g",  tag: "云端" },
    { id: "g-hk",   name: "谷歌粤语 · 女声",     lang: "zh-HK", tl: "zh-HK", spd: 1,   src: "g",  tag: "云端" },
    { id: "yd-zh",  name: "有道词典 · 普通话",   lang: "zh-CN", tl: "zh-CN", spd: 1,   src: "yd", tag: "云端" },
    { id: "g-en",   name: "谷歌英语 · 女声",     lang: "en-US", tl: "en",    spd: 1,   src: "g",  tag: "云端" },
    { id: "g-en-s", name: "谷歌英语 · 慢速",     lang: "en-US", tl: "en",    spd: 0.5, src: "g",  tag: "云端" },
    { id: "yd-en",  name: "有道词典 · 英语",     lang: "en-US", tl: "en",    spd: 1,   src: "yd", tag: "云端" }
  ];
  function cloudVoices() { return CLOUD.slice(); }
  function cloudGet(id) {
    for (var i = 0; i < CLOUD.length; i++) { if (CLOUD[i].id === id) return CLOUD[i]; }
    return null;
  }
  // 当前选中的云端嗓音（Store.voiceCloud 为空 = 用本机）
  function currentCloud() {
    var id = (App.Store && App.Store.state && App.Store.state.voiceCloud) || "";
    return id ? cloudGet(id) : null;
  }
  function setCloudVoice(id) {
    if (!App.Store || !App.Store.state) return;
    App.Store.state.voiceCloud = id || "";
    App.Store.save();
    stopCloud();
  }
  // 切句：接口单条上限约 200 字符，按标点切成短句顺序播放
  function cloudSplit(text, max) {
    max = max || 170;
    var s = String(text || "").replace(/<[^>]+>/g, "").trim();
    if (!s) return [];
    var BREAK = { "。": 1, "！": 1, "？": 1, "；": 1, "!": 1, "?": 1, ";": 1, "\n": 1 };
    var out = [], buf = "", i, ch;
    for (i = 0; i < s.length; i++) {
      ch = s.charAt(i);
      buf += ch;
      if (BREAK[ch] && buf.length >= 12) { out.push(buf); buf = ""; }
      else if (buf.length >= max) { out.push(buf); buf = ""; }
    }
    if (buf) out.push(buf);
    return out;
  }
  function cloudUrl(v, text) {
    var t = String(text || "").slice(0, 180);
    if (v.src === "g") {
      return "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&ttsspeed=" + v.spd + "&tl=" + v.tl + "&q=" + encodeURIComponent(t);
    }
    return "https://dict.youdao.com/dictvoice?le=" + (v.tl === "en" ? "en" : "zh") + "&audio=" + encodeURIComponent(t);
  }
  var cloudQ = [], cloudBusy = false, cloudCur = null, cloudCb = null;
  function stopCloud() {
    cloudQ = [];
    if (cloudCur) { try { cloudCur.pause(); } catch (e) {} cloudCur = null; }
    cloudBusy = false;
  }
  function cloudNext() {
    if (!cloudQ.length) { cloudBusy = false; cloudCur = null; if (cloudCb) { var c = cloudCb; cloudCb = null; c(); } return; }
    cloudBusy = true;
    var job = cloudQ.shift();
    var a = null;
    try { a = new Audio(); } catch (e) { a = null; }
    if (!a) { stopCloud(); if (job.fallback) job.fallback(); return; }
    cloudCur = a;
    var done = false;
    function fin(fallback) {
      if (done) return;
      done = true;
      if (fallback && job.fallback) { job.fallback(); }
      if (a === cloudCur) cloudCur = null;
      cloudNext();
    }
    a.onended = function () { fin(false); };
    a.onerror = function () { fin(true); };
    try { a.src = cloudUrl(job.v, job.t); var p = a.play(); if (p && p.catch) p.catch(function () { fin(true); }); } catch (e) { fin(true); }
    // 兜底：5 秒还没结束就跳过（网络卡住）
    setTimeout(function () { if (!done) fin(true); }, 5000);
  }
  // 云端播放（队列）：fallback 在失败时调用（通常回退本机嗓音）
  function playCloud(text, v, opt, fallback) {
    opt = opt || {};
    if (!v || !text) { if (fallback) fallback(); return; }
    stopCloud();
    var segs = cloudSplit(text);
    if (!segs.length) { if (fallback) fallback(); return; }
    for (var i = 0; i < segs.length; i++) cloudQ.push({ v: v, t: segs[i], fallback: i === 0 ? fallback : null });
    cloudNext();
  }
  function demoCloud(id) {
    var v = cloudGet(id);
    if (!v) return;
    playCloud(v.tl === "en" ? "Hello! I am your English voice." : "你好，我是你的朗读小老师，我们一起来学拼音吧！", v, {}, function () {
      // 云端失败 → 回退本机
      if (v.tl === "en") speakEnLocal("Hello! I am your English voice.", { rate: 0.9 });
      else speakLocal("你好，我是你的朗读小老师，我们一起来学拼音吧！", { rate: 0.9 });
    });
  }

  /* ---------- 本机嗓音变声风格（离线：同一嗓音衍生多种音色） ---------- */
  var STYLES = [
    { id: "st-baby",  name: "🍼 萌娃音 · 又萌又甜", kind: "zh", rate: 0.92, pitch: 1.9 },
    { id: "st-clear", name: "🌟 清脆童声 · 读题",   kind: "zh", rate: 1.0,  pitch: 1.45 },
    { id: "st-soft",  name: "🌙 温柔女声 · 讲故事", kind: "zh", rate: 0.95, pitch: 1.25 },
    { id: "st-calm",  name: "🎩 沉稳男声 · 慢讲课", kind: "zh", rate: 0.92, pitch: 0.75 },
    { id: "st-slow",  name: "🐢 慢速教学 · 听得清", kind: "zh", rate: 0.68, pitch: 1.1 },
    { id: "st-en-b",  name: "🇬🇧 英语清晰 · 朗读", kind: "en", rate: 0.9,  pitch: 1.05 },
    { id: "st-en-s",  name: "🐢 英语慢速 · 教学",   kind: "en", rate: 0.6,  pitch: 1.0 }
  ];
  function styleVoices() { return STYLES.slice(); }
  function styleGet(id) {
    for (var i = 0; i < STYLES.length; i++) { if (STYLES[i].id === id) return STYLES[i]; }
    return null;
  }
  function currentStyle() {
    var id = (App.Store && App.Store.state && App.Store.state.voiceStyle) || "";
    return id ? styleGet(id) : null;
  }
  function setStyleVoice(id) {
    if (!App.Store || !App.Store.state) return;
    App.Store.state.voiceStyle = id || "";
    App.Store.save();
  }
  // 风格试听：本机嗓音 + 变声参数
  function demoStyle(id) {
    var st = styleGet(id);
    if (!st) return;
    if (st.kind === "en") speakEnLocal("Hello! I am your English voice.", { rate: st.rate, pitch: st.pitch });
    else speakLocal("你好，我是你的朗读小老师，我们一起来学拼音吧！", { rate: st.rate, pitch: st.pitch });
  }

  function speakEn(text, opt) {
    opt = opt || {};
    if (!("speechSynthesis" in w) || !text) return;
    var cv = currentCloud();
    if (cv && cv.tl === "en") {
      try { w.speechSynthesis.cancel(); } catch (e0) {}
      playCloud(text, cv, opt, function () { speakEnLocal(text, opt); });
      return;
    }
    speakEnLocal(text, opt);
  }
  function speakEnLocal(text, opt) {
    opt = opt || {};
    if (!("speechSynthesis" in w) || !text) return;
    if (!enVoice) pickVoice();
    if (!enVoice) { pendEn.push({ t: text, o: opt }); return; }
    try {
      w.speechSynthesis.cancel();
      var u = new w.SpeechSynthesisUtterance(String(text));
      u.lang = "en-US";
      if (enVoice) u.voice = enVoice;
      var stE = currentStyle();
      u.rate = (typeof opt.rate === "number") ? opt.rate : (stE ? stE.rate : 0.85);
      u.pitch = (typeof opt.pitch === "number") ? opt.pitch : (stE && stE.kind === "en" ? stE.pitch : 1.0);
      w.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------- 拼音朗读：按中文自然语言读，绝不被读成英文字母 ---------- */
  var PY_INIT = { b: "波", p: "坡", m: "摸", f: "佛", d: "得", t: "特", n: "呢", l: "勒", g: "哥", k: "科", h: "喝", j: "鸡", q: "七", x: "西", zh: "知", ch: "吃", sh: "诗", z: "资", c: "刺", s: "思", r: "日", y: "衣", w: "乌" };
  var PY_WHOLE = { zhi: "知", chi: "吃", shi: "诗", ri: "日", zi: "资", ci: "刺", si: "思", yi: "衣", wu: "乌", yu: "迂", ye: "耶", yue: "月", yuan: "元", yin: "音", yun: "云", ying: "英", zhei: "这", shei: "谁" };
  var PY_FIN = {
    a: "啊", o: "喔", e: "鹅", i: "衣", u: "乌", "ü": "迂", ai: "爱", ei: "欸", ui: "威", ao: "熬", ou: "欧", iu: "优",
    ie: "耶", "üe": "约", ue: "约", er: "儿", an: "安", en: "恩", in: "音", un: "温", "ün": "晕", ang: "昂", eng: "鞥", ing: "英", ong: "翁",
    ia: "呀", iao: "腰", ian: "烟", iang: "央", iong: "拥", ua: "蛙", uo: "窝", uai: "外", uan: "弯", uang: "汪", ueng: "翁"
  };
  var PY_EXTRA = { ng: "嗯", hm: "噷", hng: "嗯", "ê": "欸", yo: "哟", o: "喔" };
  // 声母表（长的放前面，保证 zh/ch/sh 优先匹配）
  var PY_INIT_KEYS = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "z", "c", "s", "r", "y", "w"];
  // 声调符号 → 无声调字母
  var PY_TONE = { "ā": "a", "á": "a", "ǎ": "a", "à": "a", "ē": "e", "é": "e", "ě": "e", "è": "e", "ī": "i", "í": "i", "ǐ": "i", "ì": "i", "ō": "o", "ó": "o", "ǒ": "o", "ò": "o", "ū": "u", "ú": "u", "ǔ": "u", "ù": "u", "ǖ": "ü", "ǘ": "ü", "ǚ": "ü", "ǜ": "ü", "ń": "n", "ň": "n", "ḿ": "m" };
  var TONE_ORDER = "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńň";
  // 取声调：带调符号或数字（ma3）→ 1~4；无声调 → 0
  function pyTone(tok) {
    var i, ch, s = String(tok);
    for (i = 0; i < s.length; i++) {
      ch = s.charAt(i);
      if (PY_TONE[ch]) { return TONE_ORDER.indexOf(ch) % 4 + 1; }
    }
    var m = s.match(/([1-4])\s*$/);
    return m ? parseInt(m[1], 10) : 0;
  }
  function pyNorm(t) {
    var s = String(t).toLowerCase().replace(/[0-9]/g, "").replace(/u:/g, "ü"), out = "", i, ch;
    for (i = 0; i < s.length; i++) {
      ch = s.charAt(i);
      if (PY_TONE[ch]) { out += PY_TONE[ch]; continue; }
      if (ch === "v") { out += "ü"; continue; }
      out += ch;
    }
    return out;
  }
  // 完整音节 → 同音汉字（带调用对应声调的字；无声调用轻声代表字，没有则用一声字）
  function sylChar(low, tone) {
    var four = PYSYL[low];
    if (!four) return null;
    if (tone >= 1 && tone <= 4) return four.charAt(tone - 1);
    return PYNEU[low] || four.charAt(0);
  }
  // 把一个无声调音节拆成「声母呼读音 + 韵母汉字」（保底：表里没有的生僻音节）
  function pySyllable(low) {
    var i, init = "", fin, a, b;
    for (i = 0; i < PY_INIT_KEYS.length; i++) {
      var k = PY_INIT_KEYS[i];
      if (low.indexOf(k) === 0 && low.length > k.length) { init = k; break; }
    }
    fin = init ? low.slice(init.length) : low;
    if (fin === "ê") fin = "e";
    a = PY_INIT[init] || "";
    b = PY_FIN[fin];
    if (!b) return null;
    return a ? (a + " " + b) : b;
  }
  function speakPinyin(py, opt) {
    py = String(py || "").trim();
    if (!py) return;
    var tokens = py.split(/[\s,，、]+/), out = [], i, t, low, c, tone, piece;
    for (i = 0; i < tokens.length; i++) {
      t = tokens[i]; if (!t) continue;
      tone = pyTone(t);
      low = pyNorm(t);
      if (!low) continue;
      if (PY_EXTRA[low]) { out.push(PY_EXTRA[low]); continue; }
      if (tone) {                                   // 带声调：一定是完整音节 → 读同音汉字
        piece = sylChar(low, tone);
        if (piece) { out.push(piece); continue; }
      }
      if (PY_INIT[low]) { out.push(PY_INIT[low]); continue; }   // 声母：呼读音 b→波
      if (PY_WHOLE[low]) { out.push(PY_WHOLE[low]); continue; } // 整体认读：yi→衣
      if (PY_FIN[low]) { out.push(PY_FIN[low]); continue; }     // 韵母：ang→昂
      if (!tone) {                                  // 无声调完整音节：ma→妈、ba→爸
        piece = sylChar(low, 0);
        if (piece) { out.push(piece); continue; }
      }
      if (/^[bpmfdtnlgkhjqxzcsryw]+$/.test(low) && low.length > 1) { // 无声母字母串，如 bpm
        var cs = low.split("");
        for (c = 0; c < cs.length; c++) { if (PY_INIT[cs[c]]) out.push(PY_INIT[cs[c]]); }
        continue;
      }
      piece = pySyllable(low);                      // 保底拆分
      if (piece) { out.push(piece); continue; }
      if (/^[\u4e00-\u9fa5]/.test(t)) { out.push(t); continue; }  // 汉字原样
      if (/^[bpmfdtnlgkhjqxzcsryw]+$/.test(low)) {                // 认不出的一串字母：按声母逐个读，绝不读英文
        var cs2 = low.split("");
        for (c = 0; c < cs2.length; c++) { if (PY_INIT[cs2[c]]) out.push(PY_INIT[cs2[c]]); }
        continue;
      }
      out.push(t);
    }
    speak(out.join(" "), opt); // 语速交给"声音风格"接管（默认偏慢，适合教学）
  }

  function speak(text, opt) {
    opt = opt || {};
    if (!("speechSynthesis" in w) || !text) return;
    var cv = currentCloud();
    if (cv && cv.tl !== "en") {
      try { w.speechSynthesis.cancel(); } catch (e0) {}
      playCloud(text, cv, opt, function () { speakLocal(text, opt); });
      return;
    }
    speakLocal(text, opt);
  }
  function speakLocal(text, opt) {
    opt = opt || {};
    if (!("speechSynthesis" in w) || !text) return;
    if (!voice) pickVoice();
    if (!voice) { pendZh.push({ t: text, o: opt }); return; }
    try {
      w.speechSynthesis.cancel();
      var u = new w.SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g, ""));
      u.lang = "zh-CN";
      if (voice) u.voice = voice;
      var st1 = currentStyle();
      u.rate = (typeof opt.rate === "number") ? opt.rate : (st1 ? st1.rate : 0.95);
      u.pitch = (typeof opt.pitch === "number") ? opt.pitch : (st1 ? st1.pitch : 1.15);
      w.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------- 待读队列补读（手机端语音延迟/需手势解锁） ---------- */
  function flush(kind) {
    if (flushing) return;
    var q = kind === "en" ? pendEn : pendZh;
    if (!q.length) return;
    flushing = true;
    var one = q.shift();
    if (kind === "en") speakEn(one.t, one.o); else speak(one.t, one.o);
    setTimeout(function () { flushing = false; flush(kind); }, 60);
  }
  function flushAll() { pickVoice(); flush("zh"); flush("en"); }

  /* ---------- 顺序播报：用于"把整篇内容读完" ---------- */
  var seqRunning = false;
  function seq(list) {
    if (!list || !list.length) return;
    if (seqRunning) { try { w.speechSynthesis.cancel(); } catch (e) {} stopCloud(); }
    seqRunning = true;
    var i = 0;
    (function step() {
      if (i >= list.length) { seqRunning = false; return; }
      var item = list[i++];
      if (typeof item === "function") { item(step); return; }
      var txt = (item && typeof item === "object") ? item.t : item;
      var isEn = (item && typeof item === "object") ? !!item.en : false;
      var done = false;
      var onend = function () { if (done) return; done = true; setTimeout(step, 120); };
      // 云端嗓音：中文段整段交给云端队列（自动切句）
      var cv1 = isEn ? null : currentCloud();
      if (cv1 && cv1.tl !== "en") {
        try { w.speechSynthesis.cancel(); } catch (e2) {}
        playCloud(txt, cv1, {}, function () {
          // 云端失败 → 本机读这一段再继续
          try {
            w.speechSynthesis.cancel();
            var u2 = new w.SpeechSynthesisUtterance(String(txt).replace(/<[^>]+>/g, ""));
            u2.lang = "zh-CN"; if (voice) u2.voice = voice; u2.rate = 0.95;
            u2.onend = onend; u2.onerror = onend;
            w.speechSynthesis.speak(u2);
            setTimeout(onend, Math.max(2600, String(txt).length * 340));
          } catch (e3) { onend(); }
        });
        return;
      }
      try {
        if ("speechSynthesis" in w) {
          w.speechSynthesis.cancel();
          var u = new w.SpeechSynthesisUtterance(String(txt).replace(/<[^>]+>/g, ""));
          if (isEn) { u.lang = "en-US"; if (enVoice) u.voice = enVoice; u.rate = 0.85; }
          else { u.lang = "zh-CN"; if (voice) u.voice = voice; u.rate = 0.95; }
          u.onend = onend; u.onerror = onend;
          w.speechSynthesis.speak(u);
          setTimeout(onend, Math.max(2600, String(txt).length * 340)); // 兜底：老内核不触发 onend
          return;
        }
      } catch (e) {}
      onend();
    })();
  }

  /* ---------- 自动读题（受全站"自动朗读"开关控制） ---------- */
  function autoRead(text, opt) {
    if (!App.Store || !App.Store.state || !App.Store.state.autoRead) return;
    if (!text) return;
    setTimeout(function () { speak(text, opt); }, 250);
  }

  /* ---------- WebAudio 音效（无需外部文件） ---------- */
  var AC = null;
  function ac() {
    if (!AC) { try { AC = new (w.AudioContext || w.webkitAudioContext)(); } catch (e) { AC = null; } }
    return AC;
  }
  // 移动端（微信/QQ/钉钉）需用户手势后才能出声：首次触摸/点击/按键解锁并补读待读队列
  (function unlock() {
    function fn() { flushAll(); var c = ac(); if (c && c.state === "suspended") { try { c.resume(); } catch (e) {} } }
    w.document.addEventListener("touchstart", fn, { passive: true });
    w.document.addEventListener("pointerdown", fn);
    w.document.addEventListener("click", fn);
    w.document.addEventListener("keydown", fn);
    setTimeout(flushAll, 800);
    setTimeout(flushAll, 2500);
  })();

  function tone(freq, dur, type, vol) {
    var c = ac(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || "triangle"; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
    } catch (e) {}
  }
  var sfx = {
    pop: function () { tone(560 + Math.random() * 320, 0.12, "triangle", 0.10); },
    off: function () { tone(300, 0.16, "sawtooth", 0.07); },
    right: function () { tone(523, 0.18, "sine", 0.14); setTimeout(function () { tone(659, 0.18, "sine", 0.14); }, 140); setTimeout(function () { tone(784, 0.3, "sine", 0.15); }, 280); },
    wrong: function () { tone(220, 0.25, "square", 0.08); }
  };

  App.Speech = {
    speak: speak,
    speakLocal: speakLocal,
    speakEn: speakEn,
    speakEnLocal: speakEnLocal,
    speakPinyin: speakPinyin,
    seq: seq,
    autoRead: autoRead,
    flushAll: flushAll,
    pickVoice: pickVoice,
    listVoices: listVoices,
    setVoice: setVoice,
    demoVoice: demoVoice,
    cloudVoices: cloudVoices,
    currentCloud: currentCloud,
    setCloudVoice: setCloudVoice,
    demoCloud: demoCloud,
    playCloud: playCloud,
    stopCloud: stopCloud,
    styleVoices: styleVoices,
    currentStyle: currentStyle,
    setStyleVoice: setStyleVoice,
    demoStyle: demoStyle,
    sfx: sfx
  };
})(window);
