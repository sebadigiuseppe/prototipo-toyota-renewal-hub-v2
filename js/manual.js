// Formulario para agregar clientes a mano
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
  // el vehículo es opcional: sin vehículo la fila queda sin cálculo del usado y se puede agregar después
  const year = !veh ? null : (M.year.value ? +M.year.value : detectYear(veh));
  // si el texto no trae año, se lo agrega para que figure en el mensaje (ej. «COROLLA XLI 2023»)
  const vehFinal = !veh ? '' : (detectYear(veh) ? veh : veh + ' ' + year);
  const fail = msg => { M.err.textContent = msg; };
  if (!cliente) return fail('Falta el nombre del cliente.');
  if (veh && (!year || year < 1990 || year > 2030)) return fail('Indicá el año del vehículo (en el campo Año o dentro del texto, ej. 2023 o MY´20).');
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
