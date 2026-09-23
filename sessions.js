/* ============================================================
   TriArk sessions — 開催日程の共通処理
   ------------------------------------------------------------
   日程は次の形で保存する。

     { start:'2026-09-20',      // 開始日
       end:  '2026-09-21',      // 終了日（日帰りなら start と同じ）
       startTime:'09:00',       // 集合（空なら未定）
       endTime:  '17:00',       // 解散（空なら未定）
       flexible: false }        // 時間は相談で決める

   以前の形式（'2026-09-20' という文字列の配列）も読めるようにしてある。
   ============================================================ */

/** 旧形式（文字列の配列）も新形式に揃える */
export function normalize(listing) {
  if (Array.isArray(listing.sessions) && listing.sessions.length) {
    return listing.sessions.slice().sort((a, b) => (a.start > b.start ? 1 : -1));
  }
  const old = listing.openDates || [];
  return old.slice().sort().map(d => ({
    start: d, end: d, startTime: '', endTime: '', flexible: false
  }));
}

/** 今日より前に終わる日程を落とす */
export function upcoming(sessions) {
  const today = new Date().toISOString().slice(0, 10);
  return sessions.filter(s => (s.end || s.start) >= today);
}

/** 泊数（日帰りなら 0） */
export function nightsOf(s) {
  if (!s.end || s.end === s.start) return 0;
  const a = new Date(s.start + 'T00:00:00');
  const b = new Date(s.end + 'T00:00:00');
  return Math.max(0, Math.round((b - a) / 86400000));
}

function dateLabel(str, lang) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ja-JP',
    { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
}
function shortLabel(str, lang) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'ja-JP',
    { month: 'short', day: 'numeric', weekday: 'short' });
}

/** 「9月20日(日) 日帰り・9:00集合 17:00解散」のような一行にする */
export function label(s, lang, t) {
  const n = nightsOf(s);
  const head = n === 0
    ? dateLabel(s.start, lang) + '　' + t('listing.dayTrip')
    : dateLabel(s.start, lang) + ' – ' + shortLabel(s.end, lang) +
      '　' + (lang === 'en' ? n + t('listing.nights') : n + t('listing.nights'));

  let time = '';
  if (s.flexible) {
    time = '　' + t('listing.flexibleShort');
  } else if (s.startTime || s.endTime) {
    const parts = [];
    if (s.startTime) parts.push(s.startTime + ' ' + t('listing.meet'));
    if (s.endTime)   parts.push(s.endTime   + ' ' + t('listing.leave'));
    time = '　' + parts.join(' / ');
  }
  return head + time;
}
