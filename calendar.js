/* ============================================================
   calendar.js — 開催できる日を月のカレンダーで見せる
   ------------------------------------------------------------
     import { mountCalendar } from './calendar.js';

     const cal = mountCalendar(document.getElementById('cal'), {
       sessions,                 // sessions.js の normalize/upcoming を通した日程
       onPick: (session, dateStr) => { ... }   // 空いている日を押したとき
     });

   ホスト側（日程を入れる画面）は編集の形で使う。
     mountCalendar(box, {
       sessions,
       mode  : 'edit',                  // 今日以降のすべての日が押せる
       onDay : (dateStr, index) => {}   // index は、その日を含む日程の番号（無ければ null）
     });
     cal.setPending('2026-09-24');      // 「開始日を選んだ」印（次の押下で範囲が決まる）
     cal.refresh();              // 言語を切り替えたときなど
     cal.setSessions(newList);

   ・日程の初日から最終日までを「空いている日」として色を付ける
   ・押すと、その日を含む日程を onPick に渡す
   ・前後の月へは ‹ › で移動できる（日程のある範囲だけ）
   ============================================================ */

const DAY = 86400000;

function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
         '-' + String(d.getDate()).padStart(2, '0');
}
function parse(str) { return new Date(str + 'T00:00:00'); }

/** 一つの日程が占める日付（初日から最終日まで）を並べる */
function daysOf(s) {
  const out = [];
  const a = parse(s.start);
  const b = parse(s.end || s.start);
  for (let t = a.getTime(); t <= b.getTime(); t += DAY) out.push(ymd(new Date(t)));
  return out;
}

export function mountCalendar(box, opts) {
  const t = (k) => (window.TriArk && window.TriArk.i18n) ? window.TriArk.i18n.t(k) : k;
  const lang = () => (window.TriArk && window.TriArk.i18n) ? window.TriArk.i18n.get() : 'ja';

  let sessions = opts.sessions || [];
  let shown = null;              // 表示している月（その月の1日）
  let pending = null;            // 編集のとき、開始日として選んだ日
  const edit = opts.mode === 'edit';

  function map() {
    const m = {};
    sessions.forEach((s, i) => daysOf(s).forEach(d => { if (m[d] === undefined) m[d] = i; }));
    return m;
  }

  function range() {
    const keys = Object.keys(map()).sort();
    const today = new Date();
    const first = keys.length ? parse(keys[0]) : today;
    const last  = keys.length ? parse(keys[keys.length - 1]) : today;
    // 編集のときは、今日から2年先まで自由に動かせる
    const to = edit
      ? new Date(today.getFullYear() + 2, today.getMonth(), 1)
      : new Date(Math.max(last.getTime(), today.getTime()));
    return {
      from: new Date(Math.min(first.getTime(), today.getTime())),
      to  : to
    };
  }

  function monthStart(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function sameMonth(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  function render() {
    const days = map();
    const r = range();
    if (!shown) {
      // 最初は「今日」か、いちばん近い日程の月を出す
      const keys = Object.keys(days).sort();
      const today = ymd(new Date());
      const next = keys.find(k => k >= today);
      shown = monthStart(next ? parse(next) : new Date());
    }

    const L = lang() === 'en' ? 'en-US' : 'ja-JP';
    const head = shown.toLocaleDateString(L, { year: 'numeric', month: 'long' });

    // 曜日の見出し（日曜はじまり）
    const wd = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(2026, 1, 1 + i);          // 2026-02-01 は日曜
      wd.push(d.toLocaleDateString(L, { weekday: 'short' }));
    }

    const first = new Date(shown.getFullYear(), shown.getMonth(), 1);
    const start = new Date(first.getTime() - first.getDay() * DAY);
    const today = ymd(new Date());

    let cells = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getTime() + i * DAY);
      const key = ymd(d);
      const out  = !sameMonth(d, shown);
      const open = days[key] !== undefined && key >= today;
      const past = key < today;
      const cls = ['cal-day'];
      if (out) cls.push('out');
      if (past && !out) cls.push('past');
      if (open && !out) cls.push('open');
      if (key === today && !out) cls.push('today');
      if (edit && key === pending && !out) cls.push('pending');
      // 閲覧のときは空いている日だけ、編集のときは今日以降のすべての日が押せる
      const clickable = !out && (edit ? !past : open);
      cells += clickable
        ? '<button type="button" class="' + cls.join(' ') + '" data-date="' + key + '">' + d.getDate() + '</button>'
        : '<span class="' + cls.join(' ') + '">' + d.getDate() + '</span>';
      // 6週目が全部前後の月なら描かない
      if (i === 34 && !sameMonth(new Date(start.getTime() + 35 * DAY), shown)) break;
    }

    const canPrev = monthStart(r.from) < shown;
    const canNext = monthStart(r.to)   > shown;

    box.innerHTML =
      '<div class="cal">' +
        '<div class="cal-head">' +
          '<button type="button" class="cal-nav" data-go="-1"' + (canPrev ? '' : ' disabled') + ' aria-label="prev">‹</button>' +
          '<span class="cal-month">' + head + '</span>' +
          '<button type="button" class="cal-nav" data-go="1"' + (canNext ? '' : ' disabled') + ' aria-label="next">›</button>' +
        '</div>' +
        '<div class="cal-grid cal-wd">' + wd.map(w => '<span>' + w + '</span>').join('') + '</div>' +
        '<div class="cal-grid cal-days">' + cells + '</div>' +
        '<p class="cal-legend"><span class="cal-dot"></span>' +
          t(edit ? 'cal.openEdit' : 'cal.open') +
          (edit && pending ? '<span class="cal-dot pending"></span>' + t('cal.pendingDot') : '') +
        '</p>' +
      '</div>';

    box.querySelectorAll('.cal-nav').forEach(b => b.addEventListener('click', () => {
      shown = new Date(shown.getFullYear(), shown.getMonth() + Number(b.dataset.go), 1);
      render();
    }));
    box.querySelectorAll('button.cal-day').forEach(b => b.addEventListener('click', () => {
      const key = b.dataset.date;
      const idx = map()[key];
      if (edit) {
        if (opts.onDay) opts.onDay(key, idx === undefined ? null : idx);
      } else {
        const s = sessions[idx];
        if (s && opts.onPick) opts.onPick(s, key);
      }
    }));
  }

  render();
  return {
    refresh: render,
    setPending(dateStr) { pending = dateStr || null; render(); },
    getPending() { return pending; },
    // 表示している月は保ったまま中身だけ描き直す
    update(list) { if (list) sessions = list; render(); },
    setSessions(list) { sessions = list || []; shown = null; render(); }
  };
}
