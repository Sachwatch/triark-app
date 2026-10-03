/* ============================================================
   船の資格・登録のきまり
   ------------------------------------------------------------
   プロフィールの入力欄（profile.html）と、
   体験を公開するときの確認（listing-edit.html）の
   両方から使うので、一箇所にまとめてある。

   ・陸  … ガイドに付随する送迎であれば、許可も免許も要らない
           （国自旅第359号。運送に対する反対給付がないこと）。
           だから入力欄は置かない。担保するのは
           「体験の中身を書かないと公開できない」という一点。
   ・海  … お金をいただいて人を乗せるなら、事業の登録が要る。
           登録がなければ違法なので、揃うまで公開させない。
   ・空  … 準備中。
   ============================================================ */
(function () {
  window.TriArk = window.TriArk || {};

  /* 海の事業登録。どれか1つを持っていればよい */
  var SEA_BIZ = ['futeiki', 'ryokakuFutei', 'yugyosen'];

  /* 1艘ぶんの船が、公開に足りているか。
     足りないものの札（'biz' | 'lic' | 'ins'）を返す。空なら揃っている */
  function missingOf(v) {
    var out = [];
    if (!v || SEA_BIZ.indexOf(v.seaBizKind) === -1 || !String(v.seaBizNo || '').trim()) out.push('biz');
    if (!v || !String(v.seaLicNo || '').trim()) out.push('lic');
    if (!v || !v.seaInsOk) out.push('ins');
    return out;
  }

  /* Ark の一覧から、海の体験を公開できるかを見る。
     ・海の Ark が1艘もなければ ['none']
     ・1艘でも揃っていれば []（その船で出せばよい）
     ・揃っている船が1つも無ければ、いちばん惜しい船の足りない分を返す */
  function missingSea(vehicles) {
    var boats = (vehicles || []).filter(function (v) { return v && v.type === 'sea'; });
    if (!boats.length) return ['none'];

    var best = null;
    for (var i = 0; i < boats.length; i++) {
      var m = missingOf(boats[i]);
      if (!m.length) return [];
      if (!best || m.length < best.length) best = m;
    }
    return best;
  }

  /* Ark の配列から種類だけ取り出す */
  function typesOf(vehicles) {
    var out = [];
    (vehicles || []).forEach(function (v) {
      var t = (v && v.type) || 'land';
      if (out.indexOf(t) === -1) out.push(t);
    });
    return out;
  }

  window.TriArk.certs = {
    SEA_BIZ: SEA_BIZ,
    missingOf: missingOf,
    missingSea: missingSea,
    typesOf: typesOf
  };
})();
