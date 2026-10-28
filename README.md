# Toyota Renewal Hub (prototipo)

Página estática (HTML/JS) para armar propuestas de renovación y enviarlas por WhatsApp.
Se publica tal cual en GitHub Pages: no requiere servidor ni compilación.

## Estructura
- `index.html` — la página
- `css/styles.css` — estilos
- `js/data/cca-2026-10.js` — precios CCA del mes, todas las marcas (generado con `tools/extract_cca.py`)
- `tools/extract_cca.py` — extrae los datos del PDF de la CCA (no se publica en el sitio; es solo para actualizar)
- `js/matching.js` — coincidencia de modelos (usado y 0 km)
- `js/phone.js` — normalización de teléfonos
- `js/calc.js` — cálculo de la operación (precio nuevo, diferencia, financiación, saldo)
- `js/explain.js` — detalle paso a paso del cálculo («Ver cálculo»)
- `js/template.js` — formato de importes y mensaje de WhatsApp
- `js/manual.js` — formulario para agregar clientes a mano
- `js/util.js`, `js/combo.js` — utilidades y autocompletado
- `js/app.js` — tabla, carga de Excel y eventos
- `img/preview.jpg` — imagen que se ve al compartir el link (1200×630)
- `ejemplo_clientes.xlsx` — archivo de prueba

## Actualización mensual
1. Bajar el PDF nuevo de la CCA.
2. Instalar una vez: `pip install pdfplumber`
3. Generar el archivo de datos del mes:
   `python tools/extract_cca.py Autos.pdf --period "Noviembre 2026" --out js/data/cca-2026-11.js`
   El script informa cuántas versiones y marcas leyó. Para solo algunas marcas: `--brands TOYOTA,FORD`.
4. En `index.html`, cambiar `js/data/cca-2026-10.js` por el archivo nuevo, y subir los cambios.

Notas sobre los datos:
- Los precios están en miles de pesos. Los usados de algunas marcas (Porsche, Jaguar, Ferrari, Maserati, Lotus, McLaren)
  figuran en dólares en la CCA: el script los marca (`u:1`) y la app no los calcula en pesos.
- La marca de la concesionaria (`HOUSE_BRAND` en `js/matching.js`) se prefiere ante empates y no se repite en los nombres.

## Vista previa al compartir el link
`index.html` (cabecera) tiene etiquetas `og:` que apuntan a la URL de GitHub Pages y a `img/preview.jpg`.
Si cambia la URL del sitio o el nombre del repositorio, hay que actualizar `og:image` y `og:url`.
WhatsApp guarda la vista previa en caché: si ya compartiste el link antes, probá con `?v=2` al final.
