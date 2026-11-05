/* 案50 ホーム画面に追加できる。
   ★ ページとCSSとJSは先に取っておく。**PDFは取らない**
     （9本で2MBを超える。押したときに通信すればよい）。
   ★ 版が変わったら古い棚を捨てる（v1_0_20261105）。 */
var 棚 = "khmer-roleplay-v1_0-20261105";
var さき = ["/khmer-roleplay/", "/khmer-roleplay/assets/style.css", "/khmer-roleplay/assets/app.js", "/khmer-roleplay/assets/index.js", "/khmer-roleplay/01/", "/khmer-roleplay/02/", "/khmer-roleplay/03/", "/khmer-roleplay/04/", "/khmer-roleplay/05/", "/khmer-roleplay/06/", "/khmer-roleplay/07/", "/khmer-roleplay/08/", "/khmer-roleplay/09/"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(棚).then(function (c) {
    return c.addAll(さき);
  }).then(function () { return self.skipWaiting(); }).catch(function () {}));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) {
      return k === 棚 ? null : caches.delete(k);
    }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.indexOf("/pdf/") >= 0) return;   /* PDFは棚に入れない */
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var 写し = res.clone();
        caches.open(棚).then(function (c) { c.put(e.request, 写し); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || caches.match("/khmer-roleplay/");
      });
    })
  );
});
