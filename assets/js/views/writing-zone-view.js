/*
 * writing-zone-view.js — 视图层 / 写作专区
 * 标签页：看图写话 / 句子仿写 / 连词成句 / 量词搭配 / 标点练习。
 * 每个板块都配图片 + “读一读”按钮，并随题目自动朗读。
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  var Speech = App.Speech, U = App.U, IMG = App.IMG, WZ = App.WritingZone;

  App.views = App.views || {};
  App.views.writingZone = {
    template: [
      '<site-shell title="写作专区" sub="看图写话、仿写句子、连词成句" icon="✍️">',
      '<div class="ltabs">',
      '<button class="ltab" v-for="t in tabs" :key="t.k" :class="{on: tab === t.k}" @click="tab = t.k">{{t.t}}</button>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'pic\'">',
      '<div class="pic-wrap">',
      '<div class="pic-img" v-html="svg(pic.img)"></div>',
      '<div class="pic-words">提示词：<span class="pw" v-for="(x, i) in pic.words" :key="i">{{x}}</span></div>',
      '</div>',
      '<div class="qtext">用上面的词，写一句话吧：</div>',
      '<textarea class="wt-area" v-model="myText" placeholder="在这里写一句话…"></textarea>',
      '<div class="ctr">',
      '<button class="btn" @click="showModel">👀 看范例</button>',
      '<button class="btn spk" @click="readModel">🔊 读范例</button>',
      '<button class="btn spk" @click="readWords">🔊 读提示词</button>',
      '<button class="btn next" @click="newPic">换一张 ▶</button></div>',
      '<div class="gfb" :class="pic.fbCls" v-html="pic.fb"></div>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'imit\'">',
      '<div class="imit-pic" v-html="svg(imit.q.img)"></div>',
      '<div class="qtext">范例：<b>{{imit.q.model}}</b></div>',
      '<div class="qtext">照样子写：<b>{{imit.q.tmpl}}</b></div>',
      '<div class="opts"><div class="opt" v-for="(o, i) in imit.q.opts" :key="i" :class="quizCls(imit, i)" @click="answerQuiz(imit, i, imit.q.model)">{{o}}</div></div>',
      '<div class="gfb" :class="imit.fbCls" v-html="imit.fb"></div>',
      '<div class="ctr"><button class="btn spk" @click="readZh(imit.q.model)">🔊 读范例</button>',
      '<button class="btn next" @click="newImit">下一题 ▶</button></div>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'order\'">',
      '<div class="imit-pic" v-html="svg(order.q.img)"></div>',
      '<div class="qtext">把这些词排成一句通顺的话（点词排顺序）：</div>',
      '<div class="order-pool">',
      '<span class="oword" v-for="(wd, i) in order.q.shuffled" :key="i" :class="{used: order.used[i]}" @click="orderPick(i)">{{wd}}</span></div>',
      '<div class="order-ans"><span class="ph" v-if="!order.picked.length">点上面的词，排到这里 →</span>',
      '<span class="oword in" v-for="(wd, i) in order.picked" :key="i">{{wd}}</span></div>',
      '<div class="ctr">',
      '<button class="btn" @click="orderCheck">✅ 检查</button>',
      '<button class="btn" @click="orderClear">↺ 重排</button>',
      '<button class="btn spk" @click="readZh(order.q.words.join(\'\'))">🔊 读正确句子</button>',
      '<button class="btn next" @click="newOrder">换一题 ▶</button></div>',
      '<div class="gfb" :class="order.fbCls" v-html="order.fb"></div>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'meas\'">',
      '<div class="imit-pic" v-html="svg(meas.q.img)"></div>',
      '<div class="qtext">一（ <b>？</b> ）{{meas.q.noun}} —— 选哪个量词？</div>',
      '<div class="opts"><div class="opt" v-for="(o, i) in meas.q.opts" :key="i" :class="quizCls(meas, i)" @click="answerQuiz(meas, i, measSay())">{{o}}</div></div>',
      '<div class="gfb" :class="meas.fbCls" v-html="meas.fb"></div>',
      '<div class="ctr"><button class="btn spk" @click="readZh(measSay())">🔊 听正确答案</button>',
      '<button class="btn next" @click="newMeas">下一题 ▶</button></div>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'punct\'">',
      '<div class="imit-pic" v-html="svg(punct.q.img)"></div>',
      '<div class="qtext">这句话末尾应该用什么标点？</div>',
      '<div class="punct-show">{{punct.q.sent}}（　　）</div>',
      '<div class="opts"><div class="opt" v-for="(o, i) in punct.q.opts" :key="i" :class="quizCls(punct, i)" @click="answerQuiz(punct, i, punctSay())">{{o}}</div></div>',
      '<div class="gfb" :class="punct.fbCls" v-html="punct.fb"></div>',
      '<div class="ctr"><button class="btn spk" @click="readZh(punctSay())">🔊 读整句</button>',
      '<button class="btn next" @click="newPunct">下一题 ▶</button></div>',
      '</div>',
      '</site-shell>'
    ].join(""),
    data: function () {
      return {
        tabs: [
          { k: "pic", t: "🖼️ 看图写话" }, { k: "imit", t: "📋 句子仿写" }, { k: "order", t: "🔗 连词成句" },
          { k: "meas", t: "📏 量词搭配" }, { k: "punct", t: "❗ 标点练习" }
        ],
        tab: "pic",
        myText: "",
        pic: mkPic(WZ.pictureWrite()),
        imit: blank(WZ.imitateQuiz()),
        order: mkOrder(WZ.orderQuiz()),
        meas: blank(WZ.measureQuiz()),
        punct: blank(WZ.punctQuiz())
      };
    },
    mounted: function () {
      this.readPic();
      Speech.autoRead("写作专区，看图写话，还能练量词和标点！");
    },
    methods: {
      svg: function (id) { return IMG.svg(id) || ""; },
      readZh: function (t) { Speech.speak(t); },
      measSay: function () { return "一" + this.meas.q.opts[this.meas.q.ans] + this.meas.q.noun; },
      punctSay: function () { return this.punct.q.sent + this.punct.q.opts[this.punct.q.ans]; },
      orderSay: function () { return this.order.q.words.join(""); },
      readPic: function () { Speech.speak("看图写话。提示词：" + this.pic.words.join("、") + "。请用这些词写一句话。"); },
      readModel: function () { Speech.speak(this.pic.t.model); },
      readWords: function () { Speech.speak(this.pic.words.join("、")); },
      showModel: function () {
        this.pic.fb = "范例：" + this.pic.t.model;
        this.pic.fbCls = "gfb good";
      },
      newPic: function () { this.pic = mkPic(WZ.pictureWrite()); this.myText = ""; this.readPic(); },
      quizCls: function (box, i) {
        if (!box.done) return {};
        var ok = i === box.q.ans;
        return { x: true, ok: ok, no: !ok };
      },
      answerQuiz: function (box, i, sayTxt) {
        var q = box.q;
        if (box.done) return;
        box.done = true; box.picked = i;
        var ok = i === q.ans;
        box.fb = (ok ? "✔ 真棒！" : "✘ 再想想：") + "<span class='gexplain'>" + (ok ? "" : q.opts[q.ans]) + "</span>";
        box.fbCls = "gfb " + (ok ? "good" : "bad");
        if (ok) {
          U.confetti(12); Speech.sfx.right(); App.Store.addStars(1);
          if (sayTxt) Speech.speak(sayTxt);
        } else { Speech.sfx.wrong(); }
      },
      newImit: function () { this.imit = blank(WZ.imitateQuiz()); },
      newOrder: function () { this.order = mkOrder(WZ.orderQuiz()); },
      newMeas: function () { this.meas = blank(WZ.measureQuiz()); },
      newPunct: function () { this.punct = blank(WZ.punctQuiz()); },
      orderPick: function (i) {
        if (this.order.used[i]) return;
        this.order.used[i] = true;
        this.order.picked.push(this.order.q.shuffled[i]);
      },
      orderClear: function () {
        var i;
        for (i = 0; i < this.order.used.length; i++) this.order.used[i] = false;
        this.order.picked = [];
      },
      orderCheck: function () {
        var q = this.order.q, right = q.words.join(""), got = this.order.picked.join("");
        if (got === right) {
          this.order.fb = "✔ 真棒！" + right; this.order.fbCls = "gfb good";
          U.confetti(14); Speech.sfx.right(); Speech.speak(right); App.Store.addStars(1);
        } else {
          this.order.fb = "✘ 再试试：正确是 <span class='gexplain'>" + right + "</span>";
          this.order.fbCls = "gfb bad"; Speech.sfx.wrong();
        }
      }
    }
  };

  function mkPic(t) { return { t: t, img: t.img, words: t.words, fb: "", fbCls: "" }; }
  function blank(q) { return { q: q, done: false, picked: -1, fb: "", fbCls: "" }; }
  function mkOrder(q) {
    return { q: q, used: q.shuffled.map(function () { return false; }), picked: [], fb: "", fbCls: "" };
  }
})(window);
