/* ============================================================
   TriArk listings-shared — 体験カードの共通処理
   一覧ページ・トップページの両方から使う
   ============================================================ */
import { db } from './auth.js';
import { collection, query, where, getDocs }
  from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
  ));
}

/** 公開中の体験をすべて読む（新しい順） */
export async function loadPublished() {
  const snap = await getDocs(
    query(collection(db, 'listings'), where('status', '==', 'published'))
  );
  const list = snap.docs.map(d => ({ id: d.id, data: d.data() }));
  list.sort((a, b) =>
    (b.data.createdAt?.seconds || 0) - (a.data.createdAt?.seconds || 0)
  );
  return list;
}

/** 体験カードのHTML（一覧・トップで共通） */
export function cardHtml(item, lang, t) {
  const d = item.data;
  const title = TriArk.i18n.pick(d, 'title').text || '';
  const area  = TriArk.i18n.pick(d, 'area').text || '';
  const desc  = TriArk.i18n.pick(d, 'description').text || '';
  const img   = (d.images && d.images[0]) ? d.images[0] : '';
  const fee   = d.price ? '¥' + Number(d.price).toLocaleString() : '';
  const to    = TriArk.i18n.pick(d, 'destName').text || '';
  const route = to ? esc(area || '') + ' → ' + esc(to) : esc(area || '');

  return '<a class="card" href="listing.html?id=' + esc(item.id) + '&lang=' + lang + '">' +
    '<div class="card-img"' + (img ? ' style="background-image:url(\'' + esc(img) + '\')"' : '') + '></div>' +
    '<div class="card-body">' +
      '<div class="loc">' + route + '</div>' +
      '<h3>' + esc(title) + '</h3>' +
      '<p>' + esc(desc.length > 90 ? desc.slice(0, 90) + '…' : desc) + '</p>' +
      '<div class="meta">' +
        '<span>' + t('listing.type.' + (d.type || 'land')) + '</span>' +
        '<span class="price">' + (fee ? t('listing.fee') + ' ' + fee : '') + '</span>' +
      '</div>' +
    '</div>' +
  '</a>';
}
