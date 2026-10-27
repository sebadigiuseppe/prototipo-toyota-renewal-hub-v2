// Utilidades de DOM y avisos
const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
function toast(msg){ const t = $('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => t.style.display = 'none', 4200); }

// Campo numérico con separador de miles (es-AR). set(valor, placeholder) no pisa lo que se está tipeando.
function numInput({ decimal = false, onSet }){
  const inp = el('input'); inp.type = 'text'; inp.inputMode = decimal ? 'decimal' : 'numeric'; inp.autocomplete = 'off';
  const show = v => v == null ? '' : (decimal ? String(v).replace('.', ',') : Math.round(v).toLocaleString('es-AR'));
  const parse = () => {
    const t = inp.value.trim(); if (!t) return null;
    if (decimal) { const v = parseFloat(t.replace(',', '.').replace(/[^\d.]/g, '')); return isNaN(v) ? null : v; }
    const d = t.replace(/\D/g, ''); return d ? +d : null;
  };
  inp.addEventListener('input', () => onSet(parse()));
  inp.addEventListener('blur', () => { inp.value = show(parse()); });
  return { input: inp, set(val, ph){ if (document.activeElement !== inp) inp.value = show(val); inp.placeholder = show(ph); } };
}
function field(label, node, cls){ const d = el('div', 'mf' + (cls ? ' ' + cls : '')); d.append(el('label', null, label), node); return d; }
