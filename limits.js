/* ============================================================
   limits.js — 入力欄の文字数制限とカウンター
   ------------------------------------------------------------
   使い方:
     <input id="headline" data-max="40">
     <textarea id="intro" data-max="5000" data-recommend="300"></textarea>
     <script src="limits.js"></script>   ← i18n.js の後に読み込む

   ・data-max       : 上限。これ以上は入力できない（maxlength も付ける）
   ・data-recommend : 目安の文字数。届いていないうちは「あと○字でおすすめの長さ」と出す
   ・欄のすぐ下に「12 / 40」のカウンターを出す。90%を超えると色が変わる

   JS から値を入れたとき（保存済みの内容を読み込んだときなど）は
   TriArk.limits.refresh() を呼ぶとカウンターが更新される。
   保存の前に TriArk.limits.check() を呼ぶと、上限を超えている欄があれば
   その欄にスクロールして false を返す（古いデータが長すぎる場合の保険）。
   ============================================================ */
(function () {
  window.TriArk = window.TriArk || {};

  var T = {
    ja: { over: '文字数の上限を超えています', rec: 'あと{n}字でおすすめの長さ' },
    en: { over: 'Over the character limit',   rec: '{n} more for a good length' }
  };
  function lang() {
    return (window.TriArk.i18n && window.TriArk.i18n.get()) || 'ja';
  }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }

  // 数え方は maxlength と同じ（value.length）にそろえる
  function count(el) { return (el.value || '').length; }

  // カウンターの見た目（ページごとの <style> がなくても動くようにここで入れる）
  var css =
    '.lim-count{display:flex;justify-content:flex-end;gap:10px;margin-top:5px;' +
      'font:12px/1.4 "Helvetica Neue",sans-serif;color:#8c9aa6;letter-spacing:.03em}' +
    '.lim-count .lim-rec{margin-right:auto;color:#8c9aa6}' +
    '.lim-count.near{color:#C97B3C}' +
    '.lim-count.over,.lim-count.over .lim-rec{color:#E8452B;font-weight:700}' +
    '.lim-over{border-color:#E8452B !important}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var fields = [];

  function render(f) {
    var n = count(f.el);
    var max = f.max;
    var box = f.box;
    box.classList.toggle('near', n >= max * 0.9 && n <= max);
    box.classList.toggle('over', n > max);
    f.el.classList.toggle('lim-over', n > max);

    var L = T[lang()] || T.ja;
    var rec = '';
    if (n > max) {
      rec = L.over;
    } else if (f.rec && n > 0 && n < f.rec) {
      rec = L.rec.replace('{n}', fmt(f.rec - n));
    }
    box.innerHTML =
      '<span class="lim-rec">' + rec + '</span>' +
      '<span>' + fmt(n) + ' / ' + fmt(max) + '</span>';
  }

  function attach(el) {
    if (el.__lim) return;
    var max = parseInt(el.getAttribute('data-max'), 10);
    if (!max) return;
    el.setAttribute('maxlength', String(max));
    var box = document.createElement('div');
    box.className = 'lim-count';
    el.insertAdjacentElement('afterend', box);
    var f = { el: el, box: box, max: max, rec: parseInt(el.getAttribute('data-recommend'), 10) || 0 };
    el.__lim = f;
    fields.push(f);
    el.addEventListener('input', function () { render(f); });
    render(f);
  }

  function scan() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-max]'), attach);
  }
  function refresh() {
    scan();
    fields.forEach(render);
  }
  function check() {
    refresh();
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (count(f.el) > f.max && f.el.offsetParent !== null) {
        f.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        f.el.focus();
        return false;
      }
    }
    return true;
  }

  window.TriArk.limits = { refresh: refresh, check: check };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }
  if (window.TriArk.i18n) window.TriArk.i18n.onChange(function () { fields.forEach(render); });
})();
