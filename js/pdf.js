'use strict';
/* SUM Municipal - NOTA FORMAL E INFORMES EN PDF
   Lo usan el panel de Cliente (nota de la solicitud) y el de Administración (notas e informes).
   Requiere la librería jsPDF, que cada página carga desde cdnjs antes de este archivo. */

/* =====================================================================
   NOTA FORMAL Y PDF
   ===================================================================== */
/* Datos de la nota (sirven para la vista previa y para el PDF). {t, b:1} = segmento (b = negrita) */
function datosNota(r){
  const nom = `${r.cliente.nombre} ${r.cliente.apellido}`;
  return {
    titulo:'SOLICITUD DE USO DEL SUM',
    lugarFecha:`${CONFIG.CIUDAD_NOTA}, ${fechaLarga(r.creada)}`,
    destinatario:'A la Administración del Salón de Usos Múltiples:',
    cuerpo:[
      {t:'Por medio de la presente, quien suscribe, '},{t:nom,b:1},{t:', DNI '},{t:r.cliente.dni,b:1},
      {t:', solicita la autorización para hacer uso de las instalaciones del Salón de Usos Múltiples de la Municipalidad de Bella Vista el día '},
      {t:fechaLarga(r.fecha),b:1},{t:', en el horario comprendido entre las '},{t:r.inicio+' hs',b:1},{t:' y las '},{t:r.fin+' hs',b:1},
      {t:', con motivo de realizar '},{t:r.actividad,b:1},{t:'.'}
    ],
    observaciones:r.observaciones || '',
    conformidad:'Asimismo, manifiesta conocer y aceptar las condiciones establecidas para el uso de las instalaciones.',
    cierre:'Sin otro particular, saluda atentamente.',
    aclaracion:nom, dni:r.cliente.dni, numero:r.numero
  };
}
/* Vista previa de la nota (HTML) */
function notaHTML(r){
  const N = datosNota(r);
  const cuerpo = N.cuerpo.map(s => s.b ? `<strong>${esc(s.t)}</strong>` : esc(s.t)).join('');
  return `<div class="hoja">
    <div class="encab"><strong>${esc(CONFIG.MUNICIPALIDAD.toUpperCase())}</strong><br>${esc(CONFIG.NOMBRE_SUM)} - Salón de Usos Múltiples</div>
    <h3>${esc(N.titulo)}</h3>
    <p class="der">${esc(N.lugarFecha)}</p>
    <p>${esc(N.destinatario)}</p>
    <p>${cuerpo}</p>
    ${N.observaciones ? `<p>${esc(N.observaciones)}</p>` : ''}
    <p>${esc(N.conformidad)}</p>
    <p>${esc(N.cierre)}</p>
    <div class="firma"><p>Firma: <span class="lin-firma"></span></p><p>Aclaración: ${esc(N.aclaracion)}</p><p>DNI: ${esc(N.dni)}</p></div>
  </div>`;
}
/* Escribe un párrafo con partes en negrita, ajustando el texto al ancho. Devuelve la nueva posición Y. */
function parrafoPDF(doc, segs, x, y, ancho, lh, size){
  doc.setFontSize(size);
  let cx = x;
  for (const s of segs){
    doc.setFont('helvetica', s.b ? 'bold' : 'normal');
    for (const tok of (s.t.match(/\S+|\s+/g) || [])){
      const w = doc.getTextWidth(tok);
      if (/^\s+$/.test(tok)){ if (cx > x) cx += w; continue; }
      if (cx + w > x + ancho && cx > x){ cx = x; y += lh; }
      doc.text(tok, cx, y); cx += w;
    }
  }
  doc.setFont('helvetica', 'normal');
  return y + lh;
}
function generarPDFNota(r){
  if (!(window.jspdf && window.jspdf.jsPDF)) return null;
  const doc = new window.jspdf.jsPDF({ unit:'mm', format:'a4' });
  const N = datosNota(r), W = 210, mx = 25, ancho = W - 2*mx; let y = 26;
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text(CONFIG.MUNICIPALIDAD.toUpperCase(), W/2, y, { align:'center' }); y += 5;
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(`${CONFIG.NOMBRE_SUM} - Salón de Usos Múltiples`, W/2, y, { align:'center' }); y += 4;
  doc.setDrawColor(150); doc.line(mx, y, W - mx, y); y += 16;
  doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.text(N.titulo, W/2, y, { align:'center' }); y += 14;
  doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.text(N.lugarFecha, W - mx, y, { align:'right' }); y += 12;
  doc.text(N.destinatario, mx, y); y += 10;
  y = parrafoPDF(doc, N.cuerpo, mx, y, ancho, 6.6, 11) + 3;
  if (N.observaciones) y = parrafoPDF(doc, [{ t:N.observaciones }], mx, y, ancho, 6.6, 11) + 3;
  y = parrafoPDF(doc, [{ t:N.conformidad }], mx, y, ancho, 6.6, 11) + 3;
  y = parrafoPDF(doc, [{ t:N.cierre }], mx, y, ancho, 6.6, 11) + 22;
  doc.setFontSize(11); doc.text('Firma:', mx, y); doc.setDrawColor(40); doc.line(mx + 14, y + 0.5, mx + 84, y + 0.5); y += 9;
  doc.text('Aclaración: ' + N.aclaracion, mx, y); y += 7;
  doc.text('DNI: ' + N.dni, mx, y);
  doc.setFontSize(8); doc.setTextColor(120); doc.text(`Solicitud N° ${N.numero}`, mx, 285);
  return doc;
}

