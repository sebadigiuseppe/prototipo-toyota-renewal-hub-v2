// Campo con autocompletado + desplegable (modelo a ofrecer / versión CCA)
/* ---------- combobox ---------- */
const dd = $('dd'); let ddOwner = null;
function closeDD(){ dd.style.display = 'none'; ddOwner = null; }
function showDD(inp, items, active, pick, emptyMsg){
  ddOwner = inp; dd.innerHTML = '';
  if (!items.length) dd.append(el('div','empty', emptyMsg || 'Sin resultados'));
  items.forEach((it, i) => {
    const o = el('div', 'opt' + (i === active ? ' act' : ''));
    o.append(el('span','l', it.label), el('span','s', it.sub || ''));
    o.addEventListener('mousedown', e => { e.preventDefault(); pick(it); });
    dd.append(o);
  });
  const r = inp.getBoundingClientRect();
  const width = Math.max(r.width + 40, 380);
  const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
  const up = below < 180 && above > below;
  dd.style.width = width + 'px';
  dd.style.left = Math.min(r.left, window.innerWidth - width - 8) + 'px';
  dd.style.maxHeight = Math.min(320, up ? above : below) + 'px';
  dd.style.display = 'block';
  dd.style.top = up ? (r.top - 2 - dd.offsetHeight) + 'px' : (r.bottom + 2) + 'px';
  const a = dd.querySelector('.act'); if (a) a.scrollIntoView({ block:'nearest' });
}
window.addEventListener('scroll', closeDD, true);
window.addEventListener('resize', closeDD);

// free:true = campo de texto libre con sugerencias (no obliga a elegir de la lista)
function makeCombo({ getItems, onPick, placeholder, emptyMsg, free }){
  const root = el('div', 'combo' + (free ? ' free' : ''));
  const inp = el('input'); inp.type = 'text'; inp.placeholder = placeholder || ''; inp.autocomplete = 'off'; inp.spellcheck = false;
  const btn = el('button','combo-btn','▾'); btn.type = 'button'; btn.tabIndex = -1; btn.title = 'Ver lista completa';
  root.append(inp); if (!free) root.append(btn);
  let current = null, list = [], active = 0;
  const filt = (items, q) => {
    const ws = norm(q).replace(/(\d)\.(\d)/g,'$1,$2').split(/\s+/).filter(Boolean);
    if (!ws.length) return items;
    return items.filter(it => { it._n = it._n || norm((it.k || '') + ' ' + it.label); return ws.every(x => it._n.includes(x)); }).slice(0, 80);
  };
  function open(all){
    const items = getItems();
    if (free) {
      list = inp.value.trim() ? filt(items, inp.value) : [];
      active = -1;
      if (!list.length) return closeDD();
    } else {
      list = all ? items : filt(items, inp.value);
      active = Math.max(0, list.findIndex(it => current && it.id === current.id));
      if (!all) active = 0;
    }
    showDD(inp, list, active, pick, emptyMsg);
  }
  function pick(it){ current = it; inp.value = it.label; closeDD(); if (!free) inp.blur(); onPick(it); }
  inp.addEventListener('focus', () => { if (!free) { inp.select(); open(true); } });
  inp.addEventListener('input', () => open(false));
  inp.addEventListener('blur', () => { closeDD(); if (!free) inp.value = current ? current.label : ''; });
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (ddOwner !== inp) return open(true);
      if (!list.length) return;
      const d = e.key === 'ArrowDown' ? 1 : -1;
      active = active < 0 ? (d > 0 ? 0 : list.length - 1) : (active + d + list.length) % list.length;
      showDD(inp, list, active, pick, emptyMsg);
    } else if (e.key === 'Enter') {
      const picking = ddOwner === inp && list[active];
      if (picking) { e.preventDefault(); e.stopPropagation(); pick(list[active]); }
      else if (!free) e.preventDefault();
    } else if (e.key === 'Escape') {
      if (free) { if (ddOwner === inp) { e.stopPropagation(); closeDD(); } }
      else inp.blur();
    }
  });
  btn.addEventListener('mousedown', e => { e.preventDefault(); if (ddOwner === inp) { inp.blur(); } else { inp.focus(); } });
  return { root, input: inp, set(it){ current = it || null; if (document.activeElement !== inp) inp.value = it ? it.label : ''; } };
}
