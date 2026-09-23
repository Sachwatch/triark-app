/* ============================================================
   lightbox.js — 写真を押したら、画面いっぱいに出す
   ------------------------------------------------------------
     <script src="lightbox.js"></script>

   data-full="写真のURL" が付いた場所を押すと、
   切り取られていない写真を全体が見える大きさで表示する。
   あとから増えた写真にも効く（押された場所をその都度調べるため）。
   閉じ方：背景か × を押す、Esc を押す
   ============================================================ */
(function () {
  var css =
    '.lb-back{position:fixed;inset:0;z-index:2000;background:rgba(6,31,49,.92);' +
      'display:flex;align-items:center;justify-content:center;padding:24px;cursor:zoom-out}' +
    '.lb-back img{max-width:100%;max-height:100%;object-fit:contain;border-radius:2px}' +
    '.lb-close{position:fixed;top:16px;right:20px;width:40px;height:40px;border:none;border-radius:50%;' +
      'background:rgba(255,255,255,.14);color:#fff;font-size:20px;line-height:1;cursor:pointer}' +
    '.lb-close:hover{background:rgba(255,255,255,.26)}' +
    '[data-full]{cursor:zoom-in}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var back = null;

  function close() {
    if (!back) return;
    back.remove();
    back = null;
    document.body.style.overflow = '';
  }

  function open(url) {
    close();
    back = document.createElement('div');
    back.className = 'lb-back';
    back.innerHTML = '<img alt=""><button type="button" class="lb-close" aria-label="close">×</button>';
    back.querySelector('img').src = url;
    back.addEventListener('click', close);
    document.body.appendChild(back);
    document.body.style.overflow = 'hidden';
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-full]') : null;
    if (!el) return;
    // 写真の上にある「×」などのボタンは、そちらの動きを優先する
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    open(el.getAttribute('data-full'));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
