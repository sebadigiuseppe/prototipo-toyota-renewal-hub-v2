// Normalización de textos y coincidencia de modelos contra la CCA (usado y 0 km).
const DATA = CCA.rows;
const PERIOD = CCA.period;
const BYID = Object.fromEntries(DATA.map(r => [r.id, r]));
const HOUSE_BRAND = 'TOYOTA';   // marca de la concesionaria: gana los empates y no se repite en las etiquetas

const STOP = new Set(['PICK','UP','AUT','SAFETY','SENSE','HAR','4P','5P','3P','2P','MY','DE','CON','Y','-']);
const TRIM = new Set(['XLI','XEI','SEG','GRS','DX','SR','SRV','SRX','DIAMOND','LIMITED','LIMTED','STD','XS','XLS','X','S','PLATINUM','AIBO','VX','TXL','LC','FT','GT','GR','XRS','XSE','SPORT']);
const isEng = t => /^\d,\d$/.test(t);
const CLASSES = [
  [t => t==='4X2'||t==='4X4', 7],
  [t => t==='MT'||t==='AT'||t==='CVT', 5],
  [t => t==='D/C'||t==='C/S'||t==='C/C', 6],
  [isEng, 7],
  [t => TRIM.has(t), 8],
  [t => t==='HEV', 6]
];
function w(t){
  if (TRIM.has(t) || t==='4X2' || t==='4X4') return 4;
  if (isEng(t) || t==='D/C' || t==='C/S' || t==='C/C' || t==='HEV') return 3;
  if (t==='MT' || t==='AT' || t==='CVT') return 2;
  return 1;
}
function norm(s){
  return String(s == null ? '' : s).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[´`’‘]/g,"'");
}
function detectYear(s){
  const t = norm(s);
  let m = t.match(/\bMY\s*'?\s*(\d{4}|\d{2})\b/);
  if (m) { const y = +m[1]; return y < 100 ? 2000 + y : y; }
  const all = [...t.matchAll(/\b(19[89]\d|20[0-3]\d)\b/g)];
  if (all.length) return +all[all.length-1][1];
  m = t.match(/'(\d{2})\b/);
  if (m) return 2000 + (+m[1]);
  return null;
}
function tokens(s){
  let t = norm(s);
  t = t.replace(/\bMY\s*'?\s*\d{2,4}\b/g,' ').replace(/\b(19[89]\d|20[0-3]\d)\b/g,' ').replace(/'\d{2}\b/g,' ');
  t = t.replace(/(\d)\.(\d)/g,'$1,$2');
  t = t.replace(/\bE[\s-]?CVT\b/g,'CVT');
  t = t.replace(/\bM\s*\/\s*T\b/g,'MT').replace(/\bA\s*\/\s*T\b/g,'AT');
  t = t.replace(/\b(MANUAL|MAN)\b/g,'MT').replace(/\b(AUTOMATICA|AUTOMATICO|AUT)\b/g,'AT');
  t = t.replace(/\b\d\s*(MT|AT)\b/g,'$1').replace(/\bM[56]\b/g,'MT');
  t = t.replace(/\b4\s*X\s*([24])\b/g,'4X$1');
  t = t.replace(/\b(DOBLE CABINA|D\s*\/\s*C|DC)\b/g,'D/C').replace(/\b(CABINA SIMPLE|C\s*\/\s*S|CS)\b/g,'C/S').replace(/\bC\s*\/\s*C\b/g,'C/C');
  t = t.replace(/\b(HYBRID|HIBRIDO|HEV|HV)\b/g,'HEV');
  t = t.replace(/\bSE[\s-]G\b/g,'SEG').replace(/\bGR[\s-]?SPORT\b/g,'GRS').replace(/\bGR[\s-]?S\b/g,'GRS');
  t = t.replace(/\bSW\s*4\b/g,'SW4').replace(/\bRAV\s*-?\s*4\b/g,'RAV4').replace(/\bC\s*-?\s*HR\b/g,'CHR').replace(/\bBZ\s*4\s*X\b/g,'BZ4X');
  t = t.replace(/\s*\+\s*/g,' + ');
  return t.split(/[^A-Z0-9,\/+']+/).filter(x => x && !STOP.has(x));
}
const rowTokens = r => r._t || (r._t = tokens(r.d));

/* ---- marcas y modelos (familias) detectados a partir de los datos de la CCA ---- */
const famTokens = s => norm(s).replace(/\s*-\s*/g,'').split(/[^A-Z0-9]+/).filter(Boolean);   // 'RAV - 4' -> RAV4, 'CR-V' -> CRV
const GENERIC_FAM = new Set(['PICKUP','PICK','UP']);
const BRAND_ALIAS = { VW:'VOLKSWAGEN', MERCEDES:'MERCEDES BENZ', BENZ:'MERCEDES BENZ', MB:'MERCEDES BENZ', LANDROVER:'LAND ROVER', CHEVY:'CHEVROLET',
                      MINI:'MINI COOPER', DS:'DS AUTOMOBILES', GWM:'GREAT WALL', ALFA:'ALFA ROMEO', MCLAREN:'McLAREN', LYNK:'LYNK&CO' };
const BRANDS = [...new Set(DATA.map(r => r.b))].map(b => ({ b, tk: famTokens(b) }));
const FAMS = (() => {
  const m = new Map();
  DATA.forEach(r => {
    const k = r.b + '|' + r.f;
    if (m.has(k)) return;
    const tk = famTokens(r.f);
    let core = tk.filter(x => !GENERIC_FAM.has(x)); if (!core.length) core = tk;
    // familias de 1-2 caracteres (ej. 'S', 'M') solo se reconocen si el texto nombra la marca
    m.set(k, { b: r.b, f: r.f, core, needsBrand: core.length === 1 && core[0].length <= 2 });
  });
  return [...m.values()];
})();
function detectFamilies(text){
  const t = norm(text).replace(/\bSW\s+4\b/g,'SW4').replace(/\bRAV\s+4\b/g,'RAV4').replace(/\bC\s+HR\b/g,'CHR').replace(/\b(CR|HR|WR)\s+V\b/g,'$1V');
  const T = new Set(famTokens(t));
  [...T].forEach(x => { const m = x.match(/^(\d+)([A-Z]+)$/) || x.match(/^([A-Z]+)(\d+)$/); if (m) { T.add(m[1]); T.add(m[2]); } });   // 320I -> 320 + I · C3 -> C + 3
  const named = new Set();
  BRANDS.forEach(B => { if (B.tk.length && B.tk.every(x => T.has(x))) named.add(B.b); });
  T.forEach(x => { if (BRAND_ALIAS[x] && BRANDS.some(B => B.b === BRAND_ALIAS[x])) named.add(BRAND_ALIAS[x]); });
  let cands = FAMS.filter(F => F.core.every(x => T.has(x)) && (!named.size || named.has(F.b)) && (!F.needsBrand || named.has(F.b)));
  const excl = new Set();
  BRANDS.forEach(B => { if (named.has(B.b)) B.tk.forEach(x => excl.add(x)); });
  Object.keys(BRAND_ALIAS).forEach(a => { if (T.has(a)) excl.add(a); });
  if (!cands.length) return { fams: [], brand: named.size === 1 ? [...named][0] : null, excl, ambiguous: false };
  const top = Math.max(...cands.map(F => F.core.length));
  cands = cands.filter(F => F.core.length === top);
  if (!named.size && cands.some(F => F.b === HOUSE_BRAND)) cands = cands.filter(F => F.b === HOUSE_BRAND);
  cands.forEach(F => F.core.forEach(x => excl.add(x)));
  return { fams: cands, brand: named.size === 1 ? [...named][0] : null, excl, ambiguous: cands.length > 1 };
}
function score(q, c){
  const qs = new Set(q), cs = new Set(c);
  let s = 0;
  for (const t of qs) s += cs.has(t) ? w(t) : -0.6 * w(t);
  for (const t of cs) if (!qs.has(t)) s -= 0.3 * w(t);
  for (const [pred, pen] of CLASSES) {
    const qa = [...qs].filter(pred), ca = [...cs].filter(pred);
    if (qa.length && ca.length && !qa.some(x => cs.has(x))) s -= pen;
  }
  if (qs.has('HEV') !== cs.has('HEV')) s -= 6;
  return s;
}
function seriesYear(d, fb){
  const m = d.match(/\b(19|20)\d{2}\b/g);
  return m ? +m[m.length-1] : fb;
}
const famKeySet = fams => new Set(fams.map(F => F.b + '|' + F.f));
// reason: 'noyear' | 'nofam' (modelo no reconocido) | 'nodata' (sin valor ese año) | 'usd' (la CCA lo publica en dólares)
function matchUsed(text, year){
  if (!year) return { row:null, review:true, reason:'noyear' };
  const d = detectFamilies(text);
  // sin modelo reconocible no se adivina: que lo elija la persona en el desplegable
  if (!d.fams.length) return { row:null, review:true, reason:'nofam' };
  const keys = famKeySet(d.fams);
  const all = DATA.filter(r => keys.has(r.b + '|' + r.f) && r.v[year]);
  const cands = all.filter(r => !r.u);
  if (!cands.length) return { row:null, review:true, reason: all.length ? 'usd' : 'nodata' };
  const q = tokens(text).filter(t => !d.excl.has(t));
  const sc = cands.map(r => { const prox = Math.abs(seriesYear(r.d, year) - year); return { r, s0: score(q, rowTokens(r)), prox }; })
    .sort((a,b) => (b.s0 - 0.01 * b.prox) - (a.s0 - 0.01 * a.prox));
  const best = sc[0], second = sc[1];
  const review = d.ambiguous || best.s0 < 2 || (!!second && best.s0 - second.s0 < 1 && !(best.prox === 0 && second.prox > 0));
  return { row: best.r, review };
}
// Modelos sin 0 km vigente que se reemplazan por otro de la línea actual
const OFFER_FALLBACK = {
  'TOYOTA|ETIOS': [['TOYOTA','YARIS']], 'TOYOTA|ETIOS CROSS': [['TOYOTA','YARIS']],
  'TOYOTA|C - HR': [['TOYOTA','COROLLA CROSS']], 'TOYOTA|CAMRY': [['TOYOTA','COROLLA']],
  'TOYOTA|HILUX PICK - UP COVER': [['TOYOTA','HILUX PICK - UP']]
};
function matchOffer(text, used){
  const d = detectFamilies(text);
  let fams = d.fams;
  if (!fams.length && used) fams = [{ b: used.b, f: used.f }];
  const offers = DATA.filter(r => r.z);
  let pool = offers.filter(r => fams.some(F => F.b === r.b && F.f === r.f));
  if (!pool.length) for (const F of fams) {
    const fb = OFFER_FALLBACK[F.b + '|' + F.f];
    if (fb) { pool = offers.filter(r => fb.some(x => r.b === x[0] && r.f === x[1])); if (pool.length) break; }
  }
  if (!pool.length) return null;
  const q = [...new Set([...tokens(text).filter(t => !d.excl.has(t)), ...(used ? rowTokens(used) : [])])];
  return pool.map(r => ({ r, s: score(q, rowTokens(r)) })).sort((a,b) => b.s - a.s || a.r.z - b.r.z)[0].r;
}
