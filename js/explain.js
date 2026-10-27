// Detalle paso a paso de cómo se calculó la propuesta de una fila ("Ver cálculo")
function explainSteps(r){
  const u = BYID[r.usedId], o = BYID[r.offerId], p = usedPrice(r), t = toma(r), c = calc(r);
  const src = ov => ov != null ? 'valor propio de esta fila' : 'valor general';
  const sgn = n => (n < 0 ? '− ' : '+ ') + fmt(Math.abs(n));
  const steps = [];
  steps.push({ k:'info', a:'Vehículo del cliente', b: r.veh + (r.year ? ' · año ' + r.year : ' · sin año') });
  if (!u || p == null) {
    steps.push({ k:'warn', a:'Valor de toma', b: r.year ? 'No hay una versión CCA con valor para el año ' + r.year + '. Probá corregir el año o elegir otra versión.' : 'Falta indicar el año del vehículo.' });
    return steps;
  }
  steps.push({ k:'row', a:'Precio CCA del usado', b: usedLabel(u) + ' · columna ' + r.year + ' · CCA ' + PERIOD + (r.review ? ' (coincidencia automática: conviene revisarla)' : ''), v: fmt(p) });
  const bruto = p * (1 - S.pct / 100);
  steps.push({ k:'row', a:'Descuento ' + S.pct + '%', b:'Precio CCA × (1 − ' + S.pct + '%)', v:'− ' + fmt(p * S.pct / 100) });
  if (S.round && Math.round(bruto) !== t) steps.push({ k:'row', a:'Redondeo', b:'A múltiplos de ' + fmt(S.round), v: sgn(t - bruto) });
  steps.push({ k:'total', a:'Valor de toma estimado', b:'Sujeto a peritaje', v: fmt(t) });
  if (!c) {
    steps.push({ k:'warn', a:'Modelo a ofrecer', b:'Falta el precio del 0 km. Elegí un modelo en la columna «Modelo a ofrecer» o escribí el precio.' });
    return steps;
  }
  steps.push({ k:'row', a:'Precio 0 km', b: (o ? offerLabel(o) : 'Modelo 0 km') + (r.precio != null ? ' · editado a mano' : ' · lista CCA ' + PERIOD), v: fmt(c.precioLista) });
  steps.push({ k:'row', a:'+ Gastos administrativos', b: src(r.gastos), v: fmt(c.gastos) });
  steps.push({ k:'row', a:'+ Flete y formulario', b: src(r.flete), v: fmt(c.flete) });
  steps.push({ k:'total', a:'Total 0 km', b:'Precio + gastos + flete', v: fmt(c.precioNuevo) });
  steps.push({ k:'row', a:'− Valor de toma', b:'', v: fmt(t) });
  steps.push({ k:'total', a:'Diferencia a cubrir', b: c.precioNuevo < t ? 'El usado vale más que el 0 km: no hay diferencia a cubrir' : 'Total 0 km − valor de toma', v: fmt(c.diferencia) });
  steps.push({ k:'row', a:'Tope financiable', b: src(r.maxFin), v: fmt(eff(r.maxFin, S.maxFin)) });
  steps.push({ k:'row', a:'Financiación · TASA ' + fmtTasa(c.tasa) + '%', b:'Lo menor entre el tope y la diferencia · tasa: ' + src(r.tasa), v: fmt(c.financiado) });
  steps.push({ k:'total', a:'Saldo restante estimado', b:'Diferencia − financiación', v: fmt(c.saldo) });
  return steps;
}
function renderExplain(r){
  const box = el('div','calcbox');
  box.append(el('div','calctitle','Cálculo de la propuesta · ' + (r.cliente || 'cliente')));
  const tb = el('table','calc'), body = el('tbody');
  explainSteps(r).forEach(s => {
    const tr = el('tr', s.k);
    tr.append(el('td','a', s.a), el('td','b', s.b || ''), el('td','v', s.v || ''));
    body.append(tr);
  });
  tb.append(body); box.append(tb);
  box.append(el('div','small','Valores estimados: la toma final está sujeta a peritaje y la financiación a aprobación.'));
  r.detCell.replaceChildren(box);
}
