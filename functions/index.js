/* ============================================================
   TriArk — 自動翻訳（サーバー側で動く小さなプログラム）
   ------------------------------------------------------------
   仕組み
     1. 誰かがプロフィールや体験を保存する
     2. Firestore の変化をきっかけに、この関数が動く
     3. 書かれた文章の言語を判定し、ほかの言語に翻訳する
     4. 同じ書類の tr（translations）に書き戻す

   画面側は TriArk.i18n.pick(obj, field) で取り出すので、
   翻訳があれば見る人の言語で、無ければ書いた人の言葉のまま表示される。

   同じ内容を何度も翻訳しないよう、元の文章の指紋（trSrc）を持たせている。
   この関数自身の書き込みも、指紋が同じなのでそこで止まる（無限ループの防止）。
   ============================================================ */

const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { Translate } = require('@google-cloud/translate').v2;

admin.initializeApp();
setGlobalOptions({ region: 'asia-northeast1', maxInstances: 5 });

const translate = new Translate();

/* サイトで選べる言語。増やすときはここに足す（i18n.js と合わせる） */
const LANGS = ['ja', 'en'];

/* どの書類の、どの欄を翻訳するか
   text = ふつうの文章 / list = 文字列の配列（自分で足したキーワード） */
const FIELDS = {
  users   : { text: ['bio'], list: ['tags'] },
  hosts   : {
    text: ['headline', 'basedIn', 'intro'],
    // 配列の中の物（乗り物）。指定した項目だけ訳す
    objList: [{ field: 'vehicles', keys: ['name', 'note'] }]
  },
  listings: {
    text: ['title', 'area', 'description', 'destName', 'address'],
    // imageNotes は写真と同じ並び。空の場所も空のまま残す
    list: ['via', 'doList', 'included', 'bring', 'imageNotes']
  }
};

const MAX_CHARS = 12000;   // 1つの書類で翻訳にかける上限（使いすぎの歯止め）

function fingerprint(d, conf) {
  const parts = [];
  conf.text.forEach(f => parts.push(String(d[f] == null ? '' : d[f])));
  (conf.list || []).forEach(f => parts.push((Array.isArray(d[f]) ? d[f] : []).join('\u0001')));
  (conf.objList || []).forEach(o => {
    const arr = Array.isArray(d[o.field]) ? d[o.field] : [];
    parts.push(arr.map(x => o.keys.map(k => String(x[k] == null ? '' : x[k])).join('\u0001')).join('\u0001'));
  });
  const src = parts.join('\u0002');
  return { src, hash: crypto.createHash('sha1').update(src).digest('hex') };
}

/* 元の言語を判定する。いちばん長い文章を材料にする */
async function detectLang(d, conf) {
  let sample = '';
  conf.text.forEach(f => {
    const v = String(d[f] == null ? '' : d[f]).trim();
    if (v.length > sample.length) sample = v;
  });
  if (!sample) return '';
  try {
    const [res] = await translate.detect(sample.slice(0, 1000));
    const got = Array.isArray(res) ? res[0] : res;
    const code = String(got && got.language || '').slice(0, 2).toLowerCase();
    return LANGS.includes(code) ? code : code;   // 一覧にない言語でも、そのまま元の言語として扱う
  } catch (e) {
    logger.warn('言語の判定に失敗', e);
    return '';
  }
}

async function handle(collection, event) {
  const after = event.data && event.data.after;
  if (!after || !after.exists) return;            // 消された場合は何もしない

  const d = after.data() || {};
  const conf = FIELDS[collection];
  const { src, hash } = fingerprint(d, conf);

  if (d.trSrc === hash) return;                   // 文章が変わっていない（自分の書き込みもここで止まる）

  const plain = src.replace(/[\u0001\u0002]/g, '').trim();
  if (!plain) {                                   // 文章が空になった
    await after.ref.update({ tr: {}, trSrc: hash, srcLang: '' });
    return;
  }
  if (plain.length > MAX_CHARS) {
    logger.warn('長すぎるので翻訳しません', { collection, id: event.params.id, length: plain.length });
    await after.ref.update({ trSrc: hash });
    return;
  }

  const srcLang = await detectLang(d, conf);
  const targets = LANGS.filter(l => l && l !== srcLang);

  const tr = {};
  for (const lang of targets) {
    const out = {};
    try {
      for (const f of conf.text) {
        const v = String(d[f] == null ? '' : d[f]).trim();
        if (!v) continue;
        const [text] = await translate.translate(v, { from: srcLang || undefined, to: lang, format: 'text' });
        out[f] = text;
      }
      for (const f of (conf.list || [])) {
        /* 写真の一言メモのように、並び順に意味がある配列もある。
           空の場所は訳に出さず、元の場所に戻してから書き戻す */
        const src = Array.isArray(d[f]) ? d[f] : [];
        const at  = [];                       // 訳すものが、元の何番目だったか
        const arr = [];
        src.forEach((v, i) => {
          const s = String(v == null ? '' : v).trim();
          if (s) { at.push(i); arr.push(s); }
        });
        if (!arr.length) continue;
        const [res] = await translate.translate(arr, { from: srcLang || undefined, to: lang, format: 'text' });
        const got = Array.isArray(res) ? res : [res];
        const row = src.map(() => '');
        at.forEach((pos, k) => { row[pos] = got[k] == null ? '' : got[k]; });
        out[f] = row;
      }
      for (const o of (conf.objList || [])) {
        const arr = Array.isArray(d[o.field]) ? d[o.field] : [];
        if (!arr.length) continue;
        const rows = [];
        for (const item of arr) {
          const row = {};
          for (const k of o.keys) {
            const v = String(item[k] == null ? '' : item[k]).trim();
            if (!v) continue;
            const [text] = await translate.translate(v, { from: srcLang || undefined, to: lang, format: 'text' });
            row[k] = text;
          }
          rows.push(row);
        }
        if (rows.some(r => Object.keys(r).length)) out[o.field] = rows;
      }
    } catch (e) {
      logger.error('翻訳に失敗', { collection, lang, error: String(e) });
      continue;                                    // 一つの言語で失敗しても、ほかは続ける
    }
    if (Object.keys(out).length) tr[lang] = out;
  }

  await after.ref.update({
    tr,
    trSrc  : hash,
    srcLang: srcLang || '',
    trAt   : admin.firestore.FieldValue.serverTimestamp()
  });
  logger.info('翻訳しました', { collection, id: event.params.id, srcLang, langs: Object.keys(tr) });
}

exports.translateUser    = onDocumentWritten('users/{id}',    (e) => handle('users', e));
exports.translateHost    = onDocumentWritten('hosts/{id}',    (e) => handle('hosts', e));
exports.translateListing = onDocumentWritten('listings/{id}', (e) => handle('listings', e));
