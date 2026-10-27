// Tabla de clientes, carga de Excel y eventos de la página
const S = { pct:15, round:0, area:'379', tpl:DEFAULT_TPL, gastos:0, flete:0, maxFin:25000000, tasa:0 };
try { Object.assign(S, JSON.parse(localStorage.getItem('trh_settings_v2') || '{}')); } catch(e){}
const saveS = () => { try { localStorage.setItem('trh_settings_v2', JSON.stringify(S)); } catch(e){} };

let ROWS = [];


/* ---------- filas ---------- */
const offerItem = r => ({ id:r.id, label:offerLabel(r), sub:fmt(r.z * 1000) });
const OFFER_ITEMS = DATA.filter(r => r.z).map(offerItem);

function usedPrice(r){ const u = BYID[r.usedId]; return (u && r.year && u.v[r.year]) ? u.v[r.year] * 1000 : null; }
function toma(r){
  const p = usedPrice(r); if (p == null) return null;
  let v = p * (1 - S.pct / 100);
  if (S.round) v = Math.round(v / S.round) * S.round;
  return Math.round(v);
}
const eff = (ov, def) => ov != null ? ov : def;
function listPrice(r){ if (r.precio != null) return r.precio; const o = BYID[r.offerId]; return o ? o.z * 1000 : null; }
function calc(r){
  return calcOperacion({ usado: toma(r), precioLista: listPrice(r), gastos: eff(r.gastos, S.gastos), flete: eff(r.flete, S.flete),
                         maxFin: eff(r.maxFin, S.maxFin), tasa: eff(r.tasa, S.tasa) });
}
function autoMsg(r){
  const c = calc(r), o = BYID[r.offerId], m = v => v != null ? fmt(v) : '$—';
  return fillTpl(S.tpl, {
    cliente: titleCase(r.cliente), vehiculo: r.veh, valor: m(toma(r)), oferta: o ? offerLabel(o) : 'Modelo 0 km',
    precio_nuevo: m(c && c.precioNuevo), diferencia: m(c && c.diferencia), financiacion: m(c && c.financiado),
    tasa: fmtTasa(c ? c.tasa : eff(r.tasa, S.tasa)), saldo: m(c && c.saldo)
  });
}
function recompute(r){
  const m = matchUsed(r.veh, r.year);
  r.usedId = m.row ? m.row.id : null; r.review = m.review;
  const o = matchOffer(r.veh, m.row);
  r.offerId = o ? o.id : null;
}

