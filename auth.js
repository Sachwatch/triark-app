/* ============================================================
   TriArk auth — 全ページ共通の認証
   ------------------------------------------------------------
   使い方（HTML側）
     <script src="i18n.js"></script>
     <script type="module" src="auth.js"></script>

     ヘッダーに <div id="authNav"></div> を置くと、
     ログイン状態に応じて中身が差し替わる。

   使い方（JS側・モジュールから）
     import { onUser, signUp, logIn, logOut } from './auth.js';
     onUser(({ user, profile }) => { ... });   // 未ログインなら user は null

   注意
     このファイルは ES モジュールなので file:// では動かない。
     ローカルでは必ずサーバー経由で開くこと（VS Code の Live Server など）。
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


import { firebaseConfig } from "./config.js";

/* ---------- 起動 ---------- */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };

/* ---------- 状態 ---------- */
let currentUser = null;   // Firebase Authentication のユーザー
let profile     = null;   // Firestore の users/{uid}
let ready       = false;  // 最初の判定が終わったか
let unread      = 0;      // 未読の会話の数
let watchers    = [];     // 会話の見張りを止めるための関数たち
const listeners = [];

export function getUser()    { return currentUser; }
export function getProfile() { return profile; }
export function isReady()    { return ready; }

/** ログイン状態が決まった時・変わった時に呼ばれる関数を登録する */
export function onUser(fn) {
  if (typeof fn !== 'function') return;
  listeners.push(fn);
  if (ready) fn({ user: currentUser, profile: profile });
}

function notify() {
  listeners.forEach(fn => {
    try { fn({ user: currentUser, profile: profile }); }
    catch (e) { console.error('[auth] listener error', e); }
  });
}

/* ------------------------------------------------------------
   users/{uid} を用意する
   ・無ければ作る
   ・チャット課題で作った古い形式（role: 'guest'|'host'）なら
     新しい形式（isHost / currentMode）に移し替える
   ------------------------------------------------------------ */
async function ensureProfile(user, nameHint) {
  const ref  = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // users は「誰でも見てよい公開プロフィール」。メールなどはここに置かない
    const data = {
      name        : nameHint || user.displayName || '',
      photoURL    : user.photoURL || '',
      bio         : '',
      bio_en      : '',
      languages   : {},        // { ja:'native', en:'business' }
      languageCodes: [],       // 検索用
      isHost      : false,
      currentMode : 'guest',
      createdAt   : serverTimestamp(),
      updatedAt   : serverTimestamp()
    };
    await setDoc(ref, data);
    await saveContact(user);
    return data;

  }

  const data = snap.data();

  // 旧データの移行（一度だけ走る）
  if (data.isHost === undefined) {
    const patch = {
      isHost      : data.role === 'host',
      currentMode : data.role === 'host' ? 'host' : 'guest',
      bio         : data.bio    || '',
      bio_en      : data.bio_en || '',
      updatedAt   : serverTimestamp()
    };
    await updateDoc(ref, patch);
    Object.assign(data, patch);
    console.info('[auth] 旧形式のユーザーを新形式に移行しました');
  }

  // 既にアカウントがある人にも連絡先の置き場所を用意する
  await saveContact(user);

  return data;
}

/* 連絡先は本人しか読めない場所に置く。
   Firestore のルールは項目単位で読み取りを制限できないため、
   公開プロフィール（users）とは別のドキュメントに分けている。 */
