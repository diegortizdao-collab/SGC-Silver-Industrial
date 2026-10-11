/* Genera el A.14 "Registro de asistencia a capacitación" completando la plantilla Word original
   (rrhh/A14.docx). No redibuja nada: solo escribe texto en los campos vacíos de la plantilla, de modo
   que el formato impreso es el del documento controlado (REV 2, COD A.14). Requiere JSZip. */
(function (g) {
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const XMLNS = 'http://www.w3.org/XML/1998/namespace';
  const kids = (n, name) => [...n.childNodes].filter(c => c.nodeType === 1 && c.namespaceURI === W && c.localName === name);
  const txt = n => [...n.getElementsByTagNameNS(W, 't')].map(t => t.textContent).join('');
  const mk = (doc, name) => doc.createElementNS(W, 'w:' + name);

  function fecha(iso, corto) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return corto ? ['', '', ''] : '';
    return corto ? [m[3], m[2], m[1].slice(2)] : `${m[3]}/${m[2]}/${m[1]}`;
  }

  // run con el formato del párrafo (sin subrayado); `fuente` fuerza Arial (celdas de la tabla de asistentes)
  function run(doc, p, text, opt = {}) {
    const r = mk(doc, 'r');
    const ppr = kids(p, 'pPr')[0];
    const base = ppr && kids(ppr, 'rPr')[0];
    const rpr = base ? base.cloneNode(true) : mk(doc, 'rPr');
    kids(rpr, 'u').forEach(u => rpr.removeChild(u));
    if (opt.arial && !kids(rpr, 'rFonts').length) {
      const f = mk(doc, 'rFonts');
      ['ascii', 'hAnsi', 'cs'].forEach(a => f.setAttributeNS(W, 'w:' + a, 'Arial'));
      rpr.insertBefore(f, rpr.firstChild);
    }
    if (opt.sz && !kids(rpr, 'sz').length) {
      const s = mk(doc, 'sz'); s.setAttributeNS(W, 'w:val', String(opt.sz)); rpr.appendChild(s);
      const c = mk(doc, 'szCs'); c.setAttributeNS(W, 'w:val', String(opt.sz)); rpr.appendChild(c);
    }
    r.appendChild(rpr);
    String(text).split(/\r?\n/).forEach((ln, i) => {
      if (i) r.appendChild(mk(doc, 'br'));
      const t = mk(doc, 't'); t.setAttributeNS(XMLNS, 'xml:space', 'preserve'); t.textContent = ln; r.appendChild(t);
    });
    p.appendChild(r);
    return r;
  }
  function centrar(doc, p) {
    let ppr = kids(p, 'pPr')[0];
    if (!ppr) { ppr = mk(doc, 'pPr'); p.insertBefore(ppr, p.firstChild); }
    if (!kids(ppr, 'jc').length) {
      const jc = mk(doc, 'jc'); jc.setAttributeNS(W, 'w:val', 'center');
      const rpr = kids(ppr, 'rPr')[0]; rpr ? ppr.insertBefore(jc, rpr) : ppr.appendChild(jc);
    }
  }
  const celdas = tr => kids(tr, 'tc');
  const parrafos = tc => kids(tc, 'p');

  /* d = { fecha_real:'YYYY-MM-DD', duracion, temas, asistentes:[{nombre,calificacion,observaciones}],
           efect_fecha_programada, efect_evaluacion, efect_efectiva:true|false|null, efect_fecha_real, efect_acciones } */
  async function llenarA14(plantilla, d) {
    const zip = await g.JSZip.loadAsync(plantilla);
    const xml = await zip.file('word/document.xml').async('string');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('No se pudo leer la plantilla del A.14');
    const body = doc.getElementsByTagNameNS(W, 'body')[0];
    const T = kids(body, 'tbl');
    if (T.length !== 6 || !/Asistentes/.test(txt(T[3])) || !/Temas/.test(txt(T[2])) || !/Duraci/.test(txt(T[1])))
      throw new Error('La plantilla A14.docx no tiene la estructura esperada');

    // Fecha (dd | mm | aa) y Duración
    const rf = kids(T[1], 'tr');
    const [dd, mm, aa] = fecha(d.fecha_real, true);
    [dd, mm, aa].forEach((v, i) => { const p = parrafos(celdas(rf[0])[i + 1])[0]; centrar(doc, p); if (v) run(doc, p, v); });
    if (d.duracion) run(doc, parrafos(celdas(rf[1])[1])[0], d.duracion);

    // Temas a desarrollar: a continuación de la etiqueta
    if (d.temas) run(doc, parrafos(celdas(kids(T[2], 'tr')[0])[0])[0], d.temas);

    // Asistentes: nombre | firma (vacía, la firma cada persona) | calificación | observaciones
    const filas = kids(T[3], 'tr');
    const asis = (d.asistentes || []).slice().sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
    const huecos = filas.length - 3; // encabezado + (expositor/responsable) + (firmas)
    const ultima = filas[huecos];    // última fila vacía de asistentes
    for (let k = huecos; k < asis.length; k++) {
      const c = ultima.cloneNode(true);
      ultima.parentNode.insertBefore(c, filas[huecos + 1]);
    }
    const filasF = kids(T[3], 'tr');
    asis.forEach((a, i) => {
      const c = celdas(filasF[1 + i]);
      run(doc, parrafos(c[0])[0], a.nombre || '', { arial: true, sz: 22 });
      if (a.calificacion) run(doc, parrafos(c[2])[0], a.calificacion, { arial: true, sz: 22 });
      if (a.observaciones) run(doc, parrafos(c[3])[0], a.observaciones, { arial: true, sz: 18 });
    });

    // Evaluación de la efectividad
    const ps = parrafos(celdas(kids(T[4], 'tr')[0])[0]);
    const buscar = re => ps.findIndex(p => re.test(txt(p)));
    let i = buscar(/^Fecha programada/);
    if (i >= 0 && d.efect_fecha_programada) run(doc, ps[i], ' ' + fecha(d.efect_fecha_programada));
    i = buscar(/^Evaluaci/);
    if (i >= 0 && d.efect_evaluacion) run(doc, ps[i + 1], d.efect_evaluacion);
    i = buscar(/^Capacitaci.n efectiva/);
    if (i >= 0 && typeof d.efect_efectiva === 'boolean') {
      const rs = kids(ps[i], 'r'); const t = rs[rs.length - 1].getElementsByTagNameNS(W, 't')[0];
      t.textContent = d.efect_efectiva ? 'Sí' : 'No';
    }
    i = buscar(/^Fecha real de evaluaci/);
    if (i >= 0 && d.efect_fecha_real) {
      const rs = kids(ps[i], 'r'); const t = rs[1].getElementsByTagNameNS(W, 't')[0];
      t.textContent = ' ' + fecha(d.efect_fecha_real) + ' '.repeat(8);
    }
    // Acciones en caso de no efectividad
    if (d.efect_acciones) run(doc, parrafos(celdas(kids(T[5], 'tr')[0])[0])[1], d.efect_acciones);

    zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + new XMLSerializer().serializeToString(doc).replace(/^<\?xml[^>]*\?>\s*/, ''));
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
  }
  g.llenarA14 = llenarA14;
})(window);
