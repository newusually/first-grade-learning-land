/*
 * pinyin-zone-view.js — 视图层 / 拼音专区
 * 标签页：写法 / 组成 / 拼读 / 记忆 / 四声朗读 / 组词填字。
 * 语音规则：所有拼音都走 speakPinyin（中文呼读音），绝不读成英文字母。
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});
  var Speech = App.Speech, U = App.U, PZ = App.PinyinZone;

  function blank(q) { return { q: q, done: false, picked: -1, fb: "", fbCls: "", res: "" }; }

  App.views = App.views || {};
  App.views.pinyinZone = {
    template: [
      '<site-shell title="拼音专区" sub="四线三格、声母韵母、拼读练习" icon="🔡">',
      '<div class="ltabs">',
      '<button class="ltab" v-for="t in tabs" :key="t.k" :class="{on: tab === t.k}" @click="tab = t.k">{{t.t}}</button>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'write\'">',
      '<div class="pz-intro">📝 拼音写在<b>四线三格</b>里，每个字母都有自己住的地方：</div>',
      '<div class="sxs-wrap">',
      '<div class="sxscard" v-for="(c, i) in writeCards" :key="i" @click="readPy(c.s)">',
      '<div class="sxs"><span class="sxs-letter">{{c.s}}</span></div>',
      '<div class="sxs-pos">{{c.pos}}</div><div class="sxs-name">{{c.s}}</div></div>',
      '</div>',
      '<div class="ctr"><button class="btn spk" @click="readWriteAll">🔊 按顺序读全部字母</button></div>',
      '<div class="hint">👆 点一点字母，听一听怎么读（占格：中格/上中格/中下格/上中下格）</div>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'compose\'">',
      '<div class="pz-intro">🧩 一个音节 = <b>声母</b> + <b>韵母</b>（再加声调）。把它们拼起来：</div>',
      '<div class="compose">',
      '<div class="cpart"><span class="clab">声母</span><span class="cval">{{compose.q.parts[0]}}</span></div>',
      '<span class="cplus">+</span>',
      '<div class="cpart"><span class="clab">韵母</span><span class="cval">{{compose.q.parts[1]}}</span></div>',
      '<span class="cplus">=</span>',
      '<div class="cpart cres"><span class="clab">拼出来</span><span class="cval">{{compose.res || "？"}}</span></div>',
      '</div>',
      '<div class="ctr">',
      '<button class="btn spk" @click="pinCompose">🔊 拼一拼</button>',
      '<button class="btn next" @click="newCompose">下一组 ▶</button></div>',
      '<div class="gfb" :class="compose.fbCls" v-html="compose.fb"></div>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'blend\'">',
      '<div class="qtext">把下面两部分<b>拼</b>起来，是哪个音节？</div>',
      '<div class="blend-show">{{blend.q.show}}</div>',
      '<div class="opts"><div class="opt" v-for="(o, i) in blend.q.opts" :key="i" :class="blendCls(i)" @click="answerBlend(i)">{{o}}</div></div>',
      '<div class="gfb" :class="blend.fbCls" v-html="blend.fb"></div>',
      '<div class="ctr"><button class="btn spk" @click="readPy(blend.q.full)">🔊 听一听</button>',
      '<button class="btn next" @click="newBlend">下一题 ▶</button></div>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'mem\'">',
      '<div class="pz-intro">🧠 用口诀记住拼音长什么样：</div>',
      '<div class="mem-wrap">',
      '<div class="memcard" v-for="(c, i) in memCards" :key="i" @click="readPy(c.k)">',
      '<div class="mem-k">{{c.k}}</div><div class="mem-tip">{{c.tip}}</div></div>',
      '</div>',
      '<div class="ctr"><button class="btn spk" @click="readMemAll">🔊 按顺序读全部</button></div>',
      '<div class="hint">👆 点一张，读一读这个拼音</div>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'tone\'">',
      '<div class="qtext">这个拼音是 <b>{{tone.q.syl}}</b>（{{tone.q.zi}}），它读第几声？</div>',
      '<div class="tone-show">{{tone.q.syl}}</div>',
      '<div class="opts"><div class="opt" v-for="(o, i) in tone.q.opts" :key="i" :class="quizCls(tone, i)" @click="answerQuiz(tone, i)">{{o}}</div></div>',
      '<div class="gfb" :class="tone.fbCls" v-html="tone.fb"></div>',
      '<div class="ctr"><button class="btn spk" @click="readPy(tone.q.syl)">🔊 听一听</button>',
      '<button class="btn next" @click="newTone">下一题 ▶</button></div>',
      '</div>',
      '<div class="card lpanel" v-show="tab === \'fill\'">',
      '<div class="qtext">下面的拼音是 <b>{{fill.q.py}}</b>，应该写哪个字？</div>',
      '<div class="fill-show">{{fill.q.py}}</div>',
      '<div class="opts"><div class="opt" v-for="(o, i) in fill.q.opts" :key="i" :class="quizCls(fill, i)" @click="answerQuiz(fill, i)">{{o}}</div></div>',
      '<div class="gfb" :class="fill.fbCls" v-html="fill.fb"></div>',
      '<div class="ctr"><button class="btn next" @click="newFill">下一题 ▶</button></div>',
      '</div>',
      '</site-shell>'
    ].join(""),
    data: function () {
      return {
        tabs: [
          { k: "write", t: "📝 写法" }, { k: "compose", t: "🧩 组成" }, { k: "blend", t: "🔗 拼读" },
          { k: "mem", t: "🧠 记忆" }, { k: "tone", t: "🎵 四声" }, { k: "fill", t: "✏️ 填字" }
        ],
        tab: "write",
        writeCards: PZ.writeCards(),
        memCards: PZ.memoryCards(),
        compose: blank(PZ.composeQuiz()),
        blend: blank(PZ.blendQuiz()),
        tone: blank(PZ.toneQuiz()),
        fill: blank(PZ.fillQuiz())
      };
    },
    mounted: function () {
      Speech.autoRead("拼音专区，先学写法，再练拼读！");
    },
    methods: {
      readPy: function (s) { Speech.speakPinyin(s, { rate: 0.7 }); },
      readWriteAll: function () {
        Speech.seq(this.writeCards.map(function (c) { return c.s; }));
      },
      readMemAll: function () {
        Speech.seq(this.memCards.map(function (c) { return c.k; }));
      },
      quizCls: function (box, i) {
        if (!box.done) return {};
        var ok = i === box.q.ans;
        return { x: true, ok: ok, no: !ok };
      },
      blendCls: function (i) { return this.quizCls(this.blend, i); },
      newCompose: function () { this.compose = blank(PZ.composeQuiz()); },
      newBlend: function () { this.blend = blank(PZ.blendQuiz()); },
      newTone: function () { this.tone = blank(PZ.toneQuiz()); },
      newFill: function () { this.fill = blank(PZ.fillQuiz()); },
      pinCompose: function () {
        var q = this.compose.q;
        this.compose.res = q.blended;
        this.compose.fb = "拼出来是 <b>" + q.blended + "</b> → " + q.word;
        this.compose.fbCls = "gfb good";
        Speech.speakPinyin(q.blended, { rate: 0.7 });
        var self = this;
        setTimeout(function () { Speech.speak(q.word); }, 900);
      },
      answerBlend: function (i) {
        var box = this.blend, q = box.q;
        if (box.done) return;
        box.done = true; box.picked = i;
        var ok = i === q.ans;
        box.fb = (ok ? "✔ 真棒！" : "✘ 再想想：正确答案是 ") + "<span class='gexplain'>" + (ok ? "" : (q.ansWord || q.opts[q.ans])) + "</span>";
        box.fbCls = "gfb " + (ok ? "good" : "bad");
        if (ok) {
          U.confetti(12); Speech.sfx.right();
          Speech.speakPinyin(q.full, { rate: 0.7 });
          var self = this;
          setTimeout(function () { Speech.speak(q.ansWord); }, 900);
          App.Store.addStars(1);
        } else { Speech.sfx.wrong(); }
      },
      answerQuiz: function (box, i) {
        var q = box.q;
        if (box.done) return;
        box.done = true; box.picked = i;
        var ok = i === q.ans;
        box.fb = (ok ? "✔ 真棒！" : "✘ 再想想：正确答案是 ") + "<span class='gexplain'>" + (ok ? "" : (q.ansWord || q.opts[q.ans])) + "</span>";
        box.fbCls = "gfb " + (ok ? "good" : "bad");
        if (ok) {
          U.confetti(12); Speech.sfx.right(); App.Store.addStars(1);
          if (box === this.tone) Speech.speak(q.note); else Speech.speakPinyin(q.py);
        } else { Speech.sfx.wrong(); }
      }
    }
  };
})(window);
