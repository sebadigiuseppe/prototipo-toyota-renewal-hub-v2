#!/usr/bin/env python3
"""
Extrae los precios del PDF de la CCA (Cámara de Comercio Automotor) y genera
js/data/cca-AAAA-MM.js para el prototipo.

Uso:
    pip install pdfplumber
    python tools/extract_cca.py Autos.pdf --period "Noviembre 2026" --out js/data/cca-2026-11.js

Estructura que detecta en el PDF (por tipo de letra):
  - Marca:    línea en negrita sin valores, seguida de una línea de modelo (AGRALE, FORD...)
  - Modelo:   línea en negrita cursiva (COROLLA, HILUX PICK - UP...)
  - Versión:  línea en negrita con precios; columnas "0 Km", 2025, 2024... (miles de pesos)
Salida por fila: b=marca, f=modelo, d=versión, v={año: precio usado}, z=precio 0 km (si hay), u=1 (precio en USD)
"""
import argparse, json, re, sys
from collections import Counter

try:
    import pdfplumber
except ImportError:
    sys.exit("Falta pdfplumber: pip install pdfplumber")

NUM = re.compile(r'^\d[\d.,]*$')
HEADER_Y = (130, 142)   # franja vertical donde está la fila "0 Km 2025 2024 ..."
BODY_Y = 145            # el contenido empieza debajo del encabezado
USD_LIMIT = 3000        # miles: por debajo de esto se asume precio en USD


def parse_value(tok):
    """'28733' -> 28733 | '44082,0' -> 44082.0 | '111,660' -> 111660 (la coma separa miles)."""
    if ',' in tok:
        a, b = tok.split(',', 1)
        return int(a + b) if len(b) == 3 else float(a + '.' + b)
    if '.' in tok:
        a, b = tok.split('.', 1)
        return int(a + b) if len(b) == 3 else float(tok)
    return int(tok)


def page_lines(pg):
    """Devuelve las líneas de la página: fuente, descripción y valores por columna."""
    words = pg.extract_words(extra_attrs=['fontname'])
    cols = {}
    for w in words:
        if HEADER_Y[0] < w['top'] < HEADER_Y[1]:
            if w['text'] == 'Km':
                cols['0km'] = (w['x0'] - 8 + w['x1']) / 2
            elif re.fullmatch(r'20\d\d', w['text']):
                cols[w['text']] = (w['x0'] + w['x1']) / 2
    if not cols:
        return []
    minx = min(cols.values()) - 25
    lines = {}
    for w in words:
        if w['top'] >= BODY_Y:
            lines.setdefault(round(w['top'] / 3), []).append(w)
    out = []
    for k in sorted(lines):
        lw = sorted(lines[k], key=lambda w: w['x0'])
        italic = 'Italic' in lw[0]['fontname']
        desc = ' '.join(w['text'] for w in lw if not (w['x0'] >= minx and NUM.match(w['text'])))
        vals = {}
        for w in lw:
            if w['x0'] >= minx and NUM.match(w['text']):
                c = (w['x0'] + w['x1']) / 2
                vals.setdefault(min(cols, key=lambda n: abs(cols[n] - c)), []).append(w['text'])
        out.append({'italic': italic, 'desc': desc, 'vals': vals})
    return out


def extract(pdf_path):
    lines = []
    with pdfplumber.open(pdf_path) as pdf:
        for pg in pdf.pages:
            lines.extend(page_lines(pg))
    rows, brand, fam, warnings = [], None, None, []
    for i, ln in enumerate(lines):
        nxt = lines[i + 1] if i + 1 < len(lines) else None
        if ln['italic']:
            fam = ln['desc']
        elif not ln['vals']:
            # línea sin valores: marca si le sigue un modelo; si no, versión sin precios (se ignora)
            if nxt and nxt['italic'] and ln['desc'] and not re.search(r'\d', ln['desc']):
                brand, fam = ln['desc'], None
        else:
            if not brand or not fam:
                warnings.append(f"fila sin marca/modelo: {ln['desc']}"); continue
            v, z = {}, None
            for col, toks in ln['vals'].items():
                if len(toks) > 1:
                    warnings.append(f"dos valores en la misma columna ({brand} {fam} {ln['desc']} {col})")
                x = parse_value(toks[0])
                if col == '0km':
                    z = x
                else:
                    v[col] = x
            row = {'b': brand, 'f': fam, 'd': ln['desc'], 'v': v, 'z': z}
            # Algunas marcas (Porsche, Jaguar, Ferrari, Maserati, Lotus, McLaren) cotizan usados en USD (miles):
            # valores < 3000 (= menos de $3 millones) no pueden ser pesos. Se marcan u=1 y la app no los calcula
            # como usado (el precio 0 km, en pesos, sí se puede ofrecer).
            if v and max(v.values()) < USD_LIMIT:
                row['u'] = 1
            rows.append(row)
    for i, r in enumerate(rows):
        r['id'] = i
    return rows, warnings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf'); ap.add_argument('--period', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--brands', help='opcional: solo estas marcas, separadas por coma (ej. TOYOTA,FORD)')
    a = ap.parse_args()
    rows, warnings = extract(a.pdf)
    if a.brands:
        keep = {b.strip().upper() for b in a.brands.split(',')}
        rows = [r for r in rows if r['b'].upper() in keep]
        for i, r in enumerate(rows): r['id'] = i
    with open(a.out, 'w', encoding='utf-8') as f:
        f.write("// Datos de la CCA (Cámara de Comercio Automotor). Precios en MILES de pesos.\n"
                "// Campos: b=marca, f=modelo, d=versión, v={año: precio usado}, z=precio 0 km (si existe), u=1 si el precio está en USD.\n"
                "// Generado con tools/extract_cca.py. No editar a mano.\n")
        f.write("const CCA = {\n  period: %s,\n  rows: %s\n};\n" % (json.dumps(a.period, ensure_ascii=False), json.dumps(rows, ensure_ascii=False, separators=(',', ':'))))
    brands = Counter(r['b'] for r in rows)
    print(f"{len(rows)} versiones · {len(brands)} marcas · {sum(1 for r in rows if r['z'])} con precio 0 km · {sum(1 for r in rows if r.get('u'))} en USD (no se calculan)")
    for w in warnings[:15]: print('AVISO:', w)
    if len(warnings) > 15: print(f'... y {len(warnings) - 15} avisos más')


if __name__ == '__main__':
    main()
