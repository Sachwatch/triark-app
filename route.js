/* ============================================================
   route.js — 経路（出発地 → 行き先）の見せ方
   ------------------------------------------------------------
     import { routeHtml, mapsLink } from './route.js';

     box.innerHTML = routeHtml({
       type: 'sea',                    // land / sea / air
       from: '東京都東村山市',
       via : ['河口湖'],
       to  : '富士山'
     }, esc);

   ・陸・海・空で線の表情を変える（陸は実線、海は波線、空は点線）
   ・道路の経路ではなく「どこから、どこへ」を示すための図。
     実際の道のりは「Google マップで開く」からたどる

   将来：ホストを乗り継ぐ道のりも、この部品を並べて見せる
   ============================================================ */

const MARK = { land: '●', sea: '◆', air: '▲' };

/** 経路のHTMLを作る。esc は呼び出し側の文字エスケープ関数 */
export function routeHtml(r, esc) {
  const e = esc || ((s) => String(s == null ? '' : s));
  const type = r.type || 'land';
  const stops = []
    .concat(r.from ? [{ name: r.from, kind: 'from' }] : [])
    .concat((r.via || []).map(v => ({ name: v, kind: 'via' })))
    .concat(r.to ? [{ name: r.to, kind: 'to' }] : []);

  if (!stops.length) return '';

  return '<div class="route route-' + e(type) + '">' +
    stops.map((s, i) =>
      (i ? '<span class="route-line" aria-hidden="true"></span>' : '') +
      '<span class="route-stop ' + s.kind + '">' +
        '<span class="route-mark" aria-hidden="true">' + (MARK[type] || '●') + '</span>' +
        '<span class="route-name">' + e(s.name) + '</span>' +
      '</span>'
    ).join('') +
  '</div>';
}

/** Google マップで開くための住所（無ければ緯度経度） */
function point(name, lat, lng) {
  return (lat != null && lng != null) ? lat + ',' + lng : name;
}

/**
 * Google マップのリンク。
 * ・陸は経路（道順）として開く
 * ・海と空は道順が出ないので、行き先を地図で開く
 */
export function mapsLink(d) {
  const to = d.destName ? point(d.destName, d.destLat, d.destLng) : '';
  const from = d.address ? point(d.address, d.lat, d.lng) : '';

  if (!to) {
    return from ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(from) : '';
  }
  if ((d.type || 'land') !== 'land') {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(to);
  }
  let url = 'https://www.google.com/maps/dir/?api=1' +
            '&origin=' + encodeURIComponent(from) +
            '&destination=' + encodeURIComponent(to);
  const via = (d.via || []).filter(Boolean);
  if (via.length) url += '&waypoints=' + via.map(encodeURIComponent).join('%7C');
  return url;
}