/* Informe de reservas: periodo = 'dia' | 'semana' | 'mes', fecha = 'AAAA-MM-DD' */
function rangoPeriodo(periodo, fecha){
  const d = deISO(fecha);
  if (periodo === 'dia') return { desde:fecha, hasta:fecha, texto:`Día ${fechaCorta(fecha)}` };
  if (periodo === 'semana'){
    const lun = new Date(d); lun.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
    return { desde:iso(lun), hasta:iso(dom), texto:`Semana del ${fechaCorta(iso(lun))} al ${fechaCorta(iso(dom))}` };
  }
  const p = new Date(d.getFullYear(), d.getMonth(), 1), u = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { desde:iso(p), hasta:iso(u), texto:`${cap(MESES[d.getMonth()])} de ${d.getFullYear()}` };
}
function generarInforme(periodo, fecha){
  if (!(window.jspdf && window.jspdf.jsPDF)) return null;
  const rg = rangoPeriodo(periodo, fecha);
  // Se incluyen reservas aprobadas, pendientes y canceladas del período (las rechazadas no llegan a ser reservas)
  const lista = ordenar(getReservas().filter(r => r.estado !== 'rechazada' && r.fecha >= rg.desde && r.fecha <= rg.hasta));
  const doc = new window.jspdf.jsPDF({ unit:'mm', format:'a4' });
  const mx = 20, cols = [{ t:'Fecha', w:28 }, { t:'Horario', w:34 }, { t:'Actividad', w:80 }, { t:'Estado', w:28 }];
  let y = 22;
  doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.text('INFORME DE RESERVAS', mx, y); y += 8;
  doc.setFontSize(11); doc.text(CONFIG.NOMBRE_SUM, mx, y); y += 5.5;
  doc.setFont('helvetica','normal'); doc.text(CONFIG.MUNICIPALIDAD, mx, y); y += 8;
  doc.text('Período: ' + rg.texto, mx, y); y += 5.5;
  const g = new Date(); doc.text(`Fecha de generación: ${fechaCorta(iso(g))} ${p2(g.getHours())}:${p2(g.getMinutes())} hs`, mx, y); y += 5.5;
  doc.setFont('helvetica','bold'); doc.text('Cantidad de reservas: ' + lista.length, mx, y); y += 9;
  const cabTabla = () => {
    doc.setFillColor(230, 235, 232); doc.rect(mx, y - 5, 170, 8, 'F'); doc.setFont('helvetica','bold'); doc.setFontSize(10);
    let x = mx + 2; cols.forEach(c => { doc.text(c.t, x, y); x += c.w; }); y += 7; doc.setFont('helvetica','normal');
  };
  cabTabla();
  if (!lista.length){ doc.text('No hay reservas en el período seleccionado.', mx + 2, y + 2); }
  lista.forEach(r => {
    const act = doc.splitTextToSize(r.actividad, cols[2].w - 4), alto = Math.max(1, act.length) * 5 + 3;
    if (y + alto > 280){ doc.addPage(); y = 22; cabTabla(); }
    let x = mx + 2;
    doc.text(fechaCorta(r.fecha), x, y); x += cols[0].w;
    doc.text(`${r.inicio} - ${r.fin} hs`, x, y); x += cols[1].w;
    doc.text(act, x, y); x += cols[2].w;
    doc.text(ETIQ_SOL[r.estado], x, y);
    doc.setDrawColor(210); doc.line(mx, y + alto - 4, mx + 170, y + alto - 4); y += alto;
  });
  return { doc, nombre:`informe-reservas-${periodo}-${fecha}.pdf` };
}
/* Entrega el PDF al usuario (en la vista publicada usa la capacidad "downloads"; en un hosting propio, descarga directa) */
async function guardarPDF(doc, nombre){
  if (!doc){ aviso('No se pudo cargar el generador de PDF. Revisa tu conexión e inténtalo de nuevo.', 'error'); return; }
  try{
    const dl = (window.claude && window.claude.use) ? await window.claude.use('downloads') : null;
    if (dl){ await dl.save({ filename:nombre, data:doc.output('blob') }); aviso('PDF listo: ' + nombre); return; }
  }catch(e){ if (e && e.code === 'declined') return; }
  try{ doc.save(nombre); aviso('PDF descargado: ' + nombre); }catch(e){ aviso('No se pudo descargar el PDF.', 'error'); }
}

Object.assign(ACCIONES, {
  'pdf-nota'(a){ const r = buscar(a.dataset.id); if (r) guardarPDF(generarPDFNota(r), `nota-solicitud-${r.numero}.pdf`); },
});
