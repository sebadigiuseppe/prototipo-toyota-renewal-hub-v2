// Formulario para agregar clientes a mano
// Sugerencias: versiones de la CCA sin el año de serie (el año del vehículo se completa aparte); se agrupan por nombre
const MODEL_ITEMS = (() => {
  const m = new Map();
  DATA.forEach(r => {
    const label = offerLabel(r), ys = Object.keys(r.v).map(Number);
    const e = m.get(label) || { id: label, label, lo: 9999, hi: 0 };
    if (ys.length) { e.lo = Math.min(e.lo, ...ys); e.hi = Math.max(e.hi, ...ys); }
    m.set(label, e);
  });
  return [...m.values()].map(e => ({ id: e.id, label: e.label, sub: e.hi ? (e.lo === e.hi ? String(e.lo) : e.lo + '–' + e.hi) : '' }));
})();
const vehCombo = makeCombo({ getItems: () => MODEL_ITEMS, free: true, placeholder: 'Ej.: COROLLA XLI · HILUX SRV 4X2',
  onPick: () => { M.year.focus(); } });
$('m-veh-slot').append(vehCombo.root);
const M = { cli: $('m-cli'), veh: vehCombo.input, year: $('m-year'), tel: $('m-tel'), err: $('m-err') };
function openManual(){
  Object.values(M).forEach(i => { if (i !== M.err) i.value = ''; });
  M.err.textContent = '';
  $('modal').classList.remove('hidden');
  M.cli.focus();
}
function closeManual(){ $('modal').classList.add('hidden'); }
function submitManual(){
  const cliente = M.cli.value.trim(), veh = M.veh.value.trim(), tel = M.tel.value.trim();
  const year = M.year.value ? +M.year.value : detectYear(veh);
  // si el texto no trae año, se lo agrega para que figure en el mensaje (ej. «COROLLA XLI 2023»)
  const vehFinal = detectYear(veh) ? veh : veh + ' ' + year;
  const fail = msg => { M.err.textContent = msg; };
  if (!cliente) return fail('Falta el nombre del cliente.');
  if (!veh) return fail('Falta el vehículo actual.');
  if (!year || year < 1990 || year > 2030) return fail('Indicá el año del vehículo (en el campo Año o dentro del texto, ej. 2023 o MY´20).');
  if (!normPhone(tel, S.area)) return fail('El teléfono no es válido. Probá con código de área, ej. 379 4123456.');
  addManual({ cliente, veh: vehFinal, tel, year: M.year.value ? +M.year.value : null });
  closeManual();
  toast('Cliente agregado');
}
$('addBtn').onclick = $('addBtn0').onclick = openManual;
$('m-cancel').onclick = closeManual;
$('m-add').onclick = submitManual;
$('modal').addEventListener('mousedown', e => { if (e.target === $('modal')) closeManual(); });
$('modal').addEventListener('keydown', e => {
  if (e.key === 'Escape') closeManual();
  else if (e.key === 'Enter') { e.preventDefault(); submitManual(); }
});
