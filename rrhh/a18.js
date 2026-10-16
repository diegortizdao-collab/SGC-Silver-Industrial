/* Genera el A.18 "Programa de capacitación" completando la planilla original (rrhh/A18.xlsx, hoja "Registro 2026"
   de Silver: logo, recuadro FECHA/REV/COD y estilos intactos). Solo escribe las filas del programa y recalcula el
   resumen (Brindadas / Programadas / Cumplimiento / Meta > 90 %). Requiere JSZip. */
(function (g) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const MIN_FILAS = 11; // la planilla original trae 11 filas (5 a 15)
  const PRIMERA = 5;

  // estilos de la hoja original, por columna (B..K)
  const ESTILO = { B: 190, C: 193, D: 118, E: 119, F: 194, G: 117, H: 193, I: 122, J: 123, K: 165 };
  const ANCHO = { B: 19.6, C: 14, G: 18.1, H: 24.4, K: 25.4 }; // caracteres por línea aprox. (ancho de columna)

  function serial(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return null;
    return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000);
  }
  const celdaTxt = (ref, s, t) => t === '' || t == null
    ? `<c r="${ref}" s="${s}"/>`
    : `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc(t)}</t></is></c>`;
  const celdaNum = (ref, s, n) => `<c r="${ref}" s="${s}"><v>${n}</v></c>`;

  function lineas(txt, ancho) {
    if (!txt) return 1;
    return String(txt).split(/\r?\n/).reduce((a, ln) => a + Math.max(1, Math.ceil((ln.length * 1.15) / ancho)), 0);
  }

  function filaXml(n, f) {
    const L = {
      B: f.tema || '',
      C: String(f.instructor || '').split(/\s*[,;]\s*/).filter(Boolean).join('\n'),
      G: f.destinatarios || '', H: f.lugar || '', I: f.estado || '', K: f.observaciones || '',
    };
    const lin = Math.max(...Object.keys(ANCHO).map(c => lineas(L[c], ANCHO[c])), 3);
    const ht = Math.min(300, Math.max(38.25, 14.5 * lin + 8));
    const fp = serial(f.fecha_plan), fr = serial(f.fecha_real);
    let c = '';
    c += celdaTxt('B' + n, ESTILO.B, L.B);
    c += celdaTxt('C' + n, ESTILO.C, L.C);
    c += celdaTxt('D' + n, ESTILO.D, f.tipo === 'Interno' ? 'X' : '');
    c += celdaTxt('E' + n, ESTILO.E, f.tipo === 'Externo' ? 'X' : '');
    c += fp != null ? celdaNum('F' + n, ESTILO.F, fp) : celdaTxt('F' + n, ESTILO.F, f.periodo_plan || '');
    c += celdaTxt('G' + n, ESTILO.G, L.G);
    c += celdaTxt('H' + n, ESTILO.H, L.H);
    c += celdaTxt('I' + n, ESTILO.I, L.I);
    c += fr != null ? celdaNum('J' + n, ESTILO.J, fr) : celdaTxt('J' + n, ESTILO.J, '-');
    c += celdaTxt('K' + n, ESTILO.K, L.K);
    return `<row r="${n}" ht="${ht}" customHeight="1">${c}</row>`;
  }

  function filaVacia(n) {
    return filaXml(n, {}).replace(/ ht="[\d.]+"/, ' ht="71.25"').replace(/(<c r="J\d+" s="\d+") t="inlineStr"><is><t[^>]*>-<\/t><\/is><\/c>/, '$1/>');
  }

  async function llenarA18(plantilla, data) {
    const zip = await JSZip.loadAsync(plantilla);
    let xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
    const filas = (data.filas || []).slice();
    const N = Math.max(filas.length, MIN_FILAS);
    const d = N - MIN_FILAS;          // desplazamiento del bloque de resumen
    const ult = PRIMERA + N - 1;      // última fila de datos
    const sh = r => (r >= 16 ? r + d : r);

    // correr el bloque de resumen (filas >= 16 de la plantilla)
    if (d) {
      xml = xml.replace(/<row r="(\d+)"/g, (m, r) => `<row r="${sh(+r)}"`);
      xml = xml.replace(/<c r="([A-Z]+)(\d+)"/g, (m, c, r) => `<c r="${c}${sh(+r)}"`);
      xml = xml.replace(/<mergeCell ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"/g, (m, a, r1, b, r2) => `<mergeCell ref="${a}${sh(+r1)}:${b}${sh(+r2)}"`);
      xml = xml.replace(/sqref="C19"/, `sqref="C${19 + d}"`);
      xml = xml.replace(/(<f>[^<]*?)C19/g, (m, p) => p + 'C' + (19 + d));
      xml = xml.replace(/<dimension ref="[^"]*"\/>/, `<dimension ref="B1:K${22 + d}"/>`);
    }
    // filas de datos
    let datos = '';
    for (let i = 0; i < N; i++) datos += i < filas.length ? filaXml(PRIMERA + i, filas[i]) : filaVacia(PRIMERA + i);
    xml = xml.replace('<!--DATA-->', datos);

    const r17 = 17 + d, r18 = 18 + d, r19 = 19 + d;
    const rng = col => `${col}${PRIMERA}:${col}${ult}`;
    const conFormula = (ref, f, v) => `<c r="${ref}"$1><f>${f}</f><v>${v}</v></c>`;
    const prog = filas.filter(f => f.estado !== 'Cancelada');
    const cum = filas.filter(f => f.estado === 'Cumplida').length;
    const setFormula = (ref, formula, valor) => {
      const re = new RegExp(`<c r="${ref}"( s="\\d+")[^>]*?(?:/>|>.*?</c>)`, 's');
      if (!re.test(xml)) throw new Error('Plantilla A.18 inesperada: falta ' + ref);
      xml = xml.replace(re, conFormula(ref, esc(formula), valor));
    };
    setFormula('C' + r17, `COUNTIF(${rng('I')},"Cumplida")`, cum);
    setFormula('C' + r18, `COUNTA(${rng('B')})-COUNTIF(${rng('I')},"Cancelada")`, prog.length);
    setFormula('C' + r19, `IF(C${r18}=0,0,C${r17}/C${r18})`, prog.length ? cum / prog.length : 0);
    xml = xml.replace(/(<c r="D\d+" s="\d+" t="str"><f>)IF\(C\d+&gt;=90%/, `$1IF(C${r19}&gt;=90%`);

    xml = xml.replace('{ANIO}', esc(String(data.anio || '')));
    zip.file('xl/worksheets/sheet1.xml', xml);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  g.llenarA18 = llenarA18;
  if (typeof module !== 'undefined') module.exports = { llenarA18 };
})(typeof window !== 'undefined' ? window : globalThis);
