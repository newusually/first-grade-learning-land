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
        showBadges: false
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
      }
    },
    methods: {
      toggleRead: function () {
        var on = App.Store.toggleAutoRead();
        if (App.Speech) App.Speech.speak(on ? "自动朗读已打开" : "自动朗读已关闭");
      },
      goHome: function () { w.location.href = "主页.html"; }
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
      '</div>',
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
