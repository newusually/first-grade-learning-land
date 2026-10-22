/*
 * app.js — 应用层 / 启动器（Vue 挂载）
 * 每个 HTML 只写 <div id="app" data-view="xxx"></div>，由这里读取视图名并挂载对应 Vue 应用。
 * 视图文件统一把自己注册进 App.views，例如 App.views.abacus = { ... }。
 */
(function (w) {
  "use strict";
  var App = (w.App = w.App || {});

  function boot() {
    var host = document.getElementById("app");
    if (!host) return;
    var name = host.getAttribute("data-view") || "";
    var def = (App.views && App.views[name]) || null;
    if (!def || !w.Vue) {
      host.innerHTML = "<div class='wrap'><div class='card'>😢 页面「" + name + "」加载失败，请刷新重试。</div></div>";
      return;
    }
    var app = w.Vue.createApp(def);
    if (App.Shell) app.component("site-shell", App.Shell);
    app.mount(host);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
