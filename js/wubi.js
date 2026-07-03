const wubiDict98 = (() => {
  let dict = null;
  let loading = null;
  return {
    async load() {
      if (dict) return dict;
      if (loading) return loading;
      loading = (async () => {
        const resp = await fetch('wubi_98.json');
        dict = await resp.json();
        return dict;
      })();
      return loading;
    },
    get() { return dict; }
  };
})();

const RE_HANS = /^[\u3007\u4e00-\ufa29]+$/;

function isChineseChar(ch) {
  return '\u4e00' <= ch && ch <= '\u9fff';
}

function singleSeg(chars) {
  const res = [];
  let s = '';
  for (const c of chars) {
    if (RE_HANS.test(c)) {
      if (s) { res.push(s); s = ''; }
      res.push(c);
    } else {
      s += c;
    }
  }
  if (s) res.push(s);
  return res;
}

function singleWubi(han) {
  const dict = wubiDict98.get();
  if (!dict) return han;
  const codes = dict[han];
  if (!codes) return han;
  return codes[0];
}

function wubi(hans) {
  const res = [];
  const hanList = singleSeg(hans);
  for (const han of hanList) {
    if (RE_HANS.test(han)) {
      res.push(singleWubi(han));
    } else {
      res.push(han);
    }
  }
  return res;
}
