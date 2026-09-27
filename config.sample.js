/* ------------------------------------------------------------
   このファイルをコピーして config.js という名前で保存し、
   x の部分を自分の Firebase プロジェクトの値に置き換える。

   config.js は .gitignore に入れて GitHub には上げない。
   （公開しても致命的ではないが、プロジェクトを取り違えないための習慣）

   チャット課題（TriArk_chat-submit）と同じプロジェクトを使えば、
   あのとき作ったアカウントがそのまま使える。
   ------------------------------------------------------------ */

export const firebaseConfig = {
  apiKey: "x",
  authDomain: "x",
  projectId: "x",
  storageBucket: "x",
  messagingSenderId: "x",
  appId: "x"
};

/* 地図を埋め込むための鍵（Maps Embed API）。
   道のりを線で描くのに使う。無くてもページは動く（地図が簡易なものになるだけ）。

   この鍵はブラウザから見えるので、Google Cloud の「認証情報」で
   ウェブサイトの制限（https://triark-chat.web.app/*）を必ずかけること。
   制限をかけていれば、見えても他人には使えない。 */
export const mapsEmbedKey = "";
