// EndfieldTextGenerator-web — Web port of EndfieldTextGenerator
// Copyright (C) 2024 RSPqfgn
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
