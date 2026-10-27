// Formato de importes, nombres de modelos y armado del mensaje de WhatsApp
const fmt = n => '$' + Math.round(n).toLocaleString('es-AR');
function famLabel(f){ return ({ 'HILUX PICK - UP':'HILUX', 'HILUX PICK - UP COVER':'HILUX COVER', 'RAV - 4':'RAV4', 'C - HR':'C-HR' })[f] || f; }
function offerLabel(r){ return (famLabel(r.f) + ' ' + r.d).replace(/\s+(19|20)\d{2}$/,'').replace(/\s+/g,' ').trim(); }
function usedLabel(r){ return (famLabel(r.f) + ' ' + r.d).replace(/\s+/g,' ').trim(); }
function fillTpl(tpl, vars){
  return Object.keys(vars).reduce((t, k) => t.replaceAll('{' + k + '}', vars[k]), tpl);
}
const fmtTasa = n => (n || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 });
function titleCase(s){
  const low = new Set(['de','del','la','las','los','y','e']);
  return String(s || '').trim().toLowerCase().split(/\s+/).map((w, i) => (i && low.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const DEFAULT_TPL = `Hola {cliente}, te cuento una propuesta para renovar tu {vehiculo}.

* Valor estimado de tu usado: {valor}
* {oferta}: {precio_nuevo}
* Diferencia estimada: {diferencia}
* Financiación: hasta {financiacion} (TASA {tasa}%)
* Saldo restante estimado: {saldo}

Valores estimados: la toma final está sujeta a peritaje y la financiación a aprobación. ¿Te armo la propuesta completa?`;