function buildRow(r){
  const tr = document.createElement('tr'); r.tr = tr;
  const tdC = el('td'), tdV = el('td'), tdT = el('td'), tdO = el('td'), tdU = el('td'), tdF = el('td'), tdM = el('td'), tdA = el('td');
  tr.append(tdC, tdV, tdT, tdO, tdU, tdF, tdM, tdA);

  tdC.append(el('div','cli', r.cliente || '—'));

  tdV.append(el('div','veh-text', r.veh));
  const yr = el('div','yr'); yr.append('Año');
  const yi = el('input'); yi.type = 'number'; yi.min = 1990; yi.max = 2030; yi.value = r.year || ''; yr.append(yi);
  yi.addEventListener('change', () => { r.year = yi.value ? +yi.value : null; r.msg = null; recompute(r); refresh(r); });
  tdV.append(yr);

  r.phoneN = normPhone(r.tel, S.area);
  tdT.append(el('div','tel-n', r.tel || '—'));
  r.telNote = el('div','small'); tdT.append(r.telNote);

  r.offerCombo = makeCombo({ getItems: () => OFFER_ITEMS, placeholder: 'Escribí o elegí un modelo…',
    onPick: it => { r.offerId = it.id; r.precio = null; refresh(r); } });
  tdO.append(r.offerCombo.root);
  r.offerNote = el('div','small cellnote'); tdO.append(r.offerNote);
  const num = (key, opts) => { const n = numInput({ ...opts, onSet: v => { r[key] = v; refresh(r); } }); return n; };
  r.fPrecio = num('precio'); r.fGastos = num('gastos'); r.fFlete = num('flete');
  const grid = el('div','mgrid');
  grid.append(field('Precio 0 km ($)', r.fPrecio.input, 'full'), field('Gastos administrativos ($)', r.fGastos.input), field('Flete y formulario ($)', r.fFlete.input));
  r.total = el('div','totalline');
  tdO.append(grid, r.total, el('div','small cellnote','Vacío = valor general de arriba'));

  r.amount = el('div','amount'); r.formula = el('div','small');
  r.usedCombo = makeCombo({
    getItems: () => r.year ? DATA.filter(x => x.v[r.year]).map(x => ({ id:x.id, label:usedLabel(x), sub:fmt(x.v[r.year]*1000) })) : [],
    placeholder: 'Buscar versión en CCA…', emptyMsg: 'No hay versiones CCA para ese año',
    onPick: it => { r.usedId = it.id; r.review = false; refresh(r); } });
  r.badge = el('span','badge','revisar coincidencia');
  const uw = el('div','cellnote'); uw.append(r.usedCombo.root);
  tdU.append(r.amount, r.formula, uw, r.badge);

  r.fMax = num('maxFin'); r.fTasa = num('tasa', { decimal: true });
  const fgrid = el('div','mgrid');
  fgrid.append(field('Tope financiable ($)', r.fMax.input, 'full'), field('Tasa (%)', r.fTasa.input));
  r.finRes = el('div','small cellnote');
  tdF.append(fgrid, r.finRes, el('div','small cellnote','Vacío = valor general de arriba'));

  r.ta = el('textarea','msg'); r.ta.spellcheck = false;
  r.ta.addEventListener('focus', () => { r.ta.style.height = Math.min(r.ta.scrollHeight + 4, 460) + 'px'; });
  r.ta.addEventListener('blur', () => { r.ta.style.height = ''; });
  r.ta.addEventListener('input', () => { r.msg = r.ta.value; r.resetBtn.classList.remove('hidden'); });
  r.resetBtn = el('button','reset hidden','↺ restablecer mensaje'); r.resetBtn.type = 'button';
  r.resetBtn.addEventListener('click', () => { r.msg = null; refresh(r); });
  tdM.append(r.ta, r.resetBtn);

  r.btn = el('button','btn send','Enviar'); r.btn.type = 'button';
  r.btn.addEventListener('click', () => send(r));
  r.btnNote = el('div','small cellnote');
  tdA.append(r.btn, r.btnNote);
  refresh(r);
  return tr;
}

function refresh(r){
  r.phoneN = normPhone(r.tel, S.area);
  r.telNote.className = r.phoneN ? 'small' : 'bad';
  r.telNote.textContent = r.phoneN ? '→ +' + r.phoneN.replace(/^549(\d{3})(\d+)$/, '54 9 $1 $2') : 'Revisar número';

  const o = BYID[r.offerId], u = BYID[r.usedId];
  r.offerCombo.set(o ? offerItem(o) : null);
  r.offerNote.textContent = o ? '' : 'No se encontró equivalente: elegí un modelo';
  const lp = listPrice(r);
  r.fPrecio.set(lp, null); r.fGastos.set(r.gastos, S.gastos); r.fFlete.set(r.flete, S.flete);
  r.fMax.set(r.maxFin, S.maxFin); r.fTasa.set(r.tasa, S.tasa);

  r.usedCombo.set(u ? { id:u.id, label:usedLabel(u) } : null);
  const p = usedPrice(r), t = toma(r);
  if (t != null) {
    r.amount.className = 'amount'; r.amount.textContent = fmt(t);
    r.formula.textContent = 'CCA ' + PERIOD + ': ' + fmt(p) + ' − ' + S.pct + '%' + (S.round ? ' (redondeado)' : '');
  } else {
    r.amount.className = 'amount none';
    r.amount.textContent = r.year ? 'Sin valor CCA' : 'Falta el año';
    r.formula.textContent = r.year ? 'No hay versión CCA con valor para ' + r.year : 'Indicá el año del vehículo';
  }
  r.badge.classList.toggle('hidden', !(r.review && t != null));

  const c = calc(r);
  r.total.textContent = c ? 'Total 0 km: ' + fmt(c.precioNuevo) : '';
  r.finRes.textContent = c ? 'Financia ' + fmt(c.financiado) + ' · saldo ' + fmt(c.saldo) : '';

  if (r.msg == null) { r.ta.value = autoMsg(r); r.resetBtn.classList.add('hidden'); }
  else { r.ta.value = r.msg; r.resetBtn.classList.remove('hidden'); }

  const ok = !!r.phoneN && !!c;
  r.btn.disabled = !ok;
  r.btn.textContent = r.sent ? 'Enviado ✓' : 'Enviar';
  r.btn.classList.toggle('done', !!r.sent);
  r.btnNote.textContent = !r.phoneN ? 'Teléfono inválido' : (t == null ? 'Falta valor de toma' : (!c ? 'Falta precio 0 km' : ''));
  r.tr.classList.toggle('sent', !!r.sent);
  updateStats();
}

