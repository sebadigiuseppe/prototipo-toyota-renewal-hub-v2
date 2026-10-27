# Toyota Renewal Hub (prototipo)

Página estática (HTML/JS) para armar propuestas de renovación y enviarlas por WhatsApp.
Se publica tal cual en GitHub Pages: no requiere servidor ni compilación.

## Estructura
- `index.html` — la página
- `css/styles.css` — estilos
- `js/data/cca-2026-10.js` — precios CCA del mes (se reemplaza cada mes)
- `js/matching.js` — coincidencia de modelos (usado y 0 km)
- `js/phone.js` — normalización de teléfonos
- `js/calc.js` — cálculo de la operación (precio nuevo, diferencia, financiación, saldo)
- `js/explain.js` — detalle paso a paso del cálculo («Ver cálculo»)
- `js/template.js` — formato de importes y mensaje de WhatsApp
- `js/manual.js` — formulario para agregar clientes a mano
- `js/util.js`, `js/combo.js` — utilidades y autocompletado
- `js/app.js` — tabla, carga de Excel y eventos
- `ejemplo_clientes.xlsx` — archivo de prueba

## Actualización mensual
Cada mes se genera un nuevo archivo `js/data/cca-AAAA-MM.js` desde el PDF de la CCA
y se actualiza la referencia en `index.html`.
