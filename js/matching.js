// Normalización de textos y coincidencia de modelos contra la CCA (usado y 0 km).
const DATA = CCA.rows;
const PERIOD = CCA.period;
const BYID = Object.fromEntries(DATA.map(r => [r.id, r]));

const STOP = new Set(['TOYOTA','PICK','UP','AUT','SAFETY','SENSE','HAR','4P','5P','3P','2P','MY','DE','CON','Y','-']);
const FAMWORDS = new Set(['HILUX','SW4','COROLLA','CROSS','YARIS','ETIOS','HIACE','INNOVA','PRIUS','CAMRY','CROWN','RAV4','CHR','BZ4X','LAND','CRUISER','PRADO','86','GR86']);
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
  t = t.replace(/\b\d\s*(MT|AT)\b/g,'$1');
  t = t.replace(/\b4\s*X\s*([24])\b/g,'4X$1');
  t = t.replace(/\b(DOBLE CABINA|D\s*\/\s*C|DC)\b/g,'D/C').replace(/\b(CABINA SIMPLE|C\s*\/\s*S|CS)\b/g,'C/S').replace(/\bC\s*\/\s*C\b/g,'C/C');
  t = t.replace(/\b(HYBRID|HIBRIDO|HEV|HV)\b/g,'HEV');
  t = t.replace(/\bSE[\s-]G\b/g,'SEG').replace(/\bGR[\s-]?SPORT\b/g,'GRS').replace(/\bGR[\s-]?S\b/g,'GRS');
  t = t.replace(/\bSW\s*4\b/g,'SW4').replace(/\bRAV\s*-?\s*4\b/g,'RAV4').replace(/\bC\s*-?\s*HR\b/g,'CHR').replace(/\bBZ\s*4\s*X\b/g,'BZ4X');
  t = t.replace(/\s*\+\s*/g,' + ');
  return t.split(/[^A-Z0-9,\/+']+/).filter(x => x && !STOP.has(x) && !FAMWORDS.has(x));
}
const FAM_RULES = [
  [/\bSW\s*4\b/, ['HILUX SW4']],
  [/\bHILUX\b/, ['HILUX PICK - UP','HILUX PICK - UP COVER']],
  [/COROLLA\s*CROSS/, ['COROLLA CROSS']],
  [/\bCOROLLA\b/, ['COROLLA']],
  [/YARIS\s*CROSS/, ['YARIS CROSS']],
  [/\bYARIS\b/, ['YARIS']],
  [/ETIOS\s*CROSS/, ['ETIOS CROSS']],
  [/\bETIOS\b/, ['ETIOS']],
  [/\bHIACE\b/, ['HIACE']],
  [/\bINNOVA\b/, ['INNOVA']],
  [/\bPRIUS\b/, ['PRIUS']],
  [/\bCAMRY\b/, ['CAMRY']],
  [/\bCROWN\b/, ['CROWN']],
  [/\bRAV\s*-?\s*4\b/, ['RAV - 4']],
  [/\bC\s*-?\s*HR\b/, ['C - HR']],
  [/\bBZ\s*4\s*X\b/, ['bZ4X']],
  [/LAND\s*CRUISER|\bPRADO\b/, ['LAND CRUISER']],
  [/\bGR\s*86\b|\b86\b/, ['86']]
];
function detectFamily(text){
  const t = norm(text);
  for (const [re, fams] of FAM_RULES) if (re.test(t)) return fams;
  return null;
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
function matchUsed(text, year){
  if (!year) return { row:null, review:true };
  const fam = detectFamily(text);
  const q = tokens(text);
  const cands = DATA.filter(r => r.v[year] && (!fam || fam.includes(r.f)));
  if (!cands.length) return { row:null, review:true };
  const sc = cands.map(r => { const prox = Math.abs(seriesYear(r.d, year) - year); return { r, s0: score(q, tokens(r.d)), prox }; })
    .sort((a,b) => (b.s0 - 0.01 * b.prox) - (a.s0 - 0.01 * a.prox));
  const best = sc[0], second = sc[1];
  const review = !fam || best.s0 < 2 || (!!second && best.s0 - second.s0 < 1 && !(best.prox === 0 && second.prox > 0));
  return { row: best.r, review };
}
const OFFER_FALLBACK = { 'ETIOS':['YARIS'], 'ETIOS CROSS':['YARIS'], 'C - HR':['COROLLA CROSS'], 'CAMRY':['COROLLA'], 'HILUX PICK - UP COVER':['HILUX PICK - UP'] };
function matchOffer(text, used){
  let fam = detectFamily(text);
  if (!fam && used) fam = [used.f];
  const offers = DATA.filter(r => r.z);
  let pool = fam ? offers.filter(r => fam.includes(r.f)) : [];
  if (!pool.length && fam) for (const f of fam) { const fb = OFFER_FALLBACK[f]; if (fb) pool = offers.filter(r => fb.includes(r.f)); if (pool.length) break; }
  if (!pool.length) return null;
  const q = [...new Set([...tokens(text), ...(used ? tokens(used.d) : [])])];
  return pool.map(r => ({ r, s: score(q, tokens(r.d)) })).sort((a,b) => b.s - a.s || a.r.z - b.r.z)[0].r;
}
