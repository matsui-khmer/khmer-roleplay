/* ============================================================
   クメール語 ロールプレイング教材 — 画面の動き
   案15 検索窓 ／ 案11 場面で絞り込む ／ 案18 読み・訳を1つずつ消せる
   案50 ホーム画面に追加
   ★ 外のライブラリは1つも使わない（読み込みが増えるだけで、やることは短い）。
   ============================================================ */
(function () {
  "use strict";

  /* ── 覚えておく（この人のブラウザの中だけ。消えても画面は正しく出る） ── */
  var 鍵 = "khmer-roleplay/";
  function 読む(k, 既定) {
    try {
      var v = localStorage.getItem(鍵 + k);
      return v === null ? 既定 : v;
    } catch (e) { return 既定; }
  }
  function 書く(k, v) {
    try { localStorage.setItem(鍵 + k, v); } catch (e) { /* 失敗しても困らない */ }
  }

  /* ══════════════════════════════════════════════════════════
     案18 読み・訳を1つずつ消せる
     ★ 1つずつ押せるのが本体。上の帯のスイッチは「ぜんぶ」の近道。
     ★ 既定は**ぜんぶ出す**（はじめて来た人が、隠れているものを
       探さなくてよいように）。
     ══════════════════════════════════════════════════════════ */
  function 面を当てる(種, 出す) {
    var みな = document.querySelectorAll('.peel.' + 種);
    for (var i = 0; i < みな.length; i++) {
      みな[i].setAttribute("aria-pressed", 出す ? "true" : "false");
    }
    var sw = document.querySelector('.sw[data-all="' + 種 + '"]');
    if (sw) {
      sw.setAttribute("aria-pressed", 出す ? "true" : "false");
      sw.textContent = (種 === "yomi" ? "読み" : "日本語")
        + (出す ? "を隠す" : "を出す");
    }
    書く(種, 出す ? "1" : "0");
  }

  document.addEventListener("click", function (e) {
    var p = e.target.closest ? e.target.closest(".peel") : null;
    if (p) {
      p.setAttribute("aria-pressed",
        p.getAttribute("aria-pressed") === "false" ? "true" : "false");
      return;
    }
    var sw = e.target.closest ? e.target.closest(".sw[data-all]") : null;
    if (sw) {
      面を当てる(sw.getAttribute("data-all"),
        sw.getAttribute("aria-pressed") !== "true");
    }
  });

  if (document.querySelector(".peel")) {
    ["yomi", "ja"].forEach(function (種) {
      面を当てる(種, 読む(種, "1") === "1");
    });
  }

  /* ══════════════════════════════════════════════════════════
     案15 検索窓 ＋ 案11 場面で絞り込む（ハブのページだけ）
     ★ 引けるのは **題名・場面・単語（クメール語・カタカナ・意味）・解説の見出し**。
       単語の表は作るときに index.js へ書き出してある（`window.KYOZAI`）。
     ★ クメール文字をそのまま打てる人は少ないので、
       **当たった単語を3つまで見せる**（引けていることが目に見える）。
     ══════════════════════════════════════════════════════════ */
  var 窓 = document.getElementById("q");
  var 一覧 = document.getElementById("cards");
  if (窓 && 一覧 && window.KYOZAI) {
    var データ = window.KYOZAI;
    var 選んだ場面 = null;

    var カナ正規 = function (s) {
      // ひらがな → カタカナ（「たらい」でも「タライ」に当たるように）
      return s.replace(/[ぁ-ゖ]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) + 0x60);
      });
    };
    var 均す = function (s) {
      return カナ正規(String(s || "").toLowerCase()
        .replace(/[　\s]+/g, "")
        .normalize("NFC"));
    };

    function 当たり(k, 語) {
      // 返すのは「当たった単語の文字列たち」。題名・場面で当たったら空配列。
      var 出 = [];
      for (var i = 0; i < k.語.length && 出.length < 3; i++) {
        var w = k.語[i];
        if (均す(w[0]).indexOf(語) >= 0 || 均す(w[1]).indexOf(語) >= 0
            || 均す(w[2]).indexOf(語) >= 0) {
          出.push(w[0] + "（" + w[1] + "）" + w[2]);
        }
      }
      return 出;
    }

    function 引く() {
      var 生 = 窓.value.trim();
      var 語 = 均す(生);
      var 出た = 0;
      var 言 = document.getElementById("found");

      データ.教材.forEach(function (k) {
        var li = document.getElementById("card" + k.番);
        if (!li) return;
        var hit = li.querySelector(".hit");
        if (hit) { hit.hidden = true; hit.textContent = ""; }

        var 場面で通る = !選んだ場面 || k.場面.indexOf(選んだ場面) >= 0;
        var 語で通る = true;
        if (語) {
          var 題で = 均す(k.題).indexOf(語) >= 0;
          var 場で = k.場面.some(function (b) { return 均す(b).indexOf(語) >= 0; });
          var 解で = k.解説.some(function (h) { return 均す(h).indexOf(語) >= 0; });
          var 語たち = 当たり(k, 語);
          語で通る = 題で || 場で || 解で || 語たち.length > 0;
          if (語で通る && 語たち.length && hit) {
            hit.textContent = "この教材の中の「" + 語たち.join("」「") + "」";
            hit.hidden = false;
          }
        }
        var 出す = 場面で通る && 語で通る;
        li.hidden = !出す;
        if (出す) 出た++;
      });

      if (言) {
        if (!生 && !選んだ場面) {
          言.textContent = "";
        } else {
          var も = [];
          if (選んだ場面) も.push("場面「" + 選んだ場面 + "」");
          if (生) も.push("「" + 生 + "」");
          言.textContent = も.join("と") + "で " + 出た + " 本"
            + (出た === 0 ? "。ほかのことばでも引けます（クメール語・カタカナ・日本語）。" : "");
        }
      }
    }

    // ★ パンくずの「場面: 移動」から来たときは、その場面で絞り込む
    //   （2026-11-05の指摘F8。前は #cards へ飛ぶだけで、何も起きなかった）
    var ば = /[?&]ba=([^&]*)/.exec(location.search || "");
    if (ば) {
      try { 選んだ場面 = decodeURIComponent(ば[1]); } catch (e) { 選んだ場面 = null; }
      // ★ 2026-11-05のレビュー指摘S1。**空の `?ba=` は「絞り込みなし」。**
      //   空文字のままだと `場面名()` が返す null と一致せず、
      //   **押されている札が1つも無い**見た目になる（絞り込みは効いていない）。
      if (!選んだ場面) 選んだ場面 = null;
    }

    // ★★ 2026-11-05、松井さんの指示で「すべて」の札を足した。
    //   その札だけ data-scene が空。**空は「絞り込みなし」**。
    //   文字列の "" と null を取りちがえると、はじめに押されている札が
    //   1つも無い状態になる（どれが効いているか読めない）。
    function 場面名(el) {
      var b = el.getAttribute("data-scene");
      return b ? b : null;
    }
    var タグたち = document.querySelectorAll(".tag");
    function 札を当てる() {
      for (var j = 0; j < タグたち.length; j++) {
        タグたち[j].setAttribute("aria-pressed",
          場面名(タグたち[j]) === 選んだ場面 ? "true" : "false");
      }
    }

    窓.addEventListener("input", 引く);
    // ★ **いつも当てる。** もとは絞り込みがある日だけ当てていたので、
    //   ふだんは「すべて」の札も押されていない見た目になった。
    札を当てる();
    引く();
    for (var i = 0; i < タグたち.length; i++) {
      タグたち[i].addEventListener("click", function () {
        var b = 場面名(this);
        選んだ場面 = (選んだ場面 === b) ? null : b;
        札を当てる();
        引く();
      });
    }

    /* ── 一覧で見る（2026-11-05、松井さんの指示） ──
       カードを1列に並べて高さを詰める。**出す本数は変えない**
       （絞り込みと検索はそのまま効く。変わるのは並びだけ）。
       ★ レビュー指摘F3。はじめ「ぜんぶを一覧で見る」と書いていたが、
         絞り込み中に押すと全部は出ないので**嘘になる**。
         すぐ上にある「すべて」の札（絞り込みを外す）とも同義語で紛れる。
         → 名は**並びの話だと分かるもの**にした。 */
    var 一覧ボタン = document.getElementById("viewall");
    if (一覧ボタン) {
      var 一覧で当てる = function (一覧か) {
        一覧.classList.toggle("list", !!一覧か);
        一覧ボタン.setAttribute("aria-pressed", 一覧か ? "true" : "false");
        一覧ボタン.textContent = 一覧か ? "カードで見る" : "一覧で見る";
        書く("list", 一覧か ? "1" : "0");
      };
      一覧で当てる(読む("list", "0") === "1");
      一覧ボタン.addEventListener("click", function () {
        一覧で当てる(!一覧.classList.contains("list"));
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     案50 ホーム画面に追加できる
     ★ **出せるときだけ出す。** 押せないボタンを置かない。
     ══════════════════════════════════════════════════════════ */
  var 置き = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    置き = e;
    var 箱 = document.getElementById("a2hs");
    if (箱) {
      箱.classList.add("on");
      var b = 箱.querySelector("button");
      if (b) {
        b.addEventListener("click", function () {
          if (!置き) return;
          置き.prompt();
          置き = null;
          箱.classList.remove("on");
        });
      }
    }
  });

  // ★ 置き場の道は HTML 側が `window.BASE` で渡す。
  //   ここに書き込むと、教材ページ（/06/ の下）から見たときに外れる。
  if ("serviceWorker" in navigator && location.protocol === "https:"
      && window.BASE) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(window.BASE + "sw.js").catch(function () {
        /* 入らなくてもページは動く */
      });
    });
  }
}());