async function saveContact(user) {
  try {
    await setDoc(
      doc(db, 'users', user.uid, 'private', 'contact'),
      { email: user.email || '', updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.warn('[auth] 連絡先の保存に失敗', e);
  }
}

/* ---------- 登録・ログイン・ログアウト ---------- */

export async function signUp(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  await ensureProfile(cred.user, name);
  return cred.user;
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut() {
  await signOut(auth);
}

/* ------------------------------------------------------------
   Firebase のエラーコードを、辞書のキーに変換する
   （画面には翻訳された文章を出したいので、コードのままでは使わない）
   ------------------------------------------------------------ */
export function errorKey(e) {
  const code = (e && e.code) ? e.code : '';
  switch (code) {
    case 'auth/email-already-in-use' : return 'auth.err.emailInUse';
    case 'auth/invalid-email'        : return 'auth.err.invalidEmail';
    case 'auth/weak-password'        : return 'auth.err.weakPassword';
    case 'auth/missing-password'     : return 'auth.err.required';
    case 'auth/user-not-found'       :
    case 'auth/wrong-password'       :
    case 'auth/invalid-credential'   : return 'auth.err.wrongLogin';
    case 'auth/too-many-requests'    : return 'auth.err.tooMany';
    case 'auth/network-request-failed': return 'auth.err.network';
    default                          : return 'auth.err.generic';
  }
}

/* ------------------------------------------------------------
   ヘッダーの表示を状態に合わせて差し替える
   <div id="authNav"> がある画面でだけ働く
   ------------------------------------------------------------ */
function t(key) {
  return (window.TriArk && window.TriArk.i18n) ? window.TriArk.i18n.t(key) : key;
}
function lang() {
  return (window.TriArk && window.TriArk.i18n) ? window.TriArk.i18n.get() : 'ja';
}

/* 未読の会話を数える。
   相手の最後の書き込みより自分が読んだ時刻が古ければ未読とみなす。 */
async function watchUnread(uid) {
  stopWatch();

  let roomIds = [];
  try {
    const [g, h] = await Promise.all([
      getDocs(query(collection(db, 'bookings'), where('guestId', '==', uid))),
      getDocs(query(collection(db, 'bookings'), where('hostId',  '==', uid)))
    ]);
    const seen = {};
    g.docs.concat(h.docs).forEach(d => {
      const rid = d.data().roomId;
      if (rid && !seen[rid]) { seen[rid] = true; roomIds.push(rid); }
    });
  } catch (e) {
    console.warn('[auth] 予約の取得に失敗', e);
    return;
  }

  const state = {};
  roomIds.forEach(rid => {
    const stop = onSnapshot(doc(db, 'rooms', rid), (snap) => {
      if (!snap.exists()) return;
      const r = snap.data();
      const mine = r.lastRead && r.lastRead[uid];
      state[rid] = !!(r.lastMessageAt && (!mine || r.lastMessageAt.seconds > mine.seconds));
      unread = Object.values(state).filter(Boolean).length;
      renderAuthNav();
    }, (e) => console.warn('[auth] 未読の取得に失敗', e));
    watchers.push(stop);
  });
}

function stopWatch() {
  watchers.forEach(fn => { try { fn(); } catch (e) {} });
  watchers = [];
}

function renderAuthNav() {
  const box = document.getElementById('authNav');
  if (!box) return;
  const q = '?lang=' + lang();

  if (!currentUser) {
    box.innerHTML =
      '<a href="listings.html' + q + '" data-i18n="nav.findListings">' + t('nav.findListings') + '</a>' +
      '<a href="hosts.html' + q + '" data-i18n="nav.findHosts">' + t('nav.findHosts') + '</a>' +
      '<a href="profile.html' + q + '&host=1" class="btn-outline" data-i18n="nav.host">' + t('nav.host') + '</a>' +
      '<a href="login.html' + q + '" data-i18n="nav.login">' + t('nav.login') + '</a>' +
      '<a href="login.html' + q + '&mode=signup" class="btn-fill" data-i18n="nav.signup">' + t('nav.signup') + '</a>';
    markCurrent(box);
    return;
  }

  const name = displayName(
    (profile && profile.name) || currentUser.displayName || currentUser.email || ''
  );
  const findLink =
    '<a href="listings.html' + q + '" data-i18n="nav.findListings">' + t('nav.findListings') + '</a>' +
    '<a href="hosts.html' + q + '" data-i18n="nav.findHosts">' + t('nav.findHosts') + '</a>';
  // ホストなら「自分の体験」、まだなら「ホストになる」
  const hostLink = (profile && profile.isHost)
    ? '<a href="my-listings.html' + q + '" data-i18n="nav.myListings">' + t('nav.myListings') + '</a>'
    : '<a href="profile.html' + q + '&host=1" class="btn-outline" data-i18n="nav.host">' + t('nav.host') + '</a>';

  const dot = unread
    ? '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;' +
      'background:#E8452B;margin-left:7px;vertical-align:middle"></span>'
    : '';

  box.innerHTML =
    findLink +
    '<a href="messages.html' + q + '" data-i18n="nav.messages">' + t('nav.messages') + dot + '</a>' +
    '<a href="my-bookings.html' + q + '" data-i18n="nav.bookings2">' + t('nav.bookings2') + '</a>' +
    hostLink +
    // 名前を押すと自分のプロフィールへ
    '<a href="profile.html' + q + '" class="auth-name">' + escapeHtml(name) + '</a>' +
    '<button type="button" id="logoutBtn" class="btn-fill" data-i18n="nav.logout">' + t('nav.logout') + '</button>';

  markCurrent(box);

  const btn = document.getElementById('logoutBtn');
  if (btn) {
    btn.addEventListener('click', async () => {
      await logOut();
      location.href = 'index.html?lang=' + lang();
    });
  }
}

/* いま開いている画面のリンクに印を付ける（ヘッダーで色が変わる） */
function markCurrent(box) {
  const here = (location.pathname.split('/').pop() || 'index.html');
  box.querySelectorAll('a[href]').forEach(a => {
    const base = a.getAttribute('href').split('?')[0];
    a.classList.toggle('current', base === here
      && !a.classList.contains('btn-fill') && !a.classList.contains('btn-outline'));
  });
}

/* 表示名を短くする
   ・空白で区切った最初の一語だけを使う（「山田 花子」→「山田」、"test guest"→"test"）
   ・日本語なら「さん」を付ける。英語は付けない
   ・メールアドレスしか無い場合は @ の前まで */
function displayName(full) {
  var s = String(full || '').trim();
  if (!s) return '';
  if (s.indexOf('@') !== -1) s = s.split('@')[0];
  var first = s.split(/[\s\u3000]+/)[0];
  return first + t('user.nameSuffix');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));
}

/* ---------- 監視の開始 ---------- */
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  profile = null;

  if (user) {
    try { profile = await ensureProfile(user); }
    catch (e) { console.error('[auth] プロフィール取得に失敗', e); }
    watchUnread(user.uid);
  } else {
    stopWatch();
    unread = 0;
  }

  ready = true;
  renderAuthNav();
  notify();
});

// 言語が切り替わったらヘッダーも書き直す
if (window.TriArk && window.TriArk.i18n) {
  window.TriArk.i18n.onChange(renderAuthNav);
}
