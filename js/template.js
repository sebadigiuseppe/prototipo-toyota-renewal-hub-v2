// Formato de importes, nombres de modelos y armado del mensaje de WhatsApp
const fmt = n => '$' + Math.round(n).toLocaleString('es-AR');
function famLabel(f){ return String(f).replace(/\s*PICK - UP/,'').replace(/\s+-\s+/g,'-').trim(); }
const brandPrefix = r => r.b === HOUSE_BRAND ? '' : r.b + ' ';
const cleanSp = s => s.replace(/\s+/g,' ').trim();
function offerLabel(r){ return cleanSp(brandPrefix(r) + famLabel(r.f) + ' ' + r.d.replace(/\s+(19|20)\d{2}$/,'')); }
function usedLabel(r){ return cleanSp(brandPrefix(r) + famLabel(r.f) + ' ' + r.d); }
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
