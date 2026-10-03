/* ============================================================
   tabbar.js — スマホの画面の下に出す帯（タブバー）
   ------------------------------------------------------------
   使い方（各ページの </body> の手前）:
     <script src="tabbar.js"></script>

   ・狭い画面のときだけ出る。広い画面では上のヘッダーがそのまま働く
   ・中身はログインの状態で変わる。auth.js が読み込まれた時点で
     TriArk.tabbar.set({...}) が呼ばれ、書き直される
   ・文言は data-i18n を付けてあるので、i18n.js が言語に合わせて直す
   ・やりとりの画面（chat.html）では読み込まない。
     下に入力欄があるので、帯と重なるため
   ============================================================ */
(function () {
  window.TriArk = window.TriArk || {};

  var state = { signedIn: false, isHost: false, unread: false };

  /* ---------- 絵柄（線だけの簡単なもの。色は文字色に合わせる） ---------- */
  var ICONS = {
    // さがす
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 21 21"/>',
    // ホストを探す（人がふたり）
    people: '<circle cx="9" cy="8" r="3.4"/><path d="M3.2 19.5c0-3.2 2.6-5.3 5.8-5.3s5.8 2.1 5.8 5.3"/>' +
            '<circle cx="17.4" cy="9.2" r="2.6"/><path d="M16 14.4c3 .2 4.8 2.2 4.8 5.1"/>',
    // Ark（TriArk のしるし。3本の弧）
    ark:    '<path d="M2.5 18a9.5 9.5 0 0 1 19 0"/><path d="M6 18a6 6 0 0 1 12 0"/>' +
            '<path d="M9.5 18a2.5 2.5 0 0 1 5 0"/>',
    // メッセージ
    chat:   '<path d="M20.5 15.3c0 1-.8 1.8-1.8 1.8H8.4L4 20.8V6.9c0-1 .8-1.8 1.8-1.8h12.9c1 0 1.8.8 1.8 1.8z"/>',
    // 予約
    calendar: '<rect x="3.2" y="5.2" width="17.6" height="15.6" rx="2.2"/><path d="M3.2 10h17.6"/>' +
              '<path d="M8 3.2v4M16 3.2v4"/>',
    // 自分の姿
    person: '<circle cx="12" cy="8" r="3.8"/><path d="M4.6 20.4c0-3.8 3.3-6.3 7.4-6.3s7.4 2.5 7.4 6.3"/>'
  };

  function svg(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------- どの札を並べるか ----------
     ・多くても5つまで。増やすと文字が小さくなって読めない
     ・ホストの人には「自分の体験」を、そうでない人には「ホストを探す」を出す */
  function tabs() {
    if (!state.signedIn) {
      return [
        ['listings.html',        'tab.find',     'search'],
        ['hosts.html',           'tab.hosts',    'people'],
        ['profile.html?host=1',  'tab.becomeHost', 'ark'],
        ['login.html',           'tab.login',    'person']
      ];
    }
    return [
      ['listings.html', 'tab.find', 'search'],
      state.isHost
        ? ['my-listings.html', 'tab.myListings', 'ark']
        : ['hosts.html',       'tab.hosts',      'people'],
      ['messages.html',    'tab.messages', 'chat'],
      ['my-bookings.html', 'tab.bookings', 'calendar'],
      ['profile.html',     'tab.profile',  'person']
    ];
  }

  function t(key) {
    return (window.TriArk.i18n && window.TriArk.i18n.t) ? window.TriArk.i18n.t(key) : '';
  }
  function lang() {
    return (window.TriArk.i18n && window.TriArk.i18n.get) ? window.TriArk.i18n.get() : 'ja';
  }

  var here = (location.pathname.split('/').pop() || 'index.html');

  function render() {
    var box = document.getElementById('tabBar');
    if (!box) return;
    var q = lang();

    box.innerHTML = tabs().map(function (row) {
      var href = row[0], key = row[1], ico = row[2];
      var base = href.split('?')[0];
      var url  = href + (href.indexOf('?') === -1 ? '?' : '&') + 'lang=' + q;
      var dot  = (key === 'tab.messages' && state.unread) ? '<span class="tb-dot"></span>' : '';
      var label = t(key);
      return '<a href="' + url + '"' + (base === here ? ' class="current"' : '') + '>' +
               '<span class="tb-ico">' + svg(ico) + dot + '</span>' +
               '<span data-i18n="' + key + '">' + label + '</span>' +
             '</a>';
    }).join('');
  }

  /* auth.js から呼ばれる。ログインの状態が分かったとき、未読が変わったとき */
  window.TriArk.tabbar = {
    set: function (next) {
      next = next || {};
      state.signedIn = !!next.signedIn;
      state.isHost   = !!next.isHost;
      state.unread   = !!next.unread;
      render();
    },
    render: render
  };

  /* ---------- 置き場所を作る ---------- */
  function mount() {
    if (document.getElementById('tabBar')) return;
    var nav = document.createElement('nav');
    nav.className = 'tabbar';
    nav.id = 'tabBar';
    document.body.appendChild(nav);
    render();
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  /* 言語が変わったら文言を入れ直す（i18n.js が後から読まれる場合にも備える） */
  function hook() {
    if (window.TriArk.i18n && window.TriArk.i18n.onChange) {
      window.TriArk.i18n.onChange(render);
      render();
    } else {
      setTimeout(hook, 120);
    }
  }
  hook();
})();
