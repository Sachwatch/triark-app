/* ============================================================
   TriArk weather — 天気と気象警報
   ------------------------------------------------------------
   ・天気は Open-Meteo（鍵不要・非商用は無料）
   ・警報・注意報は気象庁の防災情報JSON
     （正式なAPIではなく、サイト表示用データ。商用化時は有料APIへ）

   出典の表示が必要なので、使う画面には必ず出典を出すこと。
   ============================================================ */

/* ---------- 天気（Open-Meteo） ---------- */
export async function fetchWeather(lat, lng) {
  const url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=' + lat + '&longitude=' + lng
    + '&current=temperature_2m,weather_code,wind_speed_10m'
    + '&timezone=Asia%2FTokyo';
  const res = await fetch(url);
  const j = await res.json();
  const c = j.current || {};
  return {
    temp : Math.round(c.temperature_2m),
    wind : Math.round(c.wind_speed_10m),   // km/h
    code : c.weather_code
  };
}

/* WMOの天気コードを、絵文字と辞書キーに変換する */
export function weatherFace(code) {
  if (code === 0)                      return { icon: '☀️', key: 'wx.clear'   };
  if (code === 1 || code === 2)        return { icon: '🌤',  key: 'wx.partly'  };
  if (code === 3)                      return { icon: '☁️', key: 'wx.cloudy'  };
  if (code === 45 || code === 48)      return { icon: '🌫',  key: 'wx.fog'     };
  if (code >= 51 && code <= 57)        return { icon: '🌦',  key: 'wx.drizzle' };
  if (code >= 61 && code <= 67)        return { icon: '🌧',  key: 'wx.rain'    };
  if (code >= 71 && code <= 77)        return { icon: '🌨',  key: 'wx.snow'    };
  if (code >= 80 && code <= 82)        return { icon: '🌧',  key: 'wx.showers' };
  if (code >= 85 && code <= 86)        return { icon: '🌨',  key: 'wx.snow'    };
  if (code >= 95)                      return { icon: '⛈',  key: 'wx.thunder' };
  return { icon: '🌡', key: 'wx.unknown' };
}

/* ---------- 気象庁の警報・注意報 ---------- */

/* 警報・注意報コードの名前（気象庁の区分） */
const WARNING_NAMES = {
  '02':'暴風雪警報', '03':'大雨警報',   '04':'洪水警報',   '05':'暴風警報',
  '06':'大雪警報',   '07':'波浪警報',   '08':'高潮警報',
  '10':'大雨注意報', '12':'大雪注意報', '13':'風雪注意報', '14':'雷注意報',
  '15':'強風注意報', '16':'波浪注意報', '17':'融雪注意報', '18':'洪水注意報',
  '19':'高潮注意報', '20':'濃霧注意報', '21':'乾燥注意報', '22':'なだれ注意報',
  '23':'低温注意報', '24':'霜注意報',   '25':'着氷注意報', '26':'着雪注意報',
  '27':'その他の注意報',
  '32':'暴風雪特別警報', '33':'大雨特別警報', '35':'暴風特別警報',
  '36':'大雪特別警報',   '37':'波浪特別警報', '38':'高潮特別警報'
};

/* ---------- 気象庁の地域区分 ----------
   offices（都道府県など）→ class10s → class15s → class20s（市区町村）の入れ子。
   一度読んだら使い回す。 */
let areaTable = null;
export async function loadAreaTable() {
  if (areaTable) return areaTable;
  const res = await fetch('https://www.jma.go.jp/bosai/common/const/area.json');
  areaTable = await res.json();
  return areaTable;
}

/** ある都道府県（office）に属する市区町村の一覧 */
export function citiesOf(table, officeCode) {
  const office = (table.offices || {})[officeCode];
  if (!office) return [];
  const out = [];
  (office.children || []).forEach(c10 => {
    const a = (table.class10s || {})[c10];
    (a && a.children || []).forEach(c15 => {
      const b = (table.class15s || {})[c15];
      (b && b.children || []).forEach(c20 => {
        const c = (table.class20s || {})[c20];
        if (c) out.push({ code: c20, name: c.name, enName: c.enName || '' });
      });
    });
  });
  return out.sort((x, y) => (x.code > y.code ? 1 : -1));
}

/** 市区町村コードから、それが属する office をたどる */
export function officeOfCity(table, cityCode) {
  const c = (table.class20s || {})[cityCode];
  if (!c) return '';
  const b = (table.class15s || {})[c.parent];
  const a = b ? (table.class10s || {})[b.parent] : null;
  return a ? a.parent : '';
}

/** 総務省の市区町村コード（5桁）を気象庁の市区町村コード（7桁）に直す。
    政令指定都市の区は、気象庁では市の単位で扱われるので、市のコードに寄せる。 */
export function jmaCityFromMuni(table, muniCd) {
  if (!muniCd) return '';
  const c20 = table.class20s || {};
  const direct = muniCd + '00';
  if (c20[direct]) return direct;
  const city = muniCd.slice(0, 4) + '0' + '00';
  if (c20[city]) return city;
  return '';
}

/** 発表中の警報・注意報を集める。特別警報・警報・注意報の順に並べる。
    cityCode を渡すと、その市区町村の発表だけを見る */
export async function fetchAlerts(areaCode, cityCode) {
  const url = 'https://www.jma.go.jp/bosai/warning/data/warning/' + areaCode + '.json';
  const res = await fetch(url);
  const data = await res.json();

  const found = new Map();   // 名前 → 重さ
  (data.areaTypes || []).forEach(at => {
    (at.areas || []).forEach(area => {
      if (cityCode && area.code !== cityCode) return;
      (area.warnings || []).forEach(w => {
        if (w.status === '解除' || w.status === '発表警報・注意報はなし') return;
        const name = WARNING_NAMES[w.code];
        if (!name) return;
        const weight = name.indexOf('特別警報') !== -1 ? 3
                     : name.indexOf('警報') !== -1 ? 2 : 1;
        found.set(name, weight);
      });
    });
  });

  const list = [...found.entries()].sort((a, b) => b[1] - a[1]);
  return {
    names : list.map(x => x[0]),
    level : list.length ? list[0][1] : 0   // 0=なし 1=注意報 2=警報 3=特別警報
  };
}

/* ---------- 乗り物ごとに、特に見るべき警報 ---------- */
const WATCH = {
  sea  : ['波浪','暴風','高潮','濃霧','雷'],
  land : ['大雨','大雪','暴風','洪水','なだれ','着雪'],
  air  : ['暴風','雷','濃霧','大雪']
};

/** その体験にとって重い警報だけを選ぶ */
export function relevant(names, type) {
  const keys = WATCH[type] || WATCH.land;
  return names.filter(n => keys.some(k => n.indexOf(k) !== -1));
}