function send(r){
  const msg = r.ta.value;
  window.open('https://wa.me/' + r.phoneN + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  r.sent = true; refresh(r);
}

function updateStats(){
  const n = ROWS.length, v = ROWS.filter(r => toma(r) != null).length, s = ROWS.filter(r => r.sent).length, rv = ROWS.filter(r => r.review && toma(r) != null).length;
  $('stats').innerHTML = '';
  const add = (b, t) => { const sp = el('span'); sp.append(Object.assign(el('b'), { textContent: b }), ' ' + t); $('stats').append(sp); };
  add(n, 'clientes'); add(v, 'con valor de toma'); if (rv) add(rv, 'para revisar'); add(s, 'enviados');
}

function render(){
  const tb = $('tb'); tb.innerHTML = '';
  const frag = document.createDocumentFragment();
  ROWS.forEach(r => frag.append(buildRow(r)));
  tb.append(frag);
  $('empty').classList.add('hidden'); $('app').classList.remove('hidden');
  applyFilter();
}
function applyFilter(){
  const q = norm($('q').value).trim();
  ROWS.forEach(r => r.tr && r.tr.classList.toggle('hidden', !!q && !r.hay.includes(q)));
}

/* ---------- carga de datos ---------- */
function makeRows(list){
  ROWS = list.map(x => {
    const r = { cliente: x.cliente, veh: x.veh, tel: x.tel, year: x.year || detectYear(x.veh), msg: null, sent: false };
    r.hay = norm(r.cliente + ' ' + r.veh);
    recompute(r); return r;
  });
  render();
}
function parseSheet(aoa){
  aoa = aoa.filter(row => row && row.some(c => String(c == null ? '' : c).trim() !== ''));
  if (!aoa.length) throw new Error('El archivo está vacío.');
  let hi = -1, map = {};
  for (let i = 0; i < Math.min(5, aoa.length); i++) {
    const m = {};
    aoa[i].forEach((c, j) => {
      const h = norm(c).trim(); if (!h) return;
      if (/^(ANO|YEAR|MY|MODELO ANO|ANO MODELO)\b/.test(h) && m.year == null) m.year = j;
      else if (/CLIENT|NOMBRE|APELLIDO|TITULAR|RAZON/.test(h) && m.cli == null) m.cli = j;
      else if (/MODELO|VEHIC|AUTO|UNIDAD|DESCRIP|VERSION/.test(h) && m.veh == null) m.veh = j;
      else if (/TEL|CEL|WHATS|MOVIL|CONTACTO/.test(h) && m.tel == null) m.tel = j;
    });
    if (m.veh != null && (m.cli != null || m.tel != null)) { hi = i; map = m; break; }
  }
  let data;
  if (hi >= 0) data = aoa.slice(hi + 1);
  else { map = { cli:0, veh:1, tel:2 }; data = aoa; }
  const out = data.map(row => ({
    cliente: String(row[map.cli] == null ? '' : row[map.cli]).trim(),
    veh: String(row[map.veh] == null ? '' : row[map.veh]).trim(),
    tel: String(row[map.tel] == null ? '' : row[map.tel]).trim(),
    year: map.year != null && /^\d{4}$/.test(String(row[map.year]).trim()) ? +String(row[map.year]).trim() : null
  })).filter(x => x.veh || x.cliente);
  if (!out.length) throw new Error('No encontré filas con datos.');
  return out;
}
function handleFile(file){
  if (!file) return;
  if (typeof XLSX === 'undefined') { toast('No se pudo cargar el lector de Excel (¿sin conexión?). Probá de nuevo con internet.'); return; }
  const fr = new FileReader();
  fr.onload = e => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type:'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(ws, { header:1, raw:true, defval:'' });
      makeRows(parseSheet(aoa));
      $('fname').textContent = file.name;
    } catch (err) { toast('No pude leer el archivo: ' + err.message); }
  };
  fr.readAsArrayBuffer(file);
}
const SAMPLE = [
  ['MARIA ELENA', 'HILUX 4X2 D/C SRV 2.8 TDI 6 M/T MY´20', '3790000001'],
  ['JUAN PEREZ', 'COROLLA XLI 2023', '3790000002'],
  ['LUCIA FERNANDEZ', 'COROLLA CROSS 2.0 XEI CVT MY´22', '0379 15 4000003'],
  ['CARLOS RAMIREZ', 'ETIOS 1.5 XLS 2018', '+54 9 379 000-0004'],
  ['ANA BENITEZ', 'YARIS 1.5 S CVT MY´22', '3790000005'],
  ['ROBERTO SOSA', 'HILUX SW4 SRX 2.8 4X4 6AT 7A MY´21', '3790000006']
].map(a => ({ cliente:a[0], veh:a[1], tel:a[2] }));

