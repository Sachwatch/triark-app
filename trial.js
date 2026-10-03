/* ============================================================
   trial.js — お試し公開中であることを、見る人に伝える
   ------------------------------------------------------------
   使い方（各ページの </body> の手前、tabbar.js と並べて）:
     <script src="trial.js"></script>

   やっていること
     ・画面の上に細い帯を出す（掲載中の体験は準備中、と伝える）
     ・体験のカードと体験ページに「準備中」の札を付ける

   お試しが終わったら
     ・下の ON を false にして deploy するだけ。
       帯も札も、全部いっぺんに消えます。
   ============================================================ */
(function () {
  window.TriArk = window.TriArk || {};

  var ON = true;          // ←←← ここ一行。お試しが終わったら false

  window.TriArk.trial = ON;

  /* 体験カードなどに差し込む札。お試しが終われば空文字になるので、
     呼び出す側は何も考えずに連結してよい */
  window.TriArk.trialBadge = function () {
    if (!ON) return '';
    /* カードは i18n が文言を当てたあとに作られることがある。
       その場合 data-i18n は効かないので、ここで文言を入れておく。
       data-i18n も残すのは、あとから言語を変えたときのため */
    var label = (window.TriArk.i18n && window.TriArk.i18n.t)
      ? window.TriArk.i18n.t('trial.badge') : '準備中';
    return '<span class="trial-badge" data-i18n="trial.badge">' + label + '</span>';
  };

  if (!ON) return;

  /* 帯を出したくないページは、読み込むときにそう書いておく。
       <script src="trial.js" data-bar="off"></script>
     トップページは背景の上にヘッダーが重なる作りなので、
     帯を割り込ませると重なってしまう。カードの札だけ使う */
  var tag = document.currentScript;
  if (!tag) {
    var all = document.querySelectorAll('script[src*="trial.js"]');
    tag = all[all.length - 1];
  }
  var showBar = !(tag && tag.getAttribute('data-bar') === 'off');

  /* ---------- 見た目 ---------- */
  var css =
    '.trial-bar{' +
      'background:var(--earth);color:#fff;font-family:var(--sans);' +
      'font-size:13px;line-height:1.7;letter-spacing:.02em;' +
      'padding:10px 4vw;text-align:center;' +
    '}' +
    '@media(max-width:600px){.trial-bar{font-size:12px;padding:9px 18px;text-align:left}}' +
    '.trial-badge{' +
      'display:inline-block;background:var(--earth);color:#fff;' +
      'font:600 11px/1 var(--sans);letter-spacing:.1em;' +
      'padding:5px 9px;border-radius:2px;white-space:nowrap;' +
    '}' +
    /* 体験カードの写真の上に重ねる */
    '.card{position:relative}' +
    '.card .trial-badge{position:absolute;top:10px;left:10px;z-index:2}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- 帯 ---------- */
  function bar() {
    if (document.getElementById('trialBar')) return;
    var d = document.createElement('div');
    d.className = 'trial-bar';
    d.id = 'trialBar';
    d.setAttribute('data-i18n', 'trial.bar');
    d.textContent = 'TriArk はいまお試し公開中です。'
                  + '掲載中の体験はすべて準備中で、実際のお申し込みはまだ受け付けていません。';

    // ヘッダーのすぐ下に置く。ヘッダーが無いページは、いちばん上に
    var head = document.querySelector('.site-header');
    if (head && head.parentNode) head.parentNode.insertBefore(d, head.nextSibling);
    else document.body.insertBefore(d, document.body.firstChild);

    // 言語が変わったら、こちらも入れ替える
    if (window.TriArk.i18n && window.TriArk.i18n.onChange) {
      window.TriArk.i18n.onChange(function () {
        d.textContent = window.TriArk.i18n.t('trial.bar');
      });
      d.textContent = window.TriArk.i18n.t('trial.bar');
    }
  }

  if (showBar) {
    if (document.body) bar();
    else document.addEventListener('DOMContentLoaded', bar);
  }
})();
