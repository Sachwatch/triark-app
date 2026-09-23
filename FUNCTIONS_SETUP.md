# 自動翻訳の準備（最初の一度だけ）

サーバー側で動く小さなプログラム（Cloud Functions）を、Firebase に置く作業です。
ターミナルで triark-app フォルダに入ってから進めてください。

```
cd ~/Documents/triark-app
```

## 1. 翻訳の機能を使えるようにする

ブラウザで次を開き、プロジェクトが **TriArk-chat** になっていることを確認して「有効にする」を押します。

https://console.cloud.google.com/apis/library/translate.googleapis.com

## 2. firebase.json に1行加える

いまの firebase.json は `"hosting": { ... }` だけのはずです。
その外側に `"functions"` を足します（`hosting` の中ではありません）。

```json
{
  "hosting": {
    ...（いまの内容のまま）...
  },
  "functions": {
    "source": "functions"
  }
}
```

## 3. .gitignore に1行加える

```
functions/node_modules
```

## 4. 部品を取り寄せる

```
npm install --prefix functions
```

`functions/node_modules` という重いフォルダができます。これは共有しないファイルです。

## 5. Firebase に置く

```
firebase deploy --only functions
```

初回は「いくつかの機能を有効にしますか？」と英語で聞かれます。すべて **Yes** で進めてください。
5〜10分ほどかかります。最後に `Deploy complete!` と出れば成功です。

うまくいかないときは、そのメッセージをそのまま見せてください。
なお `node -v` が v20 以上である必要があります。

## 6. 試す

1. プロフィール画面で、自己紹介やホストの紹介文を書いて「保存する」
2. 画面の下にある「ほかの言語での見え方」で、言語を選ぶ
3. 数十秒後に「最新にする」を押すと、翻訳された文章が出ます

## あとから中身を直したとき

`functions/index.js` を直したら、もう一度 `firebase deploy --only functions` を実行します。
サイトのファイル（html や js）は、これまでどおり `firebase deploy --only hosting` です。

## 動きの記録を見る

```
firebase functions:log
```

## お金のこと

- 翻訳は月に50万文字まで無料。TriArk の規模なら、まず超えません
- 関数の実行も月200万回まで無料
- 置いたプログラムの保管に、月に数円かかることがあります