/* ---------- eventos ---------- */
$('period').textContent = 'Valores CCA · ' + PERIOD;
$('pick').onclick = $('pick2').onclick = () => $('file').click();
$('file').onchange = e => { handleFile(e.target.files[0]); e.target.value = ''; };
$('demo').onclick = () => { makeRows(SAMPLE); $('fname').textContent = 'Datos de ejemplo (ficticios)'; };
['dragover','dragenter'].forEach(ev => window.addEventListener(ev, e => { e.preventDefault(); $('empty').classList.add('over'); }));
['dragleave','drop'].forEach(ev => window.addEventListener(ev, e => { e.preventDefault(); $('empty').classList.remove('over'); }));
window.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));
$('q').addEventListener('input', applyFilter);

$('pct').value = S.pct; $('round').value = String(S.round); $('area').value = S.area; $('tpl').value = S.tpl;
const reAll = () => { saveS(); ROWS.forEach(refresh); };
$('pct').addEventListener('input', () => { const v = parseFloat($('pct').value); S.pct = isNaN(v) ? 0 : Math.min(90, Math.max(0, v)); reAll(); });
$('round').addEventListener('change', () => { S.round = +$('round').value; reAll(); });
$('area').addEventListener('input', () => { S.area = $('area').value.replace(/\D/g,''); reAll(); });
$('tpl').addEventListener('input', () => { S.tpl = $('tpl').value; reAll(); });
$('tplreset').onclick = () => { S.tpl = DEFAULT_TPL; $('tpl').value = S.tpl; reAll(); };

function bindGlobal(key, decimal){
  const n = numInput({ decimal, onSet: v => { S[key] = v == null ? 0 : v; reAll(); } });
  n.input.className = decimal ? 'w60' : 'w120'; n.set(S[key]);
  $('g-' + key).append(n.input);
}
bindGlobal('maxFin'); bindGlobal('tasa', true); bindGlobal('gastos'); bindGlobal('flete');
