// Cálculo de la operación de renovación (sin DOM, fácil de probar)
// usado: valor de toma estimado | precioLista: precio del 0 km | gastos y flete se suman al 0 km
function calcOperacion({ usado, precioLista, gastos, flete, maxFin, tasa }){
  if (usado == null || !precioLista) return null;
  const g = gastos || 0, f = flete || 0;
  const precioNuevo = precioLista + g + f;
  const diferencia = Math.max(0, precioNuevo - usado);
  const financiado = Math.min(Math.max(0, maxFin || 0), diferencia);
  return { usado, precioLista, gastos: g, flete: f, precioNuevo, diferencia, financiado, saldo: diferencia - financiado, tasa: tasa || 0 };
}
