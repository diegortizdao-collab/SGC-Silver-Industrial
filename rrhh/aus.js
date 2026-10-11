/* Lógica de ausentismo por persona (sin DOM, para usar en el navegador y probar en Node).
   Definiciones: Instructivo I.09 Rev. 012, sección 5.2.
   - Ausencia = AA (con aviso) + AS (sin aviso) + ILT (accidente o enfermedad).
   - Laborables netos = laborables - LG - LE - SUS.
   - IT (ingreso tarde) y DJ (demora en la jornada) son retrasos, no ausencias.
   - El índice de Bradford y las alertas NO incluyen ILT: la enfermedad o el accidente se muestra como contexto. */
(function (g) {
  const MESES = { ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6, JULIO: 7, AGOSTO: 8, AGSOTO: 8, SEPTIEMBRE: 9, SETIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12 };
  const DESCANSO = new Set(['D', 'S', 'SAB', 'DOM', 'F', 'FEDO']); // días no laborables: no cortan una racha de ausencia
  const SIN_SIGNIFICADO = new Set(['', '-', 'N/D']);

  /* Código crudo -> código canónico. Devuelve '' para vacío/sin significado y 'IT+DJ' para las combinaciones. */
  function canon(raw) {
    let c = String(raw == null ? '' : raw).trim().toUpperCase().replace(/\s+/g, ' ');
    if (SIN_SIGNIFICADO.has(c) || /^\d+(\.\d+)?$/.test(c)) return '';
    if (['IT/DJ', 'DJ/IT', 'IT-DJ', 'DJ-IT', 'IT DJ', 'DJ IT', 'DIT'].includes(c)) return 'IT+DJ';
    if (c === 'SUSP') return 'SUS';
    if (c === 'FEDO') return 'F';
    if (c === 'S' || c === 'SAB' || c === 'DOM') return 'D';
    return c;
  }
  const CONOCIDOS = new Set(['AA', 'AS', 'ILT', 'IT', 'DJ', 'IT+DJ', 'VAC', 'F', 'D', 'SUS', 'LG', 'LE', 'EA', 'JI', 'RA']);

  function diasDelMes(periodo) { const [y, m] = periodo.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

  /* codigos: array de hasta 31 códigos crudos; lab: laborables del mes de la persona */
  function contar(codigos, lab) {
    const o = { aa: 0, as: 0, ilt: 0, it: 0, dj: 0, vac: 0, lg: 0, le: 0, sus: 0, ea: 0, desconocidos: [] };
    (codigos || []).forEach(raw => {
      const c = canon(raw); if (!c) return;
      if (c === 'AA') o.aa++; else if (c === 'AS') o.as++; else if (c === 'ILT') o.ilt++;
      else if (c === 'IT') o.it++; else if (c === 'DJ') o.dj++; else if (c === 'IT+DJ') { o.it++; o.dj++; }
      else if (c === 'VAC') o.vac++; else if (c === 'LG') o.lg++; else if (c === 'LE') o.le++; else if (c === 'SUS') o.sus++; else if (c === 'EA') o.ea++;
      if (!CONOCIDOS.has(c)) o.desconocidos.push(c);
    });
    o.lab = Number(lab) || 0;
    o.num = o.aa + o.as + o.ilt;
    o.den = o.lab - o.lg - o.le - o.sus;
    return o;
  }

  /* Agregado del mes de toda la planta (lo que va al Apéndice C) */
  function agregarMes(filas) {
    let num = 0, den = 0;
    filas.forEach(f => { const c = contar(f.codigos, f.laborables != null ? f.laborables : f.lab); num += c.num; den += c.den; });
    return { num, den, valor: den > 0 ? num / den : null };
  }

  /* Rachas ("episodios") de ausencia AA/AS. Los días de descanso o feriado y los días ILT no cortan una racha
     (viernes + lunes = 1 episodio; AA, ILT, AA = 1 episodio). Un día laborable sin ausencia, IT/DJ o VAC la corta.
     Devuelve {episodios, dias, largos, cortos, diasCortos}: las rachas de LARGO o más días (ausencia prolongada) se
     informan aparte y no entran en el índice de Bradford, que mide ausencias cortas y repetidas. */
  const LARGO = 10;
  function episodios(meses) {
    const lens = []; let cur = 0;
    const cerrar = () => { if (cur) { lens.push(cur); cur = 0; } };
    meses.forEach(m => {
      (m.codigos || []).forEach(raw => {
        const c = canon(raw);
        if (c === 'AA' || c === 'AS') cur++;
        else if (c === 'D' || c === 'F' || c === 'ILT') { /* neutro: no corta ni suma */ }
        else cerrar();
      });
    });
    cerrar();
    const cortos = lens.filter(l => l < LARGO);
    return { episodios: lens.length, dias: lens.reduce((a, b) => a + b, 0), largos: lens.filter(l => l >= LARGO), cortos: cortos.length, diasCortos: cortos.reduce((a, b) => a + b, 0) };
  }
  const bradford = ep => ep.cortos * ep.cortos * ep.diasCortos;

  /* Ausencias AA/AS por día de la semana (0=domingo) y pegadas a feriado/descanso largo */
  function porDiaSemana(meses) {
    const w = [0, 0, 0, 0, 0, 0, 0];
    meses.forEach(m => {
      const [y, mo] = m.periodo.split('-').map(Number);
      (m.codigos || []).forEach((raw, i) => { const c = canon(raw); if (c === 'AA' || c === 'AS') w[new Date(Date.UTC(y, mo - 1, i + 1)).getUTCDay()]++; });
    });
    return w;
  }

  const sum = a => a.reduce((x, y) => x + y, 0);
  /* Resumen de una persona sobre una lista de meses [{periodo,codigos,laborables}] */
  function resumenPersona(meses) {
    const cs = meses.map(m => contar(m.codigos, m.laborables));
    const t = { aa: sum(cs.map(c => c.aa)), as: sum(cs.map(c => c.as)), ilt: sum(cs.map(c => c.ilt)), it: sum(cs.map(c => c.it)), dj: sum(cs.map(c => c.dj)), num: sum(cs.map(c => c.num)), den: sum(cs.map(c => c.den)), lab: sum(cs.map(c => c.lab)) };
    t.pct = t.den > 0 ? t.num / t.den : null;
    const ep = episodios(meses); t.episodios = ep.episodios; t.diasAusAA = ep.dias; t.largos = ep.largos; t.bradford = bradford(ep);
    t.itPorLab = t.den > 0 ? t.it / t.den : 0; t.djPorLab = t.den > 0 ? t.dj / t.den : 0;
    return t;
  }

  /* Umbrales por defecto (referencias habituales; editables en la pantalla). */
  const UMBRALES = { bradAtencion: 45, bradConversar: 125, bradFormal: 400, itMin: 3, djMin: 10, vsPlanta: 2, concentracion: 0.6, minAusConc: 5 };

  /* Alertas de una persona. ult3 = resumen últimos 3 meses; ant3 = 3 meses previos; r12 = ventana completa; planta = resumen de planta (ult3). */
  function alertas(r12, ult3, ant3, planta, semana, U) {
    U = U || UMBRALES; const out = [];
    if (r12.largos && r12.largos.length) out.push({ k: 'larga', n: 1, t: 'Ausencia prolongada: ' + r12.largos.join(' y ') + ' días seguidos (no integra el índice de ausencias cortas)' });
    if (r12.bradford >= U.bradFormal) out.push({ k: 'brad', n: 3, t: 'Ausencias cortas y frecuentes: índice muy alto (' + r12.bradford + ')' });
    else if (r12.bradford >= U.bradConversar) out.push({ k: 'brad', n: 2, t: 'Ausencias cortas y frecuentes: conviene conversar (índice ' + r12.bradford + ')' });
    else if (r12.bradford >= U.bradAtencion) out.push({ k: 'brad', n: 1, t: 'Ausencias cortas y frecuentes: en observación (índice ' + r12.bradford + ')' });
    if (ult3.it >= U.itMin && planta.itPorLab > 0 && ult3.itPorLab >= U.vsPlanta * planta.itPorLab) out.push({ k: 'it', n: 2, t: 'Ingresos tarde: ' + ult3.it + ' en 3 meses, ' + (ult3.itPorLab / planta.itPorLab).toFixed(1).replace('.', ',') + '× el promedio de planta' });
    else if (ult3.it >= U.itMin && planta.itPorLab === 0) out.push({ k: 'it', n: 2, t: 'Ingresos tarde: ' + ult3.it + ' en 3 meses' });
    if (ult3.dj >= U.djMin && planta.djPorLab > 0 && ult3.djPorLab >= U.vsPlanta * planta.djPorLab) out.push({ k: 'dj', n: 1, t: 'Demoras en la jornada: ' + ult3.dj + ' en 3 meses, ' + (ult3.djPorLab / planta.djPorLab).toFixed(1).replace('.', ',') + '× el promedio de planta' });
    const aus = sum(semana);
    if (aus >= U.minAusConc) { const lv = (semana[1] + semana[5]) / aus; if (lv >= U.concentracion) out.push({ k: 'sem', n: 1, t: 'Ausencias concentradas en lunes o viernes (' + Math.round(lv * 100) + '%)' }); }
    if (ant3 && ant3.den > 0 && ult3.den > 0 && ult3.aa + ult3.as >= 3 && (ult3.aa + ult3.as) / ult3.den > 2 * Math.max((ant3.aa + ant3.as) / ant3.den, 0.01)) out.push({ k: 'tend', n: 1, t: 'Las ausencias vienen en aumento respecto de los 3 meses previos' });
    return out;
  }

  g.AUS = { LARGO, MESES, canon, CONOCIDOS, diasDelMes, contar, agregarMes, episodios, bradford, porDiaSemana, resumenPersona, alertas, UMBRALES };
  if (typeof module !== 'undefined') module.exports = g.AUS;
})(typeof window !== 'undefined' ? window : globalThis);
