/* ============================================================
   TriArk i18n — 全ページ共通の日英切替
   ------------------------------------------------------------
   使い方（HTML側）
     <script src="i18n.js"></script>   ← </body> の直前、ページ固有スクリプトより前

     文言を出す場所：  <span data-i18n="nav.about"></span>
     属性に入れる場合：<input data-i18n-attr="placeholder:auth.email">
     ページタイトル：  <title data-i18n="page.home.title">...</title>

     既存の <span class="lang-ja"> / <span class="lang-en"> も
     そのまま動く（body に .en が付く方式を維持している）。

   使い方（JS側）
     TriArk.i18n.get()            現在の言語 'ja' | 'en'
     TriArk.i18n.set('en')        切り替える
     TriArk.i18n.t('nav.about')   文言を取り出す
     TriArk.i18n.onChange(fn)     切替時に呼ばれる関数を登録（初回も呼ばれる）
   ============================================================ */

window.TriArk = window.TriArk || {};

(function () {
  'use strict';

  var STORAGE_KEY = 'triark-lang';
  var DEFAULT_LANG = 'ja';
  var LANGS = ['ja', 'en'];

  /* ----------------------------------------------------------
     辞書
     キーは「画面.要素」の形で付ける。
     ここに無い文言は画面に直接書かない、を原則にする。
     ---------------------------------------------------------- */
  var DICT = {
    ja: {
      'brand.tagline'        : '旅が、人生になる。',

      'nav.about'            : 'TriArkについて',
      'nav.journey'          : '旅をする',
      'nav.host'             : 'ホストになる',
      'nav.faq'              : 'よくある質問',
      'nav.contact'          : 'お問い合わせ',
      'url.contact'          : 'https://docs.google.com/forms/d/e/1FAIpQLSe4w1Ns2umfjGUmAGtW71A3MjeCJPjIinfujVu2U_DmfvhoBA/viewform',
      'nav.home'             : 'トップへ戻る',
      'nav.login'            : 'ログイン',
      'nav.signup'           : '新規登録',
      'nav.logout'           : 'ログアウト',
      'nav.mypage'           : 'マイページ',
      'nav.messages'         : 'メッセージ',
      'nav.bookings'         : '予約',
      'nav.favorites'        : 'お気に入り',
      'nav.switchToHost'     : 'ホストモードへ',
      'nav.switchToGuest'    : 'ゲストモードへ',

      'auth.login'           : 'ログイン',
      'auth.signup'          : '新規登録',
      'auth.email'           : 'メールアドレス',
      'auth.password'        : 'パスワード',
      'auth.name'            : 'お名前',
      'auth.googleLogin'     : 'Googleで続ける',
      'auth.toSignup'        : 'アカウントをお持ちでない方',
      'auth.toLogin'         : 'すでにアカウントをお持ちの方',
      'auth.logoutDone'      : 'ログアウトしました',
      'user.nameSuffix'      : 'さん',
      'auth.namePh'          : '山田 花子',
      'auth.emailPh'         : 'you@example.com',
      'auth.passwordPh'      : '6文字以上',
      'auth.signupLead'      : 'アカウントは一つ。旅する人にも、迎える人にもなれます。',
      'auth.loginLead'       : 'おかえりなさい。',
      'auth.tabLogin'        : 'ログイン',
      'auth.tabSignup'       : '新規登録',
      'auth.processing'      : '処理中…',
      'auth.err.required'    : '未入力の項目があります。',
      'auth.err.emailInUse'  : 'このメールアドレスは既に登録されています。ログインをお試しください。',
      'auth.err.invalidEmail': 'メールアドレスの形式が正しくありません。',
      'auth.err.weakPassword': 'パスワードは6文字以上にしてください。',
      'auth.err.wrongLogin'  : 'メールアドレスまたはパスワードが違います。',
      'auth.err.tooMany'     : '試行回数が多すぎます。しばらく待ってからお試しください。',
      'auth.err.network'     : '通信に失敗しました。接続を確認してください。',
      'auth.err.generic'     : 'エラーが発生しました。もう一度お試しください。',

      'booking.inquiry'      : '問い合わせ中',
      'booking.requested'    : '承認待ち',
      'booking.confirmed'    : '予約確定',
      'booking.declined'     : '見送り',
      'booking.cancelled'    : 'キャンセル',

      'sys.booking_inquiry'  : '問い合わせが始まりました。',
      'sys.booking_requested': 'ゲストが予約をリクエストしました。',
      'sys.booking_confirmed': '予約が確定しました。',
      'sys.booking_declined' : 'ホストがこの予約を見送りました。',
      'sys.booking_cancelled': 'この予約はキャンセルされました。',

      'common.send'          : '送信',
      'common.save'          : '保存する',
      'common.cancel'        : 'キャンセル',
      'common.back'          : '戻る',
      'common.loading'       : '読み込み中…',
      'bi.help'              : '英語を空にしておくと、英語で見た人には日本語がそのまま表示されます。',
      'detail.route'         : '経路',
      'detail.openMaps'      : 'Google マップで開く',
      'veh.title'            : 'あなたの Ark',
      'veh.help'             : 'あなたが旅を運ぶもの。陸なら車、海なら船、空なら飛行機。一度ここに入れておけば、すべての体験ページに出ます。体験ごとに入れ直す必要はありません。',
      'veh.add'              : 'Ark を足す',
      'veh.namePh.land'      : '車種（例：ハイエース キャンピング仕様）',
      'veh.namePh.sea'       : '船の種類（例：プレジャーボート 24ft）',
      'veh.namePh.air'       : '機体（例：セスナ172）',
      'veh.notePh.land'      : 'ひとこと（例：4人まで。シンクと冷蔵庫、ルーフテントつき）',
      'veh.notePh.sea'       : 'ひとこと（例：6人まで。トイレと日よけつき。レンタルのため写真と異なる場合があります）',
      'veh.notePh.air'       : 'ひとこと（例：3人まで。遊覧飛行に使っています）',
      'veh.addPhotos'        : '写真を足す',
      'veh.common'           : '各体験に共通して表示する写真',
      'veh.commonHelp'       : 'どの体験にも出したい写真を、ここに一度だけ入れておきます。体験ごとに入れ直さずに済みます。'
                               + '体験ページの写真の最後に並びます。12枚まで。',
      'veh.uploading'        : '写真をアップロードしています…',
      'veh.uploaded'         : '写真を追加しました。保存を忘れずに。',
      'veh.full'             : 'これ以上は追加できません。',
      'veh.of'               : '{name}さんの Ark',
      'veh.hostVehicle'      : 'このホストの Ark',
      'veh.hostGallery'      : 'このホストの旅',

      /* ---- 資格・登録・保険 ----
         法令で許可や登録が要る体験では、ここに書いたものが信頼の根拠になる。
         TriArk が保証するものではないので、断り書きを必ず添えること */
      'cert.title'           : '資格・登録・保険',
      'cert.help'            : 'お持ちの免許・事業登録・保険を書いておけます。ゲストはここを見て、誰とどんな備えで出かけるのかを確かめます。'
                               + '番号は、発行した役所の名前と一緒に書いてください（例：群馬県知事 第123号）。10件まで。',
      'cert.add'             : '項目を足す',
      'cert.noPh'            : '発行者と番号（例：群馬県知事 第123号）',
      'cert.expPh'           : '有効期限（任意）',
      'cert.expOf'           : '有効期限 {d}',
      'cert.note'            : 'お金をいただいて人を乗せる場合、陸でも海でも、法律で許可や登録が必要になることがあります。'
                               + 'ご自身の体験にどれが必要かは、管轄の運輸支局または都道府県の窓口にご確認ください（無料です）。',
      'cert.insConfirm'      : '加入している保険について、この使い方で同乗者が補償されるかを保険会社に確認しました',
      'cert.insConfirmHelp'  : '自動車保険には「日常・レジャー」「通勤・通学」「業務」の区分があり、申告と実態が違うと、事故のときに補償されないことがあります。'
                               + '「使用目的の区分はこれで合っているか」「ガイドの一環でお客様を乗せているときの事故は補償されるか」の二点を、保険会社にご確認ください。',
      'cert.insConfirmedLabel' : '保険の適用範囲を保険会社に確認済み',
      'cert.disclaimer'      : 'ここに表示している内容は、ホストご本人が記載したものです。TriArk は記載を保証するものではなく、'
                               + '内容および有効性の管理はホストご自身の責任で行われています。',
      'cert.k.license2'      : '第二種運転免許',
      'cert.k.taxiBiz'       : '一般乗用旅客自動車運送事業（許可）',
      'cert.k.charterBiz'    : '一般貸切旅客自動車運送事業（許可）',
      'cert.k.jikayou'       : '自家用有償旅客運送（登録）',
      'cert.k.rentacar'      : '自家用自動車有償貸渡業・レンタカー（許可）',
      'cert.k.boatLic'       : '小型船舶操縦士',
      'cert.k.boatTokutei'   : '特定操縦免許',
      'cert.k.futeiki'       : '一般不定期航路事業（登録）',
      'cert.k.ryokakuFutei'  : '旅客不定期航路事業（許可）',
      'cert.k.yugyosen'      : '遊漁船業（登録）',
      'cert.k.guideNat'      : '全国通訳案内士',
      'cert.k.guideLocal'    : '地域通訳案内士',
      'cert.k.insCar'        : '自動車保険（任意保険）',
      'cert.k.insBoat'       : '船客傷害保険',
      'cert.k.insLiability'  : '賠償責任保険',
      'cert.k.other'         : 'その他',
      'cert.insTitle'        : '自動車保険の確認',
      'sea.title'            : 'この船でお客様を乗せるための登録',
      'sea.todo'             : 'あと少し',
      'sea.done'             : '揃いました',
      'sea.pickBiz'          : '事業の登録を選ぶ',
      'sea.bizNoPh'          : '登録番号（例：群馬県知事 第123号）',
      'sea.licNoPh'          : '免許証番号',
      'sea.ins'              : '船客傷害保険に加入しています',
      'sea.insShort'         : '加入',
      'sea.note'             : 'お金をいただいて船にお客様を乗せるには、法律でこれらが必要です。揃うまで、この船の体験は公開できません（下書きの保存はできます）。',
      'sea.need.biz'         : '事業の登録',
      'sea.need.lic'         : '特定操縦免許',
      'sea.need.ins'         : '船客傷害保険',
      'sea.need.none'        : '海の Ark の登録',
      'req.must'             : '必須',
      'req.pub'              : '公開に必要',
      'ready.ok'             : 'この体験は公開できます。',
      'ready.todo'           : '公開までに、あと{n}つ',
      'ready.title'          : 'タイトル',
      'ready.desc'           : '説明',
      'ready.do'             : 'やること',
      'ready.sea'            : '船の登録（プロフィールの Ark）',
      'listing.needSea'      : '海の体験を公開するには、プロフィールの Ark に次のものが必要です：{list}',
      'listing.needDesc'     : '説明文を入力してください。どんな体験なのかが読み取れないと公開できません。',
      'listing.needDo'       : '「当日やること」を1つ以上入力してください。',
      'listing.pickup'       : '送迎',
      'listing.pickupOn'     : 'この体験では、私の車でお客様を送迎します',
      'listing.pickupHelp'   : '駅や宿から体験の場所までお送りする場合はチェックしてください。体験ページに、自家用車を使うことと、道路運送法上の許可を要しない運送である旨が自動で表示されます。'
                               + '送迎は無償です。体験料はあくまで案内の対価で、送迎の有無で料金を変えることはできません。'
                               + '料金の内訳に「ガソリン代」「送迎代」と書くこともできません。',
      'listing.pickupNote'   : 'この体験では、ホストの自家用自動車による送迎があります。'
                               + 'ガイドに付随するもので、道路運送法上の許可又は登録を要しない運送です。送迎は無償で、体験料に送迎分は含まれていません。',

      'cal.open'             : '空いている日',
      'cal.openEdit'         : '開催できる日',
      'cal.pendingDot'       : '開始日',
      'cal.hintEdit'         : '日を押すと開始日になります。もう一度同じ日を押すと日帰り、あとの日を押すと泊まりの日程になります。色のついた日をもう一度押すと取り消せます。',
      'cal.hintPending'      : '開始日を選びました。日帰りならもう一度同じ日を、泊まりなら最終日を押してください。',
      'cal.hint'             : '色のついた日を押すと、その日で問い合わせできます。',
      'common.jaOnly'        : 'この内容は日本語のみです',
      'common.enOnly'        : 'この内容は英語のみです',

      'page.home.title'      : 'TriArk — 旅が、人生になる。',
      'page.about.title'     : 'TriArkについて — 旅が、人生になる。',
      'page.login.title'     : 'ログイン — TriArk',
      'page.host.title'      : 'ホストプロフィール — TriArk',

      'host.editTitle'       : 'ホストプロフィール',
      'host.editLead'        : 'あなたが何者で、どんな時間を届けられるのか。ここは長く書ける場所です。',
      'host.headline'        : '一行の肩書き',
      'host.headlinePh'      : '箱根の山を30年歩いてきた案内人',
      'host.headlineHelp'    : 'ゲストが最初に目にする一行です。',
      'host.intro'           : '紹介文',
      'host.introPh'         : 'これまでのこと、案内できること、大切にしていること。長くて構いません。',
      'host.introHelp'       : 'たっぷり書いてかまいません（5,000字まで）。300字以上あると、ゲストがあなたを選びやすくなります。改行はそのまま表示されます。',
      'limit.over'           : '文字数の上限を超えている欄があります。赤くなっている欄を短くしてください。',
      'host.basedIn'         : '拠点',
      'host.basedInPh'       : '神奈川・箱根',
      'host.languages'       : '案内できる言語',
      'host.jaFields'        : '日本語',
      'host.enFields'        : 'English',
      'host.saved'           : '保存しました。',
      'host.saveFailed'      : '保存できませんでした。もう一度お試しください。',
      'host.needLogin'       : 'ホストプロフィールを書くにはログインが必要です。',
      'host.becomeHost'      : 'ホストとして登録する',
      'host.hostSince'       : 'ホスト歴',
      'host.notFound'        : 'このホストはまだ紹介文を書いていません。',
      'host.photosLater'     : '写真の登録は次の段階で追加します。',

      'lang.ja'              : '日本語',
      'lang.en'              : '英語',
      'lang.zh'              : '中国語',
      'lang.ko'              : '韓国語',
      'lang.fr'              : 'フランス語',
      'lang.es'              : 'スペイン語',
      'lang.other'           : 'その他',

      'host.languagesHelp'   : 'ホスト本人が話せる言語と、その水準を選んでください。同伴するのはあなた自身です。',
      'level.native'         : '母語',
      'level.fluent'         : '流暢',
      'level.business'       : 'ビジネス',
      'level.conversational' : '日常会話',
      'level.beginner'       : '初級',

      'page.listingEdit.title': '体験を登録する — TriArk',
      'page.myListings.title' : '自分の体験 — TriArk',

      'nav.myListings'       : '自分の体験',

      'listing.newTitle'     : '体験を登録する',
      'listing.editTitle'    : '体験を編集する',
      'listing.lead'         : 'あなたが案内できる時間を、一つの体験として登録します。',
      'listing.type'         : '種別',
      'listing.type.land'    : '陸',
      'listing.type.sea'     : '海',
      'listing.type.air'     : '空',
      'listing.type.landDesc': '車・徒歩・鉄道など',
      'listing.type.seaDesc' : '船・クルーズなど',
      'listing.type.airDesc' : '空からの体験',
      'listing.title'        : 'タイトル',
      'listing.titlePh'      : '軽ワゴンで巡る、関東の道の駅二泊三日',
      'listing.area'         : 'エリア',
      'listing.areaPh'       : '神奈川・箱根',
      'listing.description'  : '説明',
      'listing.descriptionPh': 'どんな時間になるのか。何を見て、何を食べて、何を持ち帰るのか。',
      'listing.price'        : '体験料（一人あたり・円）',
      'listing.fee'          : '体験料',
      'listing.feeNote'      : '体験そのものへの対価です。',
      'listing.capacity'     : '最大人数',
      'listing.images'       : '写真',
      'listing.imagesHelp'   : '1枚目が、体験の一覧と詳細の先頭に出ます。並べ替えたいときは、いったん消して入れ直してください。10枚まで。写真ごとに一言そえると、旅の様子が伝わります。',
      'listing.photoNote'    : '一言そえる（任意）',
      'listing.coverTag'     : '表紙',
      'listing.address'      : '出発地の住所',
      'listing.addressPh'    : '神奈川県足柄下郡箱根町湯本',
      'listing.addressHelp'  : '地図で示す場所と、天気の取得に使います。番地まで入れなくても構いません。駅名や施設名でも構いません。',
      'listing.jmaArea'      : '警報を見る地域',
      'listing.jmaAreaHelp'  : '気象庁の警報・注意報は、この地域の発表を見ます。出発地の都道府県を選んでください。',
      'listing.jmaPick'      : '選んでください',
      'listing.jmaCity'      : '市区町村',
      'listing.jmaCityAll'   : '都道府県全体で見る',
      'listing.jmaAuto'      : '出発地から自動で選びました。違っていれば選び直してください。',

      'wx.clear'             : '晴れ',
      'wx.partly'            : '晴れときどき曇り',
      'wx.cloudy'            : '曇り',
      'wx.fog'               : '霧',
      'wx.drizzle'           : '小雨',
      'wx.rain'              : '雨',
      'wx.showers'           : 'にわか雨',
      'wx.snow'              : '雪',
      'wx.thunder'           : '雷雨',
      'wx.unknown'           : '—',
      'wx.wind'              : '風',
      'wx.loading'           : '天気を確認しています…',
      'wx.failed'            : '天気を取得できませんでした',
      'wx.source'            : '天気：Open-Meteo／警報：気象庁',

      'alert.none'           : '警報・注意報は出ていません',
      'alert.loading'        : '警報を確認しています…',
      'alert.failed'         : '警報情報を取得できませんでした',
      'alert.advisory'       : '注意報が出ています',
      'alert.warning'        : '警報が出ています',
      'alert.emergency'      : '特別警報が出ています',
      'alert.judge'          : '催行の可否は、この公式情報を基にホストが判断します。',
      'alert.watch'          : 'この体験に関わるもの',

      'listing.addressEnPh'  : 'Katsudoki Marina, Chuo-ku, Tokyo',
      'listing.addressEnHelp': '英語でも集合場所が分かるように書いてください。空のままだと、英語で見た人には日本語の表記が出ます。',
      'listing.locate'       : '地図で確認',
      'listing.locating'     : '探しています…',
      'listing.locateFailed' : '見つかりませんでした。住所を短くするか、別の書き方でお試しください。',
      'listing.locateOk'     : 'この場所で登録します。',
      'listing.coordsManual' : '座標を直接入力する',
      'listing.lat'          : '緯度',
      'listing.lng'          : '経度',
      'listing.imagesLocal'  : 'imagesフォルダの写真は images/xxx.jpg のように書けます。',
      'listing.status'       : '公開状態',
      'listing.status.draft' : '下書き',
      'listing.status.published':'公開中',
      'listing.status.closed': '受付終了',
      'listing.saveDraft'    : '下書きとして保存',
      'listing.publish'      : '公開する',
      'listing.saved'        : '保存しました。',
      'listing.saveFailed'   : '保存できませんでした。',
      'listing.needTitle'    : 'タイトルを入力してください。',
      'listing.needHost'     : '体験を登録するには、先にホストプロフィールを保存してください。',
      'listing.mineTitle'    : '自分の体験',
      'listing.mineEmpty'    : 'まだ体験を登録していません。',
      'listing.addNew'       : '体験を登録する',
      'listing.edit'         : '編集',
      'listing.delete'       : '削除',
      'listing.deleteConfirm': 'この体験を削除します。取り消せません。よろしいですか。',
      'page.hosts.title'     : 'ホストを探す — TriArk',
      'nav.findHosts'        : 'ホストを探す',

      'page.profile.title'   : 'プロフィール — TriArk',
      'profile.title'        : 'プロフィール',
      'profile.lead'         : '旅をする人としても、ホストとしても、ここがあなたの顔になります。',
      'profile.photoPick'    : '写真を選ぶ',
      'profile.photoChange'  : '写真を変える',
      'profile.photoRemove'  : '写真を外す',
      'profile.photoHelp2'   : '顔がわかる写真がおすすめです。正方形に切り抜いて保存します。',
      'profile.photoPending' : '「保存する」を押すと写真が反映されます。',
      'profile.photoFormat'  : 'この写真は読み込めませんでした。JPEG か PNG の写真を選んでください。',
      'profile.photoFailed'  : '写真をアップロードできませんでした。時間をおいてもう一度お試しください。',
      'profile.name'         : '名前',
      'profile.nameHelp'     : 'サイト上では最初の一語で表示されます（例：山田 花子 → 山田さん）。',
      'profile.needName'     : '名前を入力してください。',
      'profile.bio'          : '自己紹介',
      'profile.bioPh'        : 'どんな人で、どんな旅が好きか。ホストやゲストがあなたを知る手がかりになります。',
      'profile.languages'    : '話せる言語',
      'profile.tagsPh'       : '自分の言葉で足す（例：ジャズ喫茶、渓流釣り）',
      'profile.tagsHelp'     : '上から選ぶほかに、入力して Enter で自由に足せます。10個まで、1つ20字まで。',
      'profile.tagsFull'     : 'キーワードは10個までです。外すときは × を押してください。',
      'profile.anyLang'      : '文章はどの言語で書いてもかまいません。ほかの言語で見る人には、自動で翻訳して表示します（翻訳はまもなく対応）。',
      'profile.hostInviteTitle': 'ホストになりませんか',
      'profile.hostInviteText' : '陸・海・空。あなたの乗り物と好きなことで、誰かの旅をつくってみませんか。',
      'profile.hostOpen'     : 'ホストとしての紹介を書く',
      'profile.hostTitle'    : 'ホストとしての紹介',
      'profile.viewMine'     : '公開されている自分のプロフィールを見る',
      'profile.notFound'     : 'このプロフィールは見つかりませんでした。',
      'profile.trTitle'      : 'ほかの言語での表示',
      'profile.trHelp'       : '保存すると、書いた文章が自動で翻訳されます。反映まで数十秒かかることがあります。',
      'profile.trPending'    : 'まだ翻訳が用意されていません。少し待ってから「最新にする」を押してください。',
      'profile.trReload'     : '最新にする',
      'profile.trSave'       : 'この訳を保存する',
      'profile.trEditHelp'   : '訳は直せます。日本語にしかない言い回しは、自分の言葉に置き換えてください。',
      'profile.trSaving'     : '訳を保存しています…',
      'profile.trSaved'      : '訳を保存しました。',
      'profile.trFailed'     : '訳を保存できませんでした。時間をおいてもう一度お試しください。',
      'profile.photo'        : 'プロフィール写真のURL',
      'profile.photoHelp'    : 'メッセージ一覧やホスト一覧に丸く表示されます。imagesフォルダの写真なら images/me.jpg のように書けます。',
      'interests.label'      : '好きなこと・分かち合いたいこと',
      'interests.help'       : '一緒に過ごす時間に何を共有したいか。ゲストがホストを選ぶときの手がかりになります。',
      'interests.free'       : 'もっと具体的に',
      'interests.freePh'     : '50〜70年代のジャズ。車内のスピーカーで思う存分語りたい。',
      'interests.freePhEn'   : 'Jazz from the 50s to the 70s. I want to play it in the van and talk about it for hours.',
      'interests.none'       : '未記入',

      'hosts.title'          : 'ホストを探す',
      'hosts.lead'           : '行き先ではなく、人で選ぶ。好きなことが重なる相手を探してください。',
      'hosts.filterInterest' : '好きなことで絞る',
      'hosts.filterLang'     : '言語で絞る',
      'hosts.clear'          : '条件をはずす',
      'hosts.count'          : '件',
      'hosts.empty'          : '条件に合うホストが見つかりませんでした。',
      'hosts.viewProfile'    : 'プロフィールを見る',
      'hosts.noHosts'        : 'まだホストが登録されていません。',

      'page.listings.title'  : '体験をさがす — TriArk',
      'page.listing.title'   : '体験 — TriArk',
      'nav.findListings'     : '体験をさがす',
      /* スマホ下部の帯。狭いので、短く言い切る */
      /* お試し公開中の表示（trial.js） */
      'listing.currency'     : '通貨',
      'listing.currencyHelp' : 'ホストが受け取る通貨です。ここで選んだ通貨のまま表示され、他の通貨への換算はしません。',
      'trial.badge'          : '準備中',
      'trial.bar'            : 'TriArk はいまお試し公開中です。掲載中の体験はすべて準備中で、実際のお申し込みはまだ受け付けていません。',
      'trial.note'           : 'この体験はまだ準備中で、お申し込みは受け付けていません。気になることがあれば、問い合わせから聞いてください。',
      'tab.find'             : 'さがす',
      'tab.hosts'            : 'ホスト',
      'tab.becomeHost'       : 'ホストになる',
      'tab.myListings'       : '自分の体験',
      'tab.messages'         : 'メッセージ',
      'tab.bookings'         : '予約',
      'tab.profile'          : 'プロフィール',
      'tab.login'            : 'ログイン',
      'listings.title'       : '体験をさがす',
      'listings.lead'        : '',
      'listings.all'         : 'すべて',
      'listings.empty'       : '公開中の体験がまだありません。',
      'listings.count'       : '件',
      'detail.hostedBy'      : 'ホスト',
      'detail.about'         : 'この体験について',
      'detail.photos'        : '写真',
      'detail.allPhotos'     : 'すべての写真を表示',
      'detail.meetingPoint'  : '出発地',
      'detail.capacity'      : '定員',
      'detail.people'        : '名まで',
      'detail.private'       : '貸切',
      'detail.inquire'       : '問い合わせる',
      'detail.inquireSoon'   : '問い合わせとチャットは次の段階でつなぎます。',
      'detail.notFound'      : 'この体験は見つかりませんでした。',
      'detail.viewHost'      : 'ホストのプロフィールを見る',
      'detail.ownListing'    : 'これはあなたの体験です。',

      'page.bookings.title'  : '予約 — TriArk',
      'nav.bookings2'        : '予約',

      'inq.title'            : '問い合わせる',
      'inq.lead'             : 'まずはホストに聞いてみましょう。日程や人数は、やりとりの中で変えられます。',
      'inq.date'             : '希望日',
      'inq.people'           : '人数',
      'inq.message'          : 'ホストへのメッセージ',
      'inq.messagePh'        : 'はじめまして。この日程で参加できるか伺いたいです。',
      'inq.total'            : '体験料の目安',
      'inq.send'             : 'この内容で問い合わせる',
      'inq.needDate'         : '希望日を選んでください。',
      'inq.needMessage'      : 'メッセージを入力してください。',
      'inq.failed'           : '送信できませんでした。もう一度お試しください。',
      'inq.overCapacity'     : '定員をこえています。',

      'bk.title'             : '予約',
      'bk.asGuest'           : 'ゲストとして',
      'bk.asHost'            : 'ホストとして',
      'bk.empty'             : 'まだ予約はありません。',
      'bk.openChat'          : 'やりとりを見る',
      'bk.viewGuest'         : 'ゲストのプロフィールを見る',
      'bk.viewHost'          : 'ホストのプロフィールを見る',
      'bk.date'              : '希望日',
      'bk.people'            : '人数',
      'bk.peopleUnit'        : '名',
      'bk.guest'             : 'ゲスト',
      'bk.host'              : 'ホスト',
      'bk.total'             : '体験料',

      'page.chat.title'      : 'やりとり — TriArk',
      'page.messages.title'  : 'メッセージ — TriArk',
      'msg.title'            : 'メッセージ',
      'msg.empty'            : 'まだやりとりはありません。',
      'msg.you'              : 'あなた：',
      'msg.system'           : '（予約の更新）',
      'chat.placeholder'     : 'メッセージを入力',
      'chat.send'            : '送信',
      'chat.read'            : '既読',
      'chat.back'            : '予約一覧へ',
      'chat.notAllowed'      : 'この会話は表示できません。',
      'chat.request'         : '予約をリクエストする',
      'chat.approve'         : '予約を確定する',
      'chat.decline'         : '今回は見送る',
      'chat.cancel'          : 'キャンセルする',
      'chat.waitingHost'     : 'ホストの返事を待っています。',
      'chat.waitingGuest'    : 'ゲストのリクエストを待っています。',
      'chat.doneNote'        : 'この予約は確定しています。',
      'chat.closedNote'      : 'この予約は終了しています。',
      'chat.confirmDecline'  : 'この予約を見送ります。よろしいですか。',
      'chat.confirmCancel'   : 'この予約をキャンセルします。よろしいですか。',
      'chat.actionFailed'    : '処理できませんでした。もう一度お試しください。',
      'host.listings'        : 'このホストの体験',
      'host.listingsOf'      : '{name}さんの体験',

      'page.becomeHost.title': 'ホストになる — TriArk',
      'bh.title'             : 'ホストになる',
      'bh.lead'              : 'あなたの好きなことを、誰かと分かち合う。それがTriArkのホストです。',
      'bh.what'              : 'ホストとは',
      'bh.whatBody'          : 'TriArkのホストは、ガイドではありません。自分の車や船で、自分の好きな場所へ、誰かと一緒に行く人のことです。行き先の知識よりも、何を分かち合いたいかが大事になります。',
      'bh.steps'             : 'はじめかた',
      'bh.step1'             : 'プロフィールを書く',
      'bh.step1Body'         : 'あなたが何者で、何が好きで、どんな時間を一緒に過ごしたいか。長さの制限はありません。ゲストはここを読んで、あなたを選びます。',
      'bh.step2'             : '体験を登録する',
      'bh.step2Body'         : '陸・海・空のどれか、出発地、体験料、定員。写真と説明を添えれば、公開できます。いくつでも登録できます。',
      'bh.step3'             : '問い合わせを受ける',
      'bh.step3Body'         : '興味を持った人からメッセージが届きます。やりとりをして、お互いに納得できたら予約を確定します。',
      'bh.note'              : 'いまはテスト運用の段階です。実際に動かしながら、一緒に育てていければと思っています。',
      'bh.start'             : 'はじめる',
      'bh.startLoggedOut'    : '登録してはじめる',
      'host.editMine'        : '自分のプロフィールを編集する',

      'interest.music'        : '音楽',
      'interest.film'         : '映画',
      'interest.manga'        : '漫画・アニメ',
      'interest.books'        : '本・読書',
      'interest.fishing'      : '釣り',
      'interest.hiking'       : '登山・ハイキング',
      'interest.camping'      : 'キャンプ',
      'interest.trains'       : '鉄道',
      'interest.cars'         : '車・ドライブ',
      'interest.photography'  : '写真',
      'interest.food'         : '料理・食べ歩き',
      'interest.onsen'        : '温泉・銭湯',
      'interest.sake'         : '酒・地酒',
      'interest.cafe'         : 'カフェ巡り',
      'interest.history'      : '歴史・寺社',
      'interest.art'          : '美術・アート',
      'interest.nature'       : '自然・生きもの',
      'interest.stars'        : '星空・天体',
      'interest.cycling'      : '自転車',
      'interest.surfing'      : '海遊び・サーフィン',
      'interest.snow'         : '雪山・スキー',
      'interest.crafts'       : '手仕事・クラフト',
      'interest.games'        : 'ゲーム',
      'interest.language'     : '語学交流',

      'listing.sessions'     : '開催日程',
      'listing.sessionsHelp' : '実施できる日程を追加してください。ゲストはここから選んで問い合わせます。空のままなら、ゲストが希望日を自由に書く形になります。',
      'listing.doList'       : 'やること',
      'listing.doListPh'     : '例：葉山港から出港\n初島でお昼\n海から富士山を眺める\n夕方、葉山に戻る',
      'listing.included'     : '含まれるもの',
      'listing.includedPh'   : '例：船の燃料代\nライフジャケット\n飲み物',
      'listing.bring'        : '持ち物',
      'listing.bringPh'      : '例：動きやすい服装\n日焼け止め\n酔い止め（必要な方）',
      'listing.linesHelp'    : '1行に1つ。10個まで。',
      'listing.descriptionHelp': 'どんな時間になるか、あなたの言葉で。細かい流れは下の「やること」に書けます。',
      'listing.dest'         : '行き先',
      'listing.destPh'       : '富士山',
      'listing.destHelp'     : 'その日、どこへ向かうか。Google マップで出てくる書き方で入れてください。体験のページで、ここまでの道のりが地図に描かれます。',
      'listing.destNotFound' : '地図の上の点は決められませんでしたが、この名前のまま道のりは描かれます。下のリンクで確かめられます。',
      'listing.destCheck'    : 'Google マップで確かめる',
      'listing.via'          : '途中で寄るところ',
      'listing.viaPh'        : '例：河口湖、道の駅なるさわ',
      'listing.viaHelp'      : '入力して Enter で足せます。5つまで。こちらも Google マップで出てくる書き方で。',
      'listing.startDate'    : '開始日',
      'listing.endDate'      : '終了日（日帰りなら空欄）',
      'listing.startTime'    : '集合',
      'listing.endTime'      : '解散',
      'listing.flexible'     : '時間は相談で決める',
      'listing.flexibleShort': '時間は相談',
      'listing.addSession'   : 'この日程を追加',
      'listing.dayTrip'      : '日帰り',
      'listing.nights'       : '泊',
      'listing.meet'         : '集合',
      'listing.leave'        : '解散',
      'listing.openDates'    : '開催できる日',
      'listing.openDatesHelp': '実施できる日を追加してください。ゲストはここから選んで問い合わせます。空のままなら、ゲストが希望日を自由に書く形になります。',
      'listing.addDate'      : '日を追加',
      'listing.noDates'      : 'まだ日を設定していません。',
      'detail.openDates'     : '開催できる日',
      'inq.pickDate'         : '日を選ぶ',
      'inq.noOpenDates'      : 'この体験はまだ日程が公開されていません。希望日を書いて問い合わせてください。',
      'listing.departure'    : '出発地',
      'listing.perPerson'    : '一人あたり',
      'listing.upTo'         : '最大'
    },

    en: {
      'brand.tagline'        : 'Where the journey becomes life.',

      'nav.about'            : 'About TriArk',
      'nav.journey'          : 'Take a journey',
      'nav.host'             : 'Become a host',
      'nav.faq'              : 'FAQ',
      'nav.contact'          : 'Contact',
      'url.contact'          : 'https://docs.google.com/forms/d/e/1FAIpQLSdpbx2U8YWnMKaOZH_fSBbiOv5qL2xxiGvpfn4Xnwt0xqcl-g/viewform',
      'nav.home'             : 'Back to home',
      'nav.login'            : 'Log in',
      'nav.signup'           : 'Sign up',
      'nav.logout'           : 'Log out',
      'nav.mypage'           : 'My page',
      'nav.messages'         : 'Messages',
      'nav.bookings'         : 'Bookings',
      'nav.favorites'        : 'Saved',
      'nav.switchToHost'     : 'Switch to hosting',
      'nav.switchToGuest'    : 'Switch to traveling',

      'auth.login'           : 'Log in',
      'auth.signup'          : 'Sign up',
      'auth.email'           : 'Email address',
      'auth.password'        : 'Password',
      'auth.name'            : 'Your name',
      'auth.googleLogin'     : 'Continue with Google',
      'auth.toSignup'        : "Don't have an account?",
      'auth.toLogin'         : 'Already have an account?',
      'auth.logoutDone'      : 'You have been logged out.',
      'user.nameSuffix'      : '',
      'auth.namePh'          : 'Jane Doe',
      'auth.emailPh'         : 'you@example.com',
      'auth.passwordPh'      : '6 characters or more',
      'auth.signupLead'      : 'One account. Travel, or welcome others — both start here.',
      'auth.loginLead'       : 'Welcome back.',
      'auth.tabLogin'        : 'Log in',
      'auth.tabSignup'       : 'Sign up',
      'auth.processing'      : 'Working…',
      'auth.err.required'    : 'Please fill in all fields.',
      'auth.err.emailInUse'  : 'This email is already registered. Try logging in instead.',
      'auth.err.invalidEmail': 'That email address is not valid.',
      'auth.err.weakPassword': 'Password must be at least 6 characters.',
      'auth.err.wrongLogin'  : 'Email or password is incorrect.',
      'auth.err.tooMany'     : 'Too many attempts. Please wait a moment and try again.',
      'auth.err.network'     : 'Connection failed. Please check your network.',
      'auth.err.generic'     : 'Something went wrong. Please try again.',

      'booking.inquiry'      : 'Inquiry',
      'booking.requested'    : 'Awaiting approval',
      'booking.confirmed'    : 'Confirmed',
      'booking.declined'     : 'Declined',
      'booking.cancelled'    : 'Cancelled',

      'sys.booking_inquiry'  : 'An inquiry has started.',
      'sys.booking_requested': 'The guest has requested this booking.',
      'sys.booking_confirmed': 'The booking is confirmed.',
      'sys.booking_declined' : 'The host has declined this booking.',
      'sys.booking_cancelled': 'This booking has been cancelled.',

      'common.send'          : 'Send',
      'common.save'          : 'Save',
      'common.cancel'        : 'Cancel',
      'common.back'          : 'Back',
      'common.loading'       : 'Loading…',
      'bi.help'              : 'Leave the English empty and Japanese will be shown to English readers as-is.',
      'detail.route'         : 'Route',
      'detail.openMaps'      : 'Open in Google Maps',
      'veh.title'            : 'Your Ark',
      'veh.add'              : 'Add an Ark',
      'veh.help'             : 'What carries your journeys — a van by land, a boat at sea, a plane in the sky. Add them once here and they appear on all your experiences.',
      'veh.namePh.land'      : 'Model (e.g. Toyota HiAce, camper conversion)',
      'veh.namePh.sea'       : 'Type of boat (e.g. 24ft pleasure boat)',
      'veh.namePh.air'       : 'Aircraft (e.g. Cessna 172)',
      'veh.notePh.land'      : 'A note (e.g. up to 4 people. Sink, fridge and a roof tent)',
      'veh.notePh.sea'       : 'A note (e.g. up to 6 people. Toilet and sun shade. It is a rental, so it may differ from the photos)',
      'veh.notePh.air'       : 'A note (e.g. up to 3 people. Used for sightseeing flights)',
      'veh.addPhotos'        : 'Add photos',
      'veh.common'           : 'Photos shown on every experience',
      'veh.commonHelp'       : 'Put photos here once and they appear on all of your experiences, '
                               + 'so you do not have to add them again each time. '
                               + 'They come after the photos of that experience. Up to twelve.',
      'veh.uploading'        : 'Uploading photos…',
      'veh.uploaded'         : 'Photos added. Remember to save.',
      'veh.full'             : 'That is as many as you can add.',
      'veh.of'               : "{name}'s Ark",
      'veh.hostVehicle'      : "This host's Ark",
      'veh.hostGallery'      : 'From this host\'s travels',

      /* ---- Licences, registrations and insurance ---- */
      'cert.title'           : 'Licences, registrations and insurance',
      'cert.help'            : 'List the licences, business registrations and insurance you hold. Guests look here to see who they are '
                               + 'travelling with and what cover is in place. Include the issuing authority with the number '
                               + '(e.g. Governor of Gunma, No. 123). Up to 10 entries.',
      'cert.add'             : 'Add an entry',
      'cert.noPh'            : 'Issuer and number (e.g. Governor of Gunma, No. 123)',
      'cert.expPh'           : 'Valid until (optional)',
      'cert.expOf'           : 'Valid until {d}',
      'cert.note'            : 'Carrying passengers for payment — by road or by sea — may require a licence or registration under Japanese law. '
                               + 'Check with your regional transport bureau or prefectural office which ones apply to your experience. There is no charge for asking.',
      'cert.insConfirm'      : 'I have confirmed with my insurer that passengers are covered when I carry them this way',
      'cert.insConfirmHelp'  : 'Japanese motor policies are rated by stated use — everyday/leisure, commuting, or business. If the stated use does not match '
                               + 'reality, a claim can be refused. Ask your insurer two things: whether your stated use is correct, and whether passengers are '
                               + 'covered in an accident while you are carrying them as part of a guided experience.',
      'cert.insConfirmedLabel' : 'Cover confirmed with insurer',
      'cert.disclaimer'      : 'The entries above are supplied by the host. TriArk does not verify or guarantee them; keeping them accurate and current '
                               + 'is the host\'s own responsibility.',
      'cert.k.license2'      : 'Class 2 driving licence (commercial passenger)',
      'cert.k.taxiBiz'       : 'Passenger car transport business (licensed)',
      'cert.k.charterBiz'    : 'Chartered passenger transport business (licensed)',
      'cert.k.jikayou'       : 'Private vehicle paid passenger transport (registered)',
      'cert.k.rentacar'      : 'Vehicle rental business (licensed)',
      'cert.k.boatLic'       : 'Small craft operator licence',
      'cert.k.boatTokutei'   : 'Specified operator licence (carrying passengers)',
      'cert.k.futeiki'       : 'General irregular route service (registered)',
      'cert.k.ryokakuFutei'  : 'Irregular passenger route service (licensed)',
      'cert.k.yugyosen'      : 'Fishing charter business (registered)',
      'cert.k.guideNat'      : 'National Government Licensed Guide Interpreter',
      'cert.k.guideLocal'    : 'Regionally Licensed Guide Interpreter',
      'cert.k.insCar'        : 'Motor insurance (voluntary)',
      'cert.k.insBoat'       : 'Passenger liability insurance (marine)',
      'cert.k.insLiability'  : 'Public liability insurance',
      'cert.k.other'         : 'Other',
      'cert.insTitle'        : 'Motor insurance check',
      'sea.title'            : 'Registration needed to carry guests on this boat',
      'sea.todo'             : 'Not yet complete',
      'sea.done'             : 'Complete',
      'sea.pickBiz'          : 'Choose your business registration',
      'sea.bizNoPh'          : 'Registration number (e.g. Governor of Gunma, No. 123)',
      'sea.licNoPh'          : 'Licence number',
      'sea.ins'              : 'I hold marine passenger liability insurance',
      'sea.insShort'         : 'held',
      'sea.note'             : 'Japanese law requires these before you may carry paying passengers by boat. Until they are complete, experiences using this boat cannot be published (drafts can still be saved).',
      'sea.need.biz'         : 'business registration',
      'sea.need.lic'         : 'specified operator licence',
      'sea.need.ins'         : 'marine passenger liability insurance',
      'sea.need.none'        : 'a boat listed as one of your Arks',
      'req.must'             : 'Required',
      'req.pub'              : 'Needed to publish',
      'ready.ok'             : 'This experience is ready to publish.',
      'ready.todo'           : '{n} more before you can publish',
      'ready.title'          : 'Title',
      'ready.desc'           : 'Description',
      'ready.do'             : 'What you will do',
      'ready.sea'            : 'Boat registration (in your profile)',
      'listing.needSea'      : 'To publish a sea experience, your Ark in your profile needs: {list}',
      'listing.needDesc'     : 'Please write a description. An experience cannot be published unless a guest can tell what it is.',
      'listing.needDo'       : 'Please list at least one thing you will do on the day.',
      'listing.pickup'       : 'Pick-up and drop-off',
      'listing.pickupOn'     : 'I drive guests to and from this experience in my own vehicle',
      'listing.pickupHelp'   : 'Tick this if you collect guests from a station or their accommodation. The experience page will then state that a private vehicle '
                               + 'is used and that the transport requires no licence under the Road Transport Act. The transport must be free of charge: the fee is '
                               + 'for your guiding only, it cannot differ depending on whether a guest is driven, and the price breakdown cannot list fuel or transport.',
      'listing.pickupNote'   : 'The host drives guests to and from this experience in their own private vehicle. The transport is incidental to the guided experience '
                               + 'and requires no licence or registration under Japan\'s Road Transport Act. The transport is free of charge and is not part of the fee.',

      'cal.open'             : 'Available',
      'cal.openEdit'         : 'Dates you can run this',
      'cal.pendingDot'       : 'Start date',
      'cal.hintEdit'         : 'Tap a day to set it as the start. Tap it again for a day trip, or tap a later day for an overnight trip. Tap a highlighted day to remove it.',
      'cal.hintPending'      : 'Start date chosen. Tap the same day again for a day trip, or the last day for an overnight trip.',
      'cal.hint'             : 'Tap a highlighted day to ask about that date.',
      'common.jaOnly'        : 'This content is available in Japanese only',
      'common.enOnly'        : 'This content is available in English only',

      'page.home.title'      : 'TriArk — Where the journey becomes life.',
      'page.about.title'     : 'About TriArk — Where the journey becomes life.',
      'page.login.title'     : 'Log in — TriArk',
      'page.host.title'      : 'Host profile — TriArk',

      'host.editTitle'       : 'Host profile',
      'host.editLead'        : 'Who you are, and what kind of time you can offer. This is a place to write at length.',
      'host.headline'        : 'One-line headline',
      'host.headlinePh'      : 'A guide who has walked the Hakone mountains for 30 years',
      'host.headlineHelp'    : 'The first line guests will see.',
      'host.intro'           : 'Introduction',
      'host.introPh'         : 'Your story, what you can show them, what matters to you. Take your time.',
      'host.introHelp'       : 'Write as much as you like (up to 10,000 characters). 600+ helps guests choose you. Line breaks are kept as written.',
      'limit.over'           : 'Some fields are over the limit. Please shorten the ones marked in red.',
      'host.basedIn'         : 'Based in',
      'host.basedInPh'       : 'Hakone, Kanagawa',
      'host.languages'       : 'Languages you can guide in',
      'host.jaFields'        : 'Japanese',
      'host.enFields'        : 'English',
      'host.saved'           : 'Saved.',
      'host.saveFailed'      : 'Could not save. Please try again.',
      'host.needLogin'       : 'Please log in to write your host profile.',
      'host.becomeHost'      : 'Become a host',
      'host.hostSince'       : 'Hosting since',
      'host.notFound'        : 'This host has not written an introduction yet.',
      'host.photosLater'     : 'Photo uploads come in the next step.',

      'lang.ja'              : 'Japanese',
      'lang.en'              : 'English',
      'lang.zh'              : 'Chinese',
      'lang.ko'              : 'Korean',
      'lang.fr'              : 'French',
      'lang.es'              : 'Spanish',
      'lang.other'           : 'Other',

      'host.languagesHelp'   : 'Choose the languages you personally speak, and your level. You are the one travelling with them.',
      'level.native'         : 'Native',
      'level.fluent'         : 'Fluent',
      'level.business'       : 'Business',
      'level.conversational' : 'Conversational',
      'level.beginner'       : 'Beginner',

      'page.listingEdit.title': 'Add an experience — TriArk',
      'page.myListings.title' : 'My experiences — TriArk',

      'nav.myListings'       : 'My experiences',

      'listing.newTitle'     : 'Add an experience',
      'listing.editTitle'    : 'Edit experience',
      'listing.lead'         : 'Register the time you can offer as one experience.',
      'listing.type'         : 'Type',
      'listing.type.land'    : 'Land',
      'listing.type.sea'     : 'Sea',
      'listing.type.air'     : 'Air',
      'listing.type.landDesc': 'Car, walking, rail',
      'listing.type.seaDesc' : 'Boat, cruise',
      'listing.type.airDesc' : 'From the sky',
      'listing.title'        : 'Title',
      'listing.titlePh'      : 'Three days of roadside stations in a kei van',
      'listing.area'         : 'Area',
      'listing.areaPh'       : 'Hakone, Kanagawa',
      'listing.description'  : 'Description',
      'listing.descriptionPh': 'What the time will be like. What you will see, eat, and take home.',
      'listing.price'        : 'Experience fee (per person, JPY)',
      'listing.fee'          : 'Experience fee',
      'listing.feeNote'      : 'This is the fee for the experience itself.',
      'listing.capacity'     : 'Maximum guests',
      'listing.images'       : 'Photos',
      'listing.imagesHelp'   : 'The first one appears in the list and at the top of the page. To reorder, remove and add again. Up to ten. A line about each photo tells the story of the trip.',
      'listing.photoNote'    : 'Say a word about this photo (optional)',
      'listing.coverTag'     : 'Cover',
      'listing.address'      : 'Meeting point address',
      'listing.addressPh'    : 'Hakone-machi, Ashigarashimo, Kanagawa',
      'listing.addressHelp'  : 'Used to show the place on a map and to fetch the weather. A rough address is fine. A station or venue name works too.',
      'listing.jmaArea'      : 'Area for weather alerts',
      'listing.jmaAreaHelp'  : 'Alerts from the Japan Meteorological Agency are read for this area. Choose the prefecture of the meeting point.',
      'listing.jmaPick'      : 'Please choose',
      'listing.jmaCity'      : 'City / town',
      'listing.jmaCityAll'   : 'Whole prefecture',
      'listing.jmaAuto'      : 'Filled in from the meeting point. Change it if it is not right.',

      'wx.clear'             : 'Clear',
      'wx.partly'            : 'Partly cloudy',
      'wx.cloudy'            : 'Cloudy',
      'wx.fog'               : 'Fog',
      'wx.drizzle'           : 'Drizzle',
      'wx.rain'              : 'Rain',
      'wx.showers'           : 'Showers',
      'wx.snow'              : 'Snow',
      'wx.thunder'           : 'Thunderstorm',
      'wx.unknown'           : '—',
      'wx.wind'              : 'Wind',
      'wx.loading'           : 'Checking the weather…',
      'wx.failed'            : 'Could not load the weather',
      'wx.source'            : 'Weather: Open-Meteo / Alerts: Japan Meteorological Agency',

      'alert.none'           : 'No warnings or advisories in effect',
      'alert.loading'        : 'Checking official alerts…',
      'alert.failed'         : 'Could not load alert information',
      'alert.advisory'       : 'An advisory is in effect',
      'alert.warning'        : 'A warning is in effect',
      'alert.emergency'      : 'An emergency warning is in effect',
      'alert.judge'          : 'The host decides whether to run the experience, based on this official information.',
      'alert.watch'          : 'Relevant to this experience',

      'listing.addressEnPh'  : 'Katsudoki Marina, Chuo-ku, Tokyo',
      'listing.addressEnHelp': 'Write the meeting point so English readers can find it. If left empty, the Japanese text is shown instead.',
      'listing.locate'       : 'Show on map',
      'listing.locating'     : 'Searching…',
      'listing.locateFailed' : 'Not found. Try a shorter address or a different wording.',
      'listing.locateOk'     : 'This location will be saved.',
      'listing.coordsManual' : 'Enter coordinates directly',
      'listing.lat'          : 'Latitude',
      'listing.lng'          : 'Longitude',
      'listing.imagesLocal'  : 'Photos in your images folder can be written as images/xxx.jpg.',
      'listing.status'       : 'Status',
      'listing.status.draft' : 'Draft',
      'listing.status.published':'Published',
      'listing.status.closed': 'Closed',
      'listing.saveDraft'    : 'Save as draft',
      'listing.publish'      : 'Publish',
      'listing.saved'        : 'Saved.',
      'listing.saveFailed'   : 'Could not save.',
      'listing.needTitle'    : 'Please enter a title.',
      'listing.needHost'     : 'Please save your host profile before adding an experience.',
      'listing.mineTitle'    : 'My experiences',
      'listing.mineEmpty'    : 'You have not added any experiences yet.',
      'listing.addNew'       : 'Add an experience',
      'listing.edit'         : 'Edit',
      'listing.delete'       : 'Delete',
      'listing.deleteConfirm': 'This experience will be deleted. This cannot be undone. Continue?',
      'page.hosts.title'     : 'Find a host — TriArk',
      'nav.findHosts'        : 'Find a host',

      'page.profile.title'   : 'Profile — TriArk',
      'profile.title'        : 'Your profile',
      'profile.lead'         : 'Whether you travel or host, this is how others get to know you.',
      'profile.photoPick'    : 'Choose a photo',
      'profile.photoChange'  : 'Change photo',
      'profile.photoRemove'  : 'Remove photo',
      'profile.photoHelp2'   : 'A photo that shows your face works best. It will be cropped to a square.',
      'profile.photoPending' : 'Press "Save" to update your photo.',
      'profile.photoFormat'  : 'This photo could not be read. Please choose a JPEG or PNG.',
      'profile.photoFailed'  : 'Could not upload the photo. Please try again later.',
      'profile.name'         : 'Name',
      'profile.nameHelp'     : 'Only your first word is shown on the site.',
      'profile.needName'     : 'Please enter your name.',
      'profile.bio'          : 'About you',
      'profile.bioPh'        : 'Who you are and what kind of travel you love. It helps hosts and guests get to know you.',
      'profile.languages'    : 'Languages you speak',
      'profile.tagsPh'       : 'Add your own (e.g. jazz cafés, fly fishing)',
      'profile.tagsHelp'     : 'Besides the list above, type anything and press Enter. Up to 10, 20 characters each.',
      'profile.tagsFull'     : 'You can add up to 10. Press × to remove one.',
      'profile.anyLang'      : 'Write in any language you like. Readers of other languages will see an automatic translation (coming soon).',
      'profile.hostInviteTitle': 'Become a host',
      'profile.hostInviteText' : 'Land, sea or sky — share a journey with your vehicle and the things you love.',
      'profile.hostOpen'     : 'Write your host introduction',
      'profile.hostTitle'    : 'As a host',
      'profile.viewMine'     : 'See my public profile',
      'profile.notFound'     : 'This profile could not be found.',
      'profile.trTitle'      : 'How it appears in other languages',
      'profile.trHelp'       : 'Your text is translated automatically when you save. It can take up to a minute to appear.',
      'profile.trPending'    : 'No translation yet. Wait a moment and press "Refresh".',
      'profile.trReload'     : 'Refresh',
      'profile.trSave'       : 'Save this wording',
      'profile.trEditHelp'   : 'You can edit these. Replace anything the machine got wrong with your own words.',
      'profile.trSaving'     : 'Saving…',
      'profile.trSaved'      : 'Saved.',
      'profile.trFailed'     : 'Could not save. Please try again later.',
      'profile.photo'        : 'Profile photo URL',
      'profile.photoHelp'    : 'Shown as a round image in messages and host listings. A photo in your images folder can be written as images/me.jpg.',
      'interests.label'      : 'What you love, and want to share',
      'interests.help'       : 'What you would like to share during the time together. This is how guests choose a host.',
      'interests.free'       : 'In your own words',
      'interests.freePh'     : 'Jazz from the 50s to the 70s. I want to play it in the van and talk about it for hours.',
      'interests.freePhEn'   : 'Jazz from the 50s to the 70s. I want to play it in the van and talk about it for hours.',
      'interests.none'       : 'Not written yet',

      'hosts.title'          : 'Find a host',
      'hosts.lead'           : 'Choose by the person, not the destination. Find someone who loves what you love.',
      'hosts.filterInterest' : 'Filter by interest',
      'hosts.filterLang'     : 'Filter by language',
      'hosts.clear'          : 'Clear filters',
      'hosts.count'          : 'found',
      'hosts.empty'          : 'No hosts match these filters.',
      'hosts.viewProfile'    : 'View profile',
      'hosts.noHosts'        : 'No hosts have registered yet.',

      'page.listings.title'  : 'Find an experience — TriArk',
      'page.listing.title'   : 'Experience — TriArk',
      'nav.findListings'     : 'Find an experience',
      /* The bar at the bottom on phones. Keep every word short */
      /* Shown while the site is in trial (trial.js) */
      'listing.currency'     : 'Currency',
      'listing.currencyHelp' : 'The currency you are paid in. Prices are shown exactly as you set them, with no conversion.',
      'trial.badge'          : 'Coming soon',
      'trial.bar'            : 'TriArk is open as a trial. Every experience listed here is still being prepared, and bookings are not open yet.',
      'trial.note'           : 'This experience is still being prepared and cannot be booked yet. If you are curious about it, send a question.',
      'tab.find'             : 'Search',
      'tab.hosts'            : 'Hosts',
      'tab.becomeHost'       : 'Host',
      'tab.myListings'       : 'Listings',
      'tab.messages'         : 'Messages',
      'tab.bookings'         : 'Bookings',
      'tab.profile'          : 'Profile',
      'tab.login'            : 'Log in',
      'listings.title'       : 'Find an experience',
      'listings.lead'        : '',
      'listings.all'         : 'All',
      'listings.empty'       : 'No experiences have been published yet.',
      'listings.count'       : 'found',
      'detail.hostedBy'      : 'Host',
      'detail.about'         : 'About this experience',
      'detail.photos'        : 'Photos',
      'detail.allPhotos'     : 'Show all photos',
      'detail.meetingPoint'  : 'Meeting point',
      'detail.capacity'      : 'Capacity',
      'detail.people'        : 'guests',
      'detail.private'       : 'Private',
      'detail.inquire'       : 'Send an inquiry',
      'detail.inquireSoon'   : 'Inquiries and chat are connected in the next step.',
      'detail.notFound'      : 'This experience was not found.',
      'detail.viewHost'      : 'View host profile',
      'detail.ownListing'    : 'This is your own experience.',

      'page.bookings.title'  : 'Bookings — TriArk',
      'nav.bookings2'        : 'Bookings',

      'inq.title'            : 'Send an inquiry',
      'inq.lead'             : 'Start by asking the host. Dates and numbers can still change as you talk.',
      'inq.date'             : 'Preferred date',
      'inq.people'           : 'Guests',
      'inq.message'          : 'Message to the host',
      'inq.messagePh'        : 'Hello. I would like to ask whether this date works.',
      'inq.total'            : 'Estimated fee',
      'inq.send'             : 'Send this inquiry',
      'inq.needDate'         : 'Please choose a date.',
      'inq.needMessage'      : 'Please write a message.',
      'inq.failed'           : 'Could not send. Please try again.',
      'inq.overCapacity'     : 'That is more than this experience allows.',

      'bk.title'             : 'Bookings',
      'bk.asGuest'           : 'As a guest',
      'bk.asHost'            : 'As a host',
      'bk.empty'             : 'No bookings yet.',
      'bk.openChat'          : 'Open the conversation',
      'bk.viewGuest'         : "View the guest's profile",
      'bk.viewHost'          : "View the host's profile",
      'bk.date'              : 'Date',
      'bk.people'            : 'Guests',
      'bk.peopleUnit'        : '',
      'bk.guest'             : 'Guest',
      'bk.host'              : 'Host',
      'bk.total'             : 'Fee',

      'page.chat.title'      : 'Conversation — TriArk',
      'page.messages.title'  : 'Messages — TriArk',
      'msg.title'            : 'Messages',
      'msg.empty'            : 'No conversations yet.',
      'msg.you'              : 'You: ',
      'msg.system'           : '(booking updated)',
      'chat.placeholder'     : 'Write a message',
      'chat.send'            : 'Send',
      'chat.read'            : 'Read',
      'chat.back'            : 'Back to bookings',
      'chat.notAllowed'      : 'This conversation cannot be shown.',
      'chat.request'         : 'Request this booking',
      'chat.approve'         : 'Confirm this booking',
      'chat.decline'         : 'Decline',
      'chat.cancel'          : 'Cancel this booking',
      'chat.waitingHost'     : 'Waiting for the host to reply.',
      'chat.waitingGuest'    : 'Waiting for the guest to request.',
      'chat.doneNote'        : 'This booking is confirmed.',
      'chat.closedNote'      : 'This booking is closed.',
      'chat.confirmDecline'  : 'Decline this booking?',
      'chat.confirmCancel'   : 'Cancel this booking?',
      'chat.actionFailed'    : 'Could not complete that. Please try again.',
      'host.listings'        : 'Experiences by this host',
      'host.listingsOf'      : "{name}'s experiences",

      'page.becomeHost.title': 'Become a host — TriArk',
      'bh.title'             : 'Become a host',
      'bh.lead'              : 'Share what you love with someone else. That is what a TriArk host does.',
      'bh.what'              : 'What a host is',
      'bh.whatBody'          : 'A TriArk host is not a tour guide. You take someone along in your own vehicle, to the places you love. What matters is not how much you know, but what you want to share.',
      'bh.steps'             : 'How to start',
      'bh.step1'             : 'Write your profile',
      'bh.step1Body'         : 'Who you are, what you love, and what kind of time you want to share. There is no length limit. Guests read this and choose you.',
      'bh.step2'             : 'Add an experience',
      'bh.step2Body'         : 'Land, sea or air, a meeting point, a fee and a capacity. Add photos and a description, and publish. You can add as many as you like.',
      'bh.step3'             : 'Receive inquiries',
      'bh.step3Body'         : 'Messages arrive from people who are interested. Talk it through, and confirm the booking when you are both happy.',
      'bh.note'              : 'TriArk is still in testing. We would like to build this together with the people who join early.',
      'bh.start'             : 'Get started',
      'bh.startLoggedOut'    : 'Sign up and start',
      'host.editMine'        : 'Edit my profile',

      'interest.music'        : 'Music',
      'interest.film'         : 'Film',
      'interest.manga'        : 'Manga & anime',
      'interest.books'        : 'Books',
      'interest.fishing'      : 'Fishing',
      'interest.hiking'       : 'Hiking',
      'interest.camping'      : 'Camping',
      'interest.trains'       : 'Trains',
      'interest.cars'         : 'Cars & driving',
      'interest.photography'  : 'Photography',
      'interest.food'         : 'Food',
      'interest.onsen'        : 'Hot springs',
      'interest.sake'         : 'Sake & drinks',
      'interest.cafe'         : 'Cafés',
      'interest.history'      : 'History & temples',
      'interest.art'          : 'Art',
      'interest.nature'       : 'Nature & wildlife',
      'interest.stars'        : 'Stargazing',
      'interest.cycling'      : 'Cycling',
      'interest.surfing'      : 'Surf & sea',
      'interest.snow'         : 'Snow & ski',
      'interest.crafts'       : 'Crafts',
      'interest.games'        : 'Games',
      'interest.language'     : 'Language exchange',

      'listing.sessions'     : 'Available dates',
      'listing.sessionsHelp' : 'Add the dates you can run this. Guests choose from these when they enquire. Leave it empty and guests will write their own preferred date instead.',
      'listing.doList'       : 'What you will do',
      'listing.doListPh'     : 'e.g. Leave from Hayama Port\nLunch on Hatsushima\nSee Mount Fuji from the water\nBack in Hayama by evening',
      'listing.included'     : "What's included",
      'listing.includedPh'   : 'e.g. Fuel\nLife jackets\nDrinks',
      'listing.bring'        : 'What to bring',
      'listing.bringPh'      : 'e.g. Comfortable clothes\nSunscreen\nSeasickness tablets if you need them',
      'listing.linesHelp'    : 'One per line, up to ten.',
      'listing.descriptionHelp': 'What the time together will be like, in your own words. The step-by-step goes in "What you will do" below.',
      'listing.dest'         : 'Where you are heading',
      'listing.destPh'       : 'Mount Fuji',
      'listing.destHelp'     : 'Where this journey goes. Write it the way it appears on Google Maps. The route there is drawn on the map of your experience page.',
      'listing.destNotFound' : 'It could not be pinned on the map, but the route is still drawn from this name. Check it with the link below.',
      'listing.destCheck'    : 'Check on Google Maps',
      'listing.via'          : 'Stops along the way',
      'listing.viaPh'        : 'e.g. Lake Kawaguchi',
      'listing.viaHelp'      : 'Type and press Enter to add. Up to five. Write these the way they appear on Google Maps too.',
      'listing.startDate'    : 'Start date',
      'listing.endDate'      : 'End date (leave empty for a day trip)',
      'listing.startTime'    : 'Meet at',
      'listing.endTime'      : 'Finish at',
      'listing.flexible'     : 'Times to be agreed',
      'listing.flexibleShort': 'Times flexible',
      'listing.addSession'   : 'Add this date',
      'listing.dayTrip'      : 'Day trip',
      'listing.nights'       : ' nights',
      'listing.meet'         : 'Meet',
      'listing.leave'        : 'Finish',
      'listing.openDates'    : 'Available dates',
      'listing.openDatesHelp': 'Add the dates you can run this. Guests choose from these when they enquire. Leave it empty and guests will write their own preferred date instead.',
      'listing.addDate'      : 'Add date',
      'listing.noDates'      : 'No dates set yet.',
      'detail.openDates'     : 'Available dates',
      'inq.pickDate'         : 'Choose a date',
      'inq.noOpenDates'      : 'No dates published yet. Write your preferred date in the message.',
      'listing.departure'    : 'From',
      'listing.perPerson'    : 'per person',
      'listing.upTo'         : 'up to'
    }
  };

  var current = DEFAULT_LANG;
  var listeners = [];

  /* ---------- 文言を取り出す ---------- */
  function t(key, lang) {
    var l = lang || current;
    var table = DICT[l] || DICT[DEFAULT_LANG];
    if (table[key] !== undefined) return table[key];
    // 片方に無ければもう片方で補う。それも無ければキーをそのまま返す（表示で気づけるように）
    var fb = DICT[DEFAULT_LANG];
    return fb[key] !== undefined ? fb[key] : key;
  }

  /* ---------- 話せる言語を、決まった順で一行にする ----------
     {ja:'native', en:'fluent'} → 「日本語（母語）/ 英語（流暢）」

     保存されている対応表は、入力した順や保存のされ方で中身の並びが変わる。
     そのままでは人によって順番がバラバラに見えるので、ここで必ず並べ直す。
       1. 水準の高い順（母語 → 流暢 → ビジネス → 日常会話 → 初級）
       2. 同じ水準なら、下の LANG_ORDER の順
     カッコは、日本語のときは全角、英語のときは半角にする。 */
  var LEVEL_ORDER = ['native', 'fluent', 'business', 'conversational', 'beginner'];
  var LANG_ORDER  = ['ja', 'en', 'zh', 'ko', 'fr', 'es'];   // profile.html の LANG_CODES と揃える

  function orderOf(list, v) {
    var i = list.indexOf(v);
    return i < 0 ? 99 : i;              // 見覚えのない値は、いちばん後ろへ
  }

  function langLine(map) {
    var m = map || {};
    var open  = (current === 'en') ? ' (' : '（';
    var close = (current === 'en') ? ')'  : '）';
    return Object.keys(m)
      .sort(function (a, b) {
        var d = orderOf(LEVEL_ORDER, m[a]) - orderOf(LEVEL_ORDER, m[b]);
        return d || (orderOf(LANG_ORDER, a) - orderOf(LANG_ORDER, b));
      })
      .map(function (c) { return t('lang.' + c) + open + t('level.' + m[c]) + close; })
      .join(' / ');
  }

  /* 拠点を、それと分かる形にする
     日本語 →「拠点：東京→日本全国」 / 英語 →「Based in Tokyo→all over Japan」
     地名だけを置くと、何の地名か読む人に伝わらないため */
  function basedLine(text) {
    var v = String(text == null ? '' : text).trim();
    if (!v) return '';
    return t('host.basedIn') + ((current === 'en') ? ' ' : '：') + v;
  }

  /* ---------- ユーザー投稿の日英を出し分ける ----------
     listing.title / listing.title_en のような対を渡す。
     選んだ言語が空なら、もう一方を返す（欠けていても表示は止めない）。
     戻り値の isFallback で「日本語のみです」を添えるか判断できる。 */
  /* 文章を、見る人の言語で取り出す
     1. 自動翻訳（obj.tr[言語][field]）があればそれを使う   … 次の段階で追加する仕組み
     2. 以前の形（field と field_en の2欄）ならそのどちらか
     3. どちらも無ければ、書いた人の言葉のまま */
  function pick(obj, field, lang) {
    var l = lang || current;
    obj = obj || {};
    var tr = obj.tr && obj.tr[l] && obj.tr[l][field];
    if (tr && String(tr).trim() !== '') {
      return { text: tr, isFallback: false, isTranslated: true, original: obj[field] || '' };
    }
    var ja = obj[field];
    var en = obj[field + '_en'];
    var wanted = (l === 'en') ? en : ja;
    var other  = (l === 'en') ? ja : en;
    if (wanted && String(wanted).trim() !== '') {
      return { text: wanted, isFallback: false };
    }
    return { text: other || '', isFallback: !!other };
  }

  /* 配列（自分で足したキーワードなど）を、見る人の言語で取り出す */
  function pickList(obj, field, lang) {
    var l = lang || current;
    obj = obj || {};
    var src = Array.isArray(obj[field]) ? obj[field] : [];
    var tr = obj.tr && obj.tr[l] && obj.tr[l][field];
    if (!Array.isArray(tr) || !tr.length) return src;
    /* 写真の一言メモのように、並び順に意味がある配列もある。
       訳が足りないときは、その場所だけ元の文を出す（ずらさない） */
    if (tr.length < src.length) {
      return src.map(function (v, i) { return tr[i] == null ? v : tr[i]; });
    }
    return tr;
  }

  /* 乗り物のような「配列の中の物」を、見る人の言語で取り出す
     例: pickObjList(host, 'vehicles', ['name','note']) */
  function pickObjList(obj, field, keys, lang) {
    var l = lang || current;
    obj = obj || {};
    var base = Array.isArray(obj[field]) ? obj[field] : [];
    var tr = obj.tr && obj.tr[l] && obj.tr[l][field];
    if (!Array.isArray(tr)) return base;
    return base.map(function (item, i) {
      var t2 = tr[i];
      if (!t2) return item;
      var out = {};
      Object.keys(item).forEach(function (k) { out[k] = item[k]; });
      (keys || Object.keys(t2)).forEach(function (k) {
        if (t2[k] && String(t2[k]).trim() !== '') out[k] = t2[k];
      });
      return out;
    });
  }

  /* ---------- 起動時の言語を決める ---------- */
  function detect() {
    var fromUrl = null;
    try {
      fromUrl = new URLSearchParams(location.search).get('lang');
    } catch (e) { /* 古い環境 */ }
    if (LANGS.indexOf(fromUrl) !== -1) return fromUrl;

    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* file:// など */ }
    if (LANGS.indexOf(saved) !== -1) return saved;

    return DEFAULT_LANG;
  }

  /* ---------- 内部リンクに言語を引き継ぐ ---------- */
  function syncLinks(lang) {
    var links = document.querySelectorAll('a[href]');
    Array.prototype.forEach.call(links, function (a) {
      var href = a.getAttribute('href');
      if (!href) return;
      // 外部リンク・アンカー・仮リンクは触らない
      if (href.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(href)) return;
      var parts = href.split('#');
      var main = parts[0];
      var hash = parts[1] ? '#' + parts[1] : '';
      var bits = main.split('?');
      var base = bits[0];
      if (!/\.html$/.test(base)) return;

      // 既にある他のパラメータ（?type=land など）は残す
      var keep = [];
      (bits[1] || '').split('&').forEach(function (kv) {
        if (kv && kv.indexOf('lang=') !== 0) keep.push(kv);
      });
      keep.push('lang=' + lang);
      a.setAttribute('href', base + '?' + keep.join('&') + hash);
    });
  }

  /* ---------- data-i18n を流し込む ---------- */
  function applyDom(lang) {
    var nodes = document.querySelectorAll('[data-i18n]');
    Array.prototype.forEach.call(nodes, function (el) {
      el.textContent = t(el.getAttribute('data-i18n'), lang);
    });

    // data-i18n-attr="placeholder:auth.email" / 複数は , 区切り
    var attrNodes = document.querySelectorAll('[data-i18n-attr]');
    Array.prototype.forEach.call(attrNodes, function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var p = pair.split(':');
        if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim(), lang));
      });
    });
  }

  /* ---------- 切り替え本体 ---------- */
  function set(lang) {
    if (LANGS.indexOf(lang) === -1) lang = DEFAULT_LANG;
    current = lang;

    document.documentElement.lang = lang;
    if (document.body) document.body.classList.toggle('en', lang === 'en');

    // 既存の切替ボタン（あるページだけ）
    var bja = document.getElementById('btn-ja');
    var ben = document.getElementById('btn-en');
    if (bja) bja.classList.toggle('active', lang === 'ja');
    if (ben) ben.classList.toggle('active', lang === 'en');

    applyDom(lang);

    // お問い合わせは、言語ごとに別のフォームへ送る
    var contactLinks = document.querySelectorAll('[data-i18n-href="url.contact"]');
    Array.prototype.forEach.call(contactLinks, function (a) {
      a.setAttribute('href', t('url.contact', lang));
    });

    syncLinks(lang);

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* 保存できない環境は無視 */ }

    // アドレスバーの ?lang= も現在の言語に合わせる（履歴は増やさない）
    try {
      var url = new URL(location.href);
      if (url.searchParams.get('lang') !== lang) {
        url.searchParams.set('lang', lang);
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    } catch (e) { /* file:// など置き換えできない環境は無視 */ }

    listeners.forEach(function (fn) {
      try { fn(lang); } catch (e) { console.error('[i18n] listener error', e); }
    });
  }

  function get() { return current; }

  function onChange(fn) {
    if (typeof fn !== 'function') return;
    listeners.push(fn);
  }

  /* ---------- 公開 ---------- */
  /* ------------------------------------------------------------
     金額の表示
     ------------------------------------------------------------
     ホストが自分の通貨で値段を付けられるようにする。
     換算はしない（為替レートを取りに行くと、お金も手間もかかるうえ、
     「いくら払うのか」が実際とずれる）。
     ホストが書いた通貨で、そのまま見せる。

     書き方は Intl.NumberFormat に任せる。
     円は小数点なし、ドルは $、ユーロは €、というような違いを
     自分で表を作って持たなくて済む。
     ------------------------------------------------------------ */
  var CURRENCIES = ['JPY','USD','EUR','GBP','AUD','CAD','SGD','KRW'];

  function money(amount, currency, lang) {
    var n = Number(amount);
    if (!isFinite(n)) n = 0;
    var cur = (CURRENCIES.indexOf(currency) !== -1) ? currency : 'JPY';
    var loc = ((lang || current) === 'en') ? 'en-US' : 'ja-JP';
    // 端数が無いときは小数点以下を出さない（$7,000.00 より $7,000 の方が読みやすい）
    var whole = (n % 1 === 0);
    try {
      return new Intl.NumberFormat(loc, {
        style: 'currency', currency: cur,
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2
      }).format(n);
    } catch (e) {
      // 古い環境で Intl が通貨を知らない場合の逃げ道
      return cur + ' ' + n.toLocaleString();
    }
  }

  window.TriArk.i18n = {
    get: get,
    money: money,
    currencies: CURRENCIES,
    set: set,
    t: t,
    pick: pick,
    pickList: pickList,
    pickObjList: pickObjList,
    langLine: langLine,
    basedLine: basedLine,
    onChange: onChange,
    dict: DICT,
    langs: LANGS
  };

  // 既存ページの onclick="setLang('en')" をそのまま動かすための橋渡し
  window.setLang = set;

  /* ---------- 起動 ----------
     DOMContentLoaded で走らせる。
     ページ固有のスクリプトは先に実行されるので、
     onChange の登録が間に合う。 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { set(detect()); });
  } else {
    set(detect());
  }
})();
