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
  // 默认嗓音：优先 Microsoft HsiaoChen Online (Natural) - Chinese (Taiwan)，没有就依次回退
  var ZH_DEFAULT = [
    "Microsoft HsiaoChen Online (Natural) - Chinese (Taiwan)",
    "Microsoft HsiaoChen Online (Natural) - Chinese (Hong Kong)",
    "Microsoft HsiaoChen Online (Natural) - Chinese (Taiwan Mandarin)",
    "Microsoft Yunxi Online (Natural) - Chinese (Mainland)",
    "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)"
  ];
  var ZH_DEFAULT_RE = [
    /HsiaoChen.*Chinese \(Taiwan\)/i, /HsiaoChen.*Taiwan/i, /HsiaoChen/i,
    /Yunxi.*Chinese \(Mainland\)/i, /Xiaoxiao.*Chinese \(Mainland\)/i
  ];
  // 中文嗓音偏好：微软小晓/云希等童声/青年声优先（适合小朋友）
  var ZH_FAVOR = /Xiaoxiao|Yunxi|Xiaoyi|Yunjian|Yaoyao|Tingting|Huihui|Xiaomeng|Female|Sinji|Meijia/i;
  function byName(list, name) {
    for (var i = 0; i < list.length; i++) { if (list[i].name === name) return list[i]; }
    return null;
  }
  // 这台设备上有没有某个中文嗓音（用于判断"默认嗓音装没装"）
  function hasZhVoice(name) {
    if (!name || !("speechSynthesis" in w)) return false;
    try { return !!byName(zhList(), name); } catch (e) { return false; }
  }
  // 默认嗓音（HsiaoChen 台湾）在这台设备是否缺失
  function defaultZhMissing() { return !hasZhVoice(ZH_DEFAULT[0]); }
  // 按默认清单挑一个（用户没手动选过声音时才用）
  // 重要：优先挑「离线嗓音」（localService=true）。标着 Online 的嗓音合成在微软云端做，
  // 一旦网络不通就整段静音，所以离线能响的排在最前面。
  function pickFrom(L, names, res, favor) {
    var i, j, v;
    for (i = 0; i < names.length; i++) { v = byName(L, names[i]); if (v) return v; }
    for (j = 0; j < res.length; j++) {
      for (i = 0; i < L.length; i++) { if (res[j].test(L[i].name || "")) return L[i]; }
    }
    var f = L.filter(function (x) { return favor.test(x.name || ""); })[0];
    return f || null;
  }
  function defaultZh(zs) {
    var loc = zs.filter(function (x) { return x.localService === true; });
    var v = loc.length ? pickFrom(loc, ZH_DEFAULT, ZH_DEFAULT_RE, ZH_FAVOR) : null;
    if (v) return v;
    v = pickFrom(zs, ZH_DEFAULT, ZH_DEFAULT_RE, ZH_FAVOR);
    return v || zs[0] || null;
  }
  function pickVoice() {
    if (!("speechSynthesis" in w)) return;
    var want = (App.Store && App.Store.state && App.Store.state.voiceZh) || "";
    try {
      var zs = zhList();
      var fav = zs.filter(function (v) { return ZH_FAVOR.test(v.name); })[0] || null;
      var hit = want ? byName(zs, want) : null;
      if (want && hit) { voice = hit; }
      else if (want) {
        // 保存的嗓音这台设备没有（或就是默认嗓音没装）：回退，并把真实嗓音写回 Store
        voice = defaultZh(zs) || fav || zs[0] || null;
        if (voice && want === ZH_DEFAULT[0] && App.Store && App.Store.state) {
          try { App.Store.state.voiceZh = voice.name; App.Store.save(); } catch (e1) {}
        }
      } else {
        // 没手动选过：用默认嗓音（HsiaoChen 优先），并写回 Store 让面板显示它
        voice = defaultZh(zs) || fav || zs[0] || null;
        if (voice && App.Store && App.Store.state) {
          try { App.Store.state.voiceZh = voice.name; App.Store.save(); } catch (e1) {}
        }
      }
      var es = enList();
      var wantEn = (App.Store && App.Store.state && App.Store.state.voiceEn) || "";
      enVoice = wantEn ? (es.filter(function (v) { return v.name === wantEn; })[0] || es[0] || null) : (es[0] || null);
    } catch (e) { voice = null; enVoice = null; }
    pump();
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
  // 试听：opt.styleId 显式指定变声风格（面板里还没保存的暂存风格靠它预览）
  function demoVoice(name, kind, opt) {
    opt = opt || {};
    var stD = (typeof opt.styleId !== "undefined") ? styleGet(opt.styleId) : currentStyle();
    // 走队列（不 cancel），本机不可用时引擎自动改联网发音，试听永远有声
    push({
      t: kind === "en" ? "Hello! I am your English voice." : "你好，我是你的朗读小老师，我们一起来学拼音吧！",
      en: kind === "en", vname: name,
      opt: { rate: 0.9, pitch: stD ? stD.pitch : (kind === "en" ? 1.0 : 1.15) }
    });
  }

  /* =====================================================
   * 云端嗓音（联网）：谷歌翻译 TTS + 有道词典音，声音更多
   * 用 <audio> 播放，不受同源策略限制；失败自动回退本机嗓音
   * ===================================================== */
  var CLOUD = [
    { id: "g-zh",   name: "谷歌普通话 · 女声（国内常不通）",   lang: "zh-CN", tl: "zh-CN", spd: 1,   src: "g",  tag: "云端" },
    { id: "g-zh-s", name: "谷歌慢速 · 教学音（国内常不通）",   lang: "zh-CN", tl: "zh-CN", spd: 0.4, src: "g",  tag: "云端" },
    { id: "g-tw",   name: "谷歌台湾国语 · 女声（国内常不通）", lang: "zh-TW", tl: "zh-TW", spd: 1,   src: "g",  tag: "云端" },
    { id: "g-hk",   name: "谷歌粤语 · 女声（国内常不通）",     lang: "zh-HK", tl: "zh-HK", spd: 1,   src: "g",  tag: "云端" },
    { id: "yd-zh",  name: "有道词典 · 普通话（推荐）",   lang: "zh-CN", tl: "zh-CN", spd: 1,   src: "yd", tag: "云端" },
    { id: "g-en",   name: "谷歌英语 · 女声（国内常不通）",     lang: "en-US", tl: "en",    spd: 1,   src: "g",  tag: "云端" },
    { id: "g-en-s", name: "谷歌英语 · 慢速（国内常不通）",     lang: "en-US", tl: "en",    spd: 0.5, src: "g",  tag: "云端" },
    { id: "yd-en",  name: "有道词典 · 英语（推荐）",     lang: "en-US", tl: "en",    spd: 1,   src: "yd", tag: "云端" }
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
    var t0 = nowMs();
    a.onended = function () { calibrate(job.t, nowMs() - t0, 1, isEnText(job.t)); fin(false); };
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
    push({
      t: v.tl === "en" ? "Hello! I am your English voice." : "你好，我是你的朗读小老师，我们一起来学拼音吧！",
      en: v.tl === "en", cloudId: id, opt: { rate: 0.9 }
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
    push({
      t: st.kind === "en" ? "Hello! I am your English voice." : "你好，我是你的朗读小老师，我们一起来学拼音吧！",
      en: st.kind === "en", opt: { rate: st.rate, pitch: st.pitch }
    });
  }

  // 统一进串行队列（真正的播放在引擎里做，见文末「播放引擎 v2」）
  function speakEn(text, opt) { push({ t: text, en: true, opt: opt }); }
  function speakEnLocal(text, opt) { push({ t: text, en: true, opt: opt, local: true }); }

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

  /* ---------- 朗读时长估算（给动画配节奏用） ----------
   * 初始值：中文约 5 字/秒、英文约 13 词/秒（rate=1 时）；每次真读完用实测值校准，
   * 这样在线嗓音慢、本机嗓音快都能自动对上，不用写死。 */
  var CPS = { zh: 5.0, en: 13.0 };
  function nowMs() { return (w.performance && w.performance.now) ? w.performance.now() : (new Date()).getTime(); }
  function plainText(t) { return String(t == null ? "" : t).replace(/<[^>]+>/g, ""); }
  function isEnText(s) { return !/[\u4e00-\u9fa5]/.test(s); }
  function currentRate(opt) {
    var st1 = currentStyle();
    if (opt && typeof opt.rate === "number" && opt.rate > 0) return opt.rate;
    return st1 ? st1.rate : 0.95;
  }
  // 用实测时长反推字速（归一化到 rate=1），滚动平均
  function calibrate(text, durMs, rate, en) {
    var s = plainText(text).replace(/\s/g, "");
    var len = en ? (plainText(text).split(/\s+/).length || 1) : s.length;
    if (!len || durMs < 350) return;
    var eff = Math.max(140, durMs - 260);          // 扣掉起播延迟
    var cps = (len / (eff / 1000)) * (rate || 1);
    if (cps < 2) cps = 2;
    if (cps > 14) cps = 14;
    var k = en ? "en" : "zh";
    CPS[k] = Math.round((CPS[k] * 0.65 + cps * 0.35) * 100) / 100;
  }
  // 估算这段话读完要多少毫秒（动画据此决定下一步等多久）
  function estimate(text, opt) {
    opt = opt || {};
    var s = plainText(text).trim();
    if (!s) return 0;
    var en = isEnText(s);
    var rate = currentRate(opt);
    var len = en ? (s.split(/\s+/).length || 1) : s.replace(/\s/g, "").length;
    var pauses = (s.match(/[，。！？；、：,.!?;:]/g) || []).length;
    var ms = (len / (CPS[en ? "en" : "zh"] * rate)) * 1000 + pauses * 140 + 260;
    var cv = currentCloud();
    if (cv && cv.tl !== "en") ms += 600;            // 云端要下载音频，多留一点
    return Math.round(ms);
  }

  /* =====================================================
   * 播放引擎 v2：串行队列 / 不乱 cancel / 叫不醒就自动联网发音
   * -----------------------------------------------------
   * 「点了没声音」的根因：Chromium 内核（Edge、搜狗、360、QQ 浏览器）
   * 在 cancel() 之后立刻 speak() 会把整段话吞掉，旧代码每一句都
   * 先 cancel 再 speak，于是全站静音。新引擎三条铁律：
   *   ① 全程串行排队，只有 stop() 才 cancel，cancel 后留 200ms 静默期；
   *   ② 每句话带看门狗：750ms 还没 onstart 视为被吞 → 重试一次，
   *      再失败就判定本机语音不可用，自动改走联网发音（<audio> 播放）；
   *   ③ 浏览器根本没语音引擎 / 没装这门语言的语音包 → 直接走联网发音。
   * ===================================================== */
  function supported() {
    return !!("speechSynthesis" in w) && typeof w.SpeechSynthesisUtterance === "function";
  }
  var Q = [], busy = false, gate = 0, unlocked = false;
  var localFail = 0, localDead = false, cloudFail = 0, cloudOK = false;
  var CA = null;

  function cloudAudio() { if (!CA) { try { CA = new Audio(); } catch (e) { CA = null; } } return CA; }

  function push(job) {
    if (!job || (job.t == null && !job.fn)) return;
    Q.push(job);
    if (Q.length > 40) Q.splice(0, Q.length - 40);   // 防止狂点堆积
    // 只能走联网发音、而用户还没点过页面 → 浏览器会挡住，给个「点我开启声音」的小提示
    if (!unlocked && !localUsable(job.en)) setTimeout(unlockTip, 400);
    pump();
  }
  // 兜底提示条：只在「本机发不出声、只能联网念」且用户还没点过页面时出现
  // 两条路都试过还是没响 → 明说，别让用户干等
  var silent = 0, failTipShown = false;
  function failTip() {
    if (failTipShown || !w.document || !w.document.body) return;
    failTipShown = true;
    var d = w.document, el;
    try { el = d.createElement("div"); } catch (e) { return; }
    el.setAttribute("style", "position:fixed;left:50%;bottom:18px;-webkit-transform:translateX(-50%);transform:translateX(-50%);z-index:99999;max-width:92%;background:#fff;border:2px solid #90a4ae;border-radius:14px;padding:9px 16px;font-size:13px;line-height:1.5;color:#37474f;box-shadow:0 6px 18px rgba(0,0,0,.18);cursor:pointer");
    el.textContent = "🔇 这台设备现在发不出声音：本机语音没响应，联网发音也没成功。请检查系统音量、网络，或换 Edge / Chrome 打开；点我关掉这条提示。";
    el.onclick = function () { try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e1) {} };
    d.body.appendChild(el);
  }
  var tipShown = false;
  function unlockTip() {
    if (tipShown || unlocked || !w.document || !w.document.body) return;
    tipShown = true;
    var d = w.document, el;
    try { el = d.createElement("div"); } catch (e) { return; }
    el.setAttribute("style", "position:fixed;left:50%;bottom:18px;-webkit-transform:translateX(-50%);transform:translateX(-50%);z-index:99999;background:#fff;border:2px solid #ff7043;border-radius:999px;padding:8px 16px;font-size:14px;color:#d84315;box-shadow:0 6px 18px rgba(0,0,0,.18);cursor:pointer");
    el.textContent = "🔊 点一下这里，开启朗读声音";
    el.onclick = function () {
      unlocked = true;
      try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e1) {}
      pump();
    };
    d.body.appendChild(el);
    setTimeout(function () { try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e2) {} }, 20000);
  }
  function pump() {
    if (busy || !Q.length) return;
    if (nowMs() < gate) { setTimeout(pump, 60); return; }
    // 用户还没点过页面：联网发音会被浏览器挡掉，先攒着，一点页面立刻念
    if (!unlocked && !localUsable(Q[0].en)) return;
    busy = true;
    var job = Q.shift();
    runJob(job, function () {
      busy = false;
      setTimeout(pump, 90);
    });
  }
  function runJob(job, next) {
    var over = false;
    function fin() { if (over) return; over = true; if (job.cb) { try { job.cb(); } catch (e1) {} } next(); }
    if (job.fn) { try { job.fn(fin); } catch (e0) { fin(); } return; }
    var txt = String(job.t == null ? "" : job.t).replace(/<[^>]+>/g, "").trim();
    if (!txt) { fin(); return; }
    var cv = job.local ? null : (job.cloudId ? cloudGet(job.cloudId) : currentCloud());
    if (cv && ((job.en && cv.tl === "en") || (!job.en && cv.tl !== "en"))) { cloudSeq(txt, cv, fin); return; }
    // 本机语音叫不醒/根本没有 → 直接联网发音，不等失败
    if (!job.local && !localUsable(job.en)) { cloudAuto(txt, job, fin); return; }
    localSpeak(txt, job, fin);
  }
  function localUsable(en) {
    if (!supported() || localDead) return false;
    try {
      var l = en ? enList() : zhList();
      return !!(l && l.length);
    } catch (e) { return false; }
  }
  // 兜底的联网嗓音（只在本次使用，不写进 Store）
  function autoCloudOf(en) { return cloudGet(en ? "yd-en" : "yd-zh"); }
  function cloudAuto(txt, job, fin) {
    job.cloudDone = true;                       // 记一下：这条路已经试过，别来回兜圈子
    var v = autoCloudOf(!!job.en);
    if (!v) { localSpeak(txt, job, fin); return; }
    var before = cloudFail;
    cloudSeq(txt, v, function () {
      // 联网也没响（断网/接口被拦）→ 本机再试一次，两条路都试过才放弃
      if (cloudFail > before) {
        silent++;
        if (silent >= 3) failTip();
        if (supported()) { localSpeak(txt, job, fin); return; }
      }
      fin();
    });
  }
  function cloudSeq(text, v, done) {
    var segs = cloudSplit(text), i = 0;
    if (!segs.length) { done(); return; }
    (function nx() {
      if (i >= segs.length) { done(); return; }
      var seg = segs[i++];
      var a = cloudAudio();
      if (!a) { done(); return; }
      var over = false, tries = 0;
      function go() { if (over) return; over = true; setTimeout(nx, 80); }
      var t0 = nowMs();
      a.onended = function () { cloudOK = true; calibrate(seg, nowMs() - t0, 1, isEnText(seg)); go(); };
      a.onerror = function () { cloudFail++; go(); };
      // 联网发音需要用户先点过页面（浏览器自动播放策略）：没点过就隔 0.6 秒重试，直到用户点一下
      function fire() {
        try {
          a.src = cloudUrl(v, seg);
          var p = a.play();
          if (p && p.catch) p.catch(function () {
            cloudFail++;
            if (!unlocked && tries++ < 10) { setTimeout(fire, 600); return; }
            go();
          });
        } catch (e2) { cloudFail++; go(); }
      }
      fire();
      setTimeout(go, 12000);            // 网络卡住兜底
    })();
  }
  function localSpeak(txt, job, fin) {
    if (!supported()) { cloudAuto(txt, job, fin); return; }
    if (!voice && !job.en) pickVoice();
    if (!enVoice && job.en) pickVoice();
    var vs = job.en ? enVoice : voice;
    if (job.vname) { var vv = byName(job.en ? enList() : zhList(), job.vname); if (vv) vs = vv; }
    if (!vs) {                          // 嗓音列表异步返回，等一会儿
      var n = 0;
      (function wait() {
        pickVoice();
        vs = job.en ? enVoice : voice;
        if (job.vname) { var vv2 = byName(job.en ? enList() : zhList(), job.vname); if (vv2) vs = vv2; }
        if (vs) { localSpeak(txt, job, fin); return; }
        if (++n > 40) { cloudAuto(txt, job, fin); return; }
        setTimeout(wait, 100);
      })();
      return;
    }
    var u;
    try { u = new w.SpeechSynthesisUtterance(txt); } catch (e) { cloudAuto(txt, job, fin); return; }
    u.lang = job.en ? "en-US" : "zh-CN";
    u.voice = vs;
    var st1 = currentStyle();
    var rate = (job.opt && typeof job.opt.rate === "number") ? job.opt.rate : (st1 ? st1.rate : (job.en ? 0.85 : 0.95));
    var pitch = (job.opt && typeof job.opt.pitch === "number") ? job.opt.pitch : (st1 ? st1.pitch : (job.en ? 1.0 : 1.15));
    u.rate = rate; u.pitch = pitch;
    var started = false, t0 = nowMs();
    u.onstart = function () { started = true; localFail = 0; };
    u.onend = function () { calibrate(txt, nowMs() - t0, rate, job.en); fin(); };
    u.onerror = function () { fin(); };
    try { w.speechSynthesis.speak(u); } catch (e2) { cloudAuto(txt, job, fin); return; }
    // 看门狗①：被吞（既没 onstart 也没在说）→ 重试一次，再失败转联网发音
    setTimeout(function () {
      if (started) return;
      var sp = false;
      try { sp = w.speechSynthesis.speaking || w.speechSynthesis.pending; } catch (e3) {}
      if (sp) return;
      localFail++;
      job.retry = (job.retry || 0) + 1;
      try { w.speechSynthesis.cancel(); } catch (e4) {}
      gate = nowMs() + 200;
      if (job.cloudDone) { fin(); return; }      // 本机+联网都试过了，放弃，别死循环
      if (job.retry === 1 && !localDead) {
        setTimeout(function () { localSpeak(txt, job, fin); }, 280);
      } else {
        localDead = true;
        cloudAuto(txt, job, fin);
      }
    }, 1500);
    // 看门狗②：最长保护时间（老内核不触发 onend 也不至于卡死队列）
    setTimeout(fin, Math.max(9000, estimate(txt, { rate: rate }) * 2.5 + 5000));
  }

  function speak(text, opt) { push({ t: text, en: false, opt: opt }); }
  function speakLocal(text, opt) { push({ t: text, en: false, opt: opt, local: true }); }

  /* ---------- 补读（手机端语音延迟 / 需要手势解锁） ---------- */
  function flush() { pickVoice(); pump(); }
  function flushAll() { pickVoice(); pump(); }

  /* ---------- 顺序播报：题干 → 选项，一句接一句，绝不互相掐断 ---------- */
  function seq(list) {
    if (!list || !list.length) return;
    stopAll();                                  // 新的一轮开始，旧的让位
    var i, it, t, en;
    for (i = 0; i < list.length; i++) {
      it = list[i];
      if (typeof it === "function") { Q.push({ fn: it }); continue; }
      t = (it && typeof it === "object") ? it.t : it;
      en = (it && typeof it === "object") ? !!it.en : false;
      Q.push({ t: t, en: en, opt: null });
    }
    pump();
  }

  /* ---------- 自动读题（受全站「自动朗读」开关控制） ---------- */
  function autoRead(text, opt) {
    if (!App.Store || !App.Store.state || !App.Store.state.autoRead) return;
    if (!text) return;
    setTimeout(function () { push({ t: text, en: false, opt: opt }); }, 250);
  }

  /* ---------- 声音自检：告诉用户「现在到底能不能出声」 ---------- */
  function diag() {
    var zs = zhList(), es = enList(), sp = supported(), cvv = currentCloud();
    var using = (!sp || localDead || !zs.length) ? "云端" : "本机";
    var note;
    if (!sp) note = "这个浏览器没有内置语音引擎，已自动改用联网发音";
    else if (localDead) note = "本机语音叫不醒（浏览器把声音吞了），已自动改用联网发音";
    else if (!zs.length) note = "这台设备没装中文语音包，已自动改用联网发音";
    else if (cvv) note = "当前用「" + cvv.name + "」联网发音";
    else note = "当前用本机「" + (voice ? voice.name : "默认嗓音") + "」发音";
    return {
      supported: sp,
      voices: sp ? ((w.speechSynthesis.getVoices() || []).length) : 0,
      zh: zs.length, en: es.length,
      zhVoice: voice ? voice.name : "", enVoice: enVoice ? enVoice.name : "",
      localDead: localDead, cloudOk: cloudOK, cloudFail: cloudFail,
      cloud: cvv ? cvv.id : "", using: using, note: note
    };
  }
  // 自检发声：念一句测试话，念完把结果回传给面板
  function selfTest(cb) {
    push({
      t: "声音自检开始，一二三，你听到了吗？", en: false, opt: null,
      cb: function () { if (cb) { try { cb(diag()); } catch (e) {} } }
    });
  }
  // 面板用：强制回到本机语音（并把「本机失效」标记清掉）
  function useLocal() {
    if (App.Store && App.Store.state) { App.Store.state.voiceCloud = ""; App.Store.save(); }
    localFail = 0; localDead = false;
  }
  // 面板用：一键改用联网发音
  function useCloud(id) {
    if (App.Store && App.Store.state) { App.Store.state.voiceCloud = id || "yd-zh"; App.Store.save(); }
  }


  /* ---------- WebAudio 音效（无需外部文件） ---------- */
  var AC = null;
  function ac() {
    if (!AC) { try { AC = new (w.AudioContext || w.webkitAudioContext)(); } catch (e) { AC = null; } }
    return AC;
  }
  // 移动端（微信/QQ/钉钉）需用户手势后才能出声：首次触摸/点击/按键解锁并补读待读队列
  (function unlock() {
    function fn() {
      unlocked = true;                 // 浏览器允许自动播放了，联网发音可以出声
      flushAll();
      var c = ac(); if (c && c.state === "suspended") { try { c.resume(); } catch (e) {} }
    }
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

  // 立刻停掉正在播放的一切（本机朗读 + 云端队列）
  // 真正要打断时才 cancel：cancel 后留 200ms 静默期，避免下一条被吞
  function stopAll() {
    Q = [];
    try { if ("speechSynthesis" in w) w.speechSynthesis.cancel(); } catch (e) {}
    try { if (CA) CA.pause(); } catch (e2) {}
    gate = nowMs() + 200;
    stopCloud();
  }
  function speaking() { return busy || Q.length > 0; }

  App.Speech = {
    stop: stopAll,
    speaking: speaking,
    diag: diag,
    selfTest: selfTest,
    useLocal: useLocal,
    useCloud: useCloud,
    hasZhVoice: hasZhVoice,
    defaultZhMissing: defaultZhMissing,
    defaultZhName: function () { return ZH_DEFAULT[0]; },
    speak: speak,
    estimate: estimate,
    cps: function () { return { zh: CPS.zh, en: CPS.en }; },
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
