/* ============================================================
   header.js — 全ページ共通のヘッダー
   ------------------------------------------------------------
   使い方（トップページ以外のすべての画面）:
     <header class="site-header" id="siteHeader"></header>
     <script src="header.js"></script>
   ・ロゴ（トップへのリンク）、メニュー、言語切替、スマホ用ボタンを作る
   ・メニューの中身（ログイン状態で変わる部分）は auth.js が
     #authNav に書き込む。ここでは未ログイン時の仮の中身だけ置く
   ・i18n.js より前に読み込むこと（文言とリンクの ?lang= は i18n.js が整える）
   ============================================================ */
(function () {
  var box = document.getElementById('siteHeader');
  if (!box) return;

  var logo =
    '<a class="sh-logo" href="index.html" aria-label="TriArk">' +
      '<svg viewBox="0 0 220 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="TriArk">' +
        '<path d="M10,150 A100,100 0 0,1 210,150" fill="none" stroke="#E8452B" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M30,150 A80,80 0 0,1 190,150" fill="none" stroke="#00B4C8" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M50,150 A60,60 0 0,1 170,150" fill="none" stroke="#F4EDE2" stroke-width="10" stroke-linecap="round"/>' +
        '<rect fill="#F4EDE2" x="103" y="18" width="12" height="134" rx="3"/>' +
        '<rect fill="#F4EDE2" x="55" y="18" width="108" height="10" rx="3"/>' +
        '<text fill="#F4EDE2" x="110" y="192" font-family="Georgia, serif" font-size="24" font-weight="bold" letter-spacing="5" text-anchor="middle">TriArk</text>' +
        '<rect fill="#E8452B" x="56" y="199" width="108" height="2" rx="1"/>' +
      '</svg>' +
    '</a>';

  box.innerHTML =
    logo +
    '<button class="sh-toggle" id="shToggle" type="button" aria-label="menu" aria-expanded="false">' +
      '<span></span><span></span><span></span>' +
    '</button>' +
    '<nav class="sh-nav" id="shNav">' +
      '<div id="authNav" class="auth-nav">' +
        '<a href="listings.html" data-i18n="nav.findListings">体験をさがす</a>' +
        '<a href="hosts.html" data-i18n="nav.findHosts">ホストを探す</a>' +
        '<a href="profile.html?host=1" class="btn-outline" data-i18n="nav.host">ホストになる</a>' +
        '<a href="login.html" data-i18n="nav.login">ログイン</a>' +
        '<a href="login.html?mode=signup" class="btn-fill" data-i18n="nav.signup">新規登録</a>' +
      '</div>' +
      '<div class="lang-toggle">' +
        '<button id="btn-ja" class="active" type="button" onclick="setLang(\'ja\')">日本語</button>' +
        '<button id="btn-en" type="button" onclick="setLang(\'en\')">EN</button>' +
      '</div>' +
    '</nav>' +
    '<div class="sh-shade" id="shShade"></div>';

  /* スマホのメニュー開閉 */
  var btn = document.getElementById('shToggle');
  var nav = document.getElementById('shNav');
  var shade = document.getElementById('shShade');
  function setOpen(open) {
    btn.classList.toggle('open', open);
    nav.classList.toggle('open', open);
    shade.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
  shade.addEventListener('click', function () { setOpen(false); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
})();
