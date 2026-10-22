/*
 * shell.js — 基础层 / 全站外壳组件（Vue）
 * 顶栏 + 导航 + 页标题 + 页脚 + 星星/徽章 + 自动朗读总开关。
 * 所有页面层视图都包在 <site-shell> 里，HTML 只留 <div id="app" data-view="xxx">。
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  if (!w.Vue) return;

  function cur() {
    var p = (w.location && w.location.pathname) ? w.location.pathname.split("/").pop() : "";
    return p || "主页.html";
  }

  App.Shell = {
    name: "site-shell",
    props: {
      title: { type: String, default: "" },
      sub: { type: String, default: "" },
      icon: { type: String, default: "📗" }
    },
    data: function () {
      return {
        site: (App.config && App.config.title) || "一年级趣味学习乐园",
        nav: (App.config && App.config.nav) || [],
        cur: cur(),
        st: App.Store.state,
        showBadges: false,
        showVoices: false,
        voices: [],
        clouds: (App.Speech && App.Speech.cloudVoices) ? App.Speech.cloudVoices() : [],
        styles: (App.Speech && App.Speech.styleVoices) ? App.Speech.styleVoices() : [],
        vLoading: true,
        vTry: 0
      };
    },
    computed: {
      myBadges: function () {
        var out = [], i, b;
        for (i = 0; i < App.Store.BADGES.length; i++) {
          b = App.Store.BADGES[i];
          out.push({ id: b.id, i: b.i, n: b.n, d: b.d, got: this.st.badges.indexOf(b.id) >= 0 });
        }
        return out;
      },
      zhVoices: function () { return this.voices.filter(function (v) { return v.kind === "zh"; }); },
      enVoices: function () { return this.voices.filter(function (v) { return v.kind === "en"; }); },
      curZh: function () { return this.st.voiceZh || ""; },
      curEn: function () { return this.st.voiceEn || ""; },
      curCloud: function () { return this.st.voiceCloud || ""; },
      curStyle: function () { return this.st.voiceStyle || ""; },
      zhOnline: function () { return this.voices.filter(function (v) { return v.kind === "zh" && v.online; }); },
      zhLocal: function () { return this.voices.filter(function (v) { return v.kind === "zh" && !v.online; }); }
    },
    methods: {
      toggleRead: function () {
        var on = App.Store.toggleAutoRead();
        if (App.Speech) App.Speech.speak(on ? "自动朗读已打开" : "自动朗读已关闭");
      },
      goHome: function () { w.location.href = "主页.html"; },
      openVoices: function () {
        this.showVoices = true;
        this.showBadges = false;
        this.refreshVoices();
      },
      refreshVoices: function () {
        var self = this;
        if (App.Speech) {
          // 主动触发一次语音列表加载（Edge 在线语音靠它异步返回）
          try { if (w.speechSynthesis) w.speechSynthesis.getVoices(); } catch (e0) {}
          App.Speech.pickVoice();
        }
        this.voices = (App.Speech && App.Speech.listVoices) ? App.Speech.listVoices() : [];
        this.clouds = (App.Speech && App.Speech.cloudVoices) ? App.Speech.cloudVoices() : [];
        this.styles = (App.Speech && App.Speech.styleVoices) ? App.Speech.styleVoices() : [];
        this.vLoading = !this.voices.length;
        // Edge 在线人声异步返回慢：轮询最多约 20 秒
        if (this.vLoading && this.vTry < 40) {
          this.vTry++;
          setTimeout(function () { if (self.showVoices) self.refreshVoices(); }, 500);
        }
      },
      pickV: function (v) {
        if (App.Speech) {
          App.Speech.setVoice(v.name, v.kind);
          App.Speech.demoVoice(v.name, v.kind);
        }
      },
      // 模板里不能直接写 App.Speech（作用域未定义会报错），一律走方法
      tryVoice: function (v) {
        if (App.Speech) App.Speech.demoVoice(v.name, v.kind);
      },
      // 云端嗓音：选中即用，读题/拼音/英语全部走云端，联网失败自动回退本机
      pickCloud: function (v) {
        if (App.Speech) {
          App.Speech.setCloudVoice(v.id);
          App.Speech.demoCloud(v.id);
        }
      },
      tryCloud: function (v) {
        if (App.Speech) App.Speech.demoCloud(v.id);
      },
      useLocal: function () {
        if (App.Speech) {
          App.Speech.setCloudVoice("");
          App.Speech.speak("已换回本机声音");
        }
      },
      // 本机变声风格：同一嗓音多种音色，离线可用
      pickStyle: function (s) {
        if (App.Speech) {
          App.Speech.setStyleVoice(s.id);
          App.Speech.demoStyle(s.id);
        }
      },
      tryStyle: function (s) {
        if (App.Speech) App.Speech.demoStyle(s.id);
      },
      clearStyle: function () {
        if (App.Speech) {
          App.Speech.setStyleVoice("");
          App.Speech.speak("已恢复原声");
        }
      },
      resetV: function () {
        if (App.Speech) {
          App.Speech.setVoice("", "zh");
          App.Speech.setVoice("", "en");
          App.Speech.speak("已恢复默认声音");
        }
        this.refreshVoices();
      }
    },
    template: [
      '<div class="wrap">',
      '<div class="topbar">',
      '<div class="brand" @click="goHome"><span class="emj">🎒</span>{{site}}</div>',
      '<div class="tb-right">',
      '<span class="tb-star" title="学习星星">⭐ {{st.stars}}</span>',
      '<span class="tb-badges" @click="showBadges=!showBadges" title="我的徽章">',
      '<em v-for="b in myBadges" :key="b.id" :class="{off:!b.got}">{{b.got ? b.i : "▫️"}}</em>',
      '</span>',
      '<button class="btn spk" @click="toggleRead">{{st.autoRead ? "🔊 自动朗读开" : "🔇 自动朗读关"}}</button>',
      '<button class="btn spk" @click="openVoices" title="选择朗读声音">🎙️ 声音</button>',
      '</div>',
      '</div>',
      '<div class="voice-pop" v-if="showVoices">',
      '<div class="vp-title">🎙️ 选择朗读声音 <span class="vp-close" @click="showVoices=false">✕</span></div>',
      '<div class="vp-sub">☁️ 云端嗓音（联网，声音更多；失败自动回退本机）</div>',
      '<div class="vlist">',
      '<div class="vitem cloud" v-for="v in clouds" :key="\'c\'+v.id" :class="{on: curCloud === v.id}" @click="pickCloud(v)">',
      '<span class="vradio">{{curCloud === v.id ? "🔘" : "⚪"}}</span>',
      '<span class="vlabel">{{v.name}}</span>',
      '<span class="vlang">{{v.tag}}</span>',
      '<button class="vtry" @click.stop="tryCloud(v)">▶ 试听</button>',
      '</div>',
      '</div>',
      '<div class="vp-local" v-if="curCloud"><button class="btn" @click="useLocal">↩️ 换回本机嗓音</button></div>',
      '<div class="vp-sub">🎭 变声风格（同一嗓音变出多种音色，离线可用）</div>',
      '<div class="vlist">',
      '<div class="vitem style" v-for="s in styles" :key="s.id" :class="{on: curStyle === s.id}" @click="pickStyle(s)">',
      '<span class="vradio">{{curStyle === s.id ? "🔘" : "⚪"}}</span>',
      '<span class="vlabel">{{s.name}}</span>',
      '<span class="vlang">{{s.kind === "en" ? "英语" : "中文"}}</span>',
      '<button class="vtry" @click.stop="tryStyle(s)">▶ 试听</button>',
      '</div>',
      '</div>',
      '<div class="vp-local" v-if="curStyle"><button class="btn" @click="clearStyle">↩️ 取消变声（原声）</button></div>',
      '<div class="vp-sub">👤 人声嗓音（Edge 浏览器联网会出现更多在线人声）</div>',
      '<div class="vp-sub2">中文 · 在线人声（联网，Edge 自动出现）</div>',
      '<div class="vlist">',
      '<div class="vitem" v-for="v in zhOnline" :key="\'o\'+v.name" :class="{on: curZh === v.name}" @click="pickV(v)">',
      '<span class="vradio">{{curZh === v.name ? "🔘" : "⚪"}}</span>',
      '<span class="vlabel">{{v.label}}</span>',
      '<span class="vlang">{{v.lang}}</span>',
      '<button class="vtry" @click.stop="tryVoice(v)">▶ 试听</button>',
      '</div>',
      '</div>',
      '<div class="vp-sub2">中文 · 本机人声（离线）</div>',
      '<div class="vlist">',
      '<div class="vitem" v-for="v in zhLocal" :key="\'z\'+v.name" :class="{on: curZh === v.name}" @click="pickV(v)">',
      '<span class="vradio">{{curZh === v.name ? "🔘" : "⚪"}}</span>',
      '<span class="vlabel">{{v.label}}</span>',
      '<span class="vlang">{{v.lang}}</span>',
      '<button class="vtry" @click.stop="tryVoice(v)">▶ 试听</button>',
      '</div>',
      '</div>',
      '<div class="vp-sub2">英文人声（读英语单词和句子）</div>',
      '<div class="vlist">',
      '<div class="vitem" v-for="v in enVoices" :key="\'e\'+v.name" :class="{on: curEn === v.name}" @click="pickV(v)">',
      '<span class="vradio">{{curEn === v.name ? "🔘" : "⚪"}}</span>',
      '<span class="vlabel">{{v.label}}</span>',
      '<span class="vlang">{{v.lang}}</span>',
      '<button class="vtry" @click.stop="tryVoice(v)">▶ 试听</button>',
      '</div>',
      '</div>',
      '<div class="vp-empty" v-if="vLoading">正在获取这台设备的声音列表…（在线人声需要等几秒）</div>',
      '<div class="vp-foot"><button class="btn" @click="resetV">↩️ 恢复默认</button>',
      '<span class="vp-tip">选好点名字就能换，换完自动播放一句试听</span></div>',      '</div>',
      '<div class="badge-pop" v-if="showBadges">',
      '<div class="bp-title">🏅 我的徽章</div>',
      '<div class="bp-grid">',
      '<div class="bp-item" v-for="b in myBadges" :key="b.id" :class="{off:!b.got}">',
      '<span class="bp-i">{{b.i}}</span><span class="bp-n">{{b.n}}</span><span class="bp-d">{{b.d}}</span>',
      '</div>',
      '</div>',
      '</div>',
      '<nav class="nav">',
      '<a v-for="n in nav" :key="n.h" :href="n.h" :class="{active: n.h === cur}"><span class="emj">{{n.i}}</span>{{n.t}}</a>',
      '</nav>',
      '<div class="page-title" v-if="title">{{icon}} {{title}}</div>',
      '<div class="page-sub" v-if="sub">{{sub}}</div>',
      '<slot></slot>',
      '<div class="footer">{{site}} · 语音 + 动画 + 随机出题 · 每天进步一点点</div>',
      '</div>'
    ].join("")
  };
})(window);
