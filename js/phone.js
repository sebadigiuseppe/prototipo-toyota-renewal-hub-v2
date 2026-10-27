// Normalización de teléfonos argentinos para wa.me
function normPhone(raw, area){
  let d = String(raw == null ? '' : raw).replace(/\D/g,'');
  if (!d) return null;
  const plus = /^\s*\+/.test(String(raw));
  d = d.replace(/^00/,'');
  if (plus && !d.startsWith('54')) return d.length >= 8 ? d : null;
  if (d.startsWith('549')) { /* ok */ }
  else if (d.startsWith('54')) d = '549' + d.slice(2);
  else {
    d = d.replace(/^0/,'');
    if (d.length <= 8) d = (area || '') + d;
    if (d.length === 12) for (const i of [2,3,4]) if (d.slice(i,i+2) === '15') { d = d.slice(0,i) + d.slice(i+2); break; }
    d = '549' + d;
  }
  return /^549\d{10}$/.test(d) ? d : null;
}
