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
      curEn: function () { return this.st.voiceEn || ""; }
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
        if (App.Speech) App.Speech.pickVoice();
        this.voices = (App.Speech && App.Speech.listVoices) ? App.Speech.listVoices() : [];
        this.vLoading = !this.voices.length;
        // 手机端语音列表异步返回：自动重试几次
        if (this.vLoading && this.vTry < 6) {
          this.vTry++;
          setTimeout(function () { if (self.showVoices) self.refreshVoices(); }, 400);
        }
      },
      pickV: function (v) {
        if (App.Speech) {
          App.Speech.setVoice(v.name, v.kind);
          App.Speech.demoVoice(v.name, v.kind);
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
      '<div class="vp-sub">中文声音（读拼音、读题、读课文）</div>',
      '<div class="vlist">',
      '<div class="vitem" v-for="v in zhVoices" :key="\'z\'+v.name" :class="{on: curZh === v.name}" @click="pickV(v)">',
      '<span class="vradio">{{curZh === v.name ? "🔘" : "⚪"}}</span>',
      '<span class="vlabel">{{v.label}}</span>',
      '<span class="vlang">{{v.lang}}</span>',
      '<button class="vtry" @click.stop="App.Speech && App.Speech.demoVoice(v.name, v.kind)">▶ 试听</button>',
      '</div>',
      '</div>',
      '<div class="vp-sub">英文声音（读英语单词和句子）</div>',
      '<div class="vlist">',
      '<div class="vitem" v-for="v in enVoices" :key="\'e\'+v.name" :class="{on: curEn === v.name}" @click="pickV(v)">',
      '<span class="vradio">{{curEn === v.name ? "🔘" : "⚪"}}</span>',
      '<span class="vlabel">{{v.label}}</span>',
      '<span class="vlang">{{v.lang}}</span>',
      '<button class="vtry" @click.stop="App.Speech && App.Speech.demoVoice(v.name, v.kind)">▶ 试听</button>',
      '</div>',
      '</div>',
      '<div class="vp-empty" v-if="vLoading">正在获取这台设备的声音列表…（手机需要等一两秒）</div>',
      '<div class="vp-foot"><button class="btn" @click="resetV">↩️ 恢复默认</button>',
      '<span class="vp-tip">选好点名字就能换，换完自动播放一句试听</span></div>',
      '</div>',
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
