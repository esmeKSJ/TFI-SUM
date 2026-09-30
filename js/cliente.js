'use strict';
/* SUM Municipal - PANEL DE CLIENTE
   Páginas: html/cliente/*.html */

/* =====================================================================
   VISTAS DEL CLIENTE
   ===================================================================== */
function vCInicio(){
  return shell(CONFIG.NOMBRE_SUM, marcadorHTML('Reservar cancha'), CONFIG.MUNICIPALIDAD);
}
const ACTIVIDADES_RESERVA = ['Vóley', 'Básquet'];
function vCReservar(){
  const u = usuarioActual(); if (!u) return redirigir('publica');
  /* Paso 3: solicitud enviada */
  if (S.paso === 'ok'){
    const r = getReservas().find(x => x.id === S.ultima);
    return shell('Reservar cancha', `<div class="bloque exito"><div class="icono" aria-hidden="true">&#10003;</div>
      <h2>Solicitud enviada</h2><p>Tu nota quedó guardada y asociada a la reserva. La Administración la revisará.</p>
      <p>Estado de la solicitud: ${chipSol(r ? r.estado : 'pendiente')}</p>
      <div class="cta-fila" style="justify-content:center"><button class="btn btn-primary" data-accion="pdf-nota" data-id="${esc(S.ultima)}">Descargar nota en PDF</button>
        <button class="btn btn-sec" data-accion="ir" data-vista="c_mis">Ver mis reservas</button></div></div>`);
  }
  /* Paso 2: vista previa de la nota */
  if (S.paso === 'preview'){
    const f = S.form, r = { cliente:u, fecha:f.fecha, inicio:f.inicio, fin:f.fin, actividad:f.actividad, observaciones:f.observaciones, creada:ahoraLocal(), numero:'(se asigna al confirmar)' };
    return shell('Vista previa de la nota', `
      <div class="resumen"><h2 class="pag-tit" style="font-size:1.6rem">Resumen de la solicitud</h2>
        <dl class="dl"><dt>Fecha</dt><dd>${cap(diaSemana(f.fecha))} ${fechaLarga(f.fecha)}</dd><dt>Horario</dt><dd>${esc(f.inicio)} a ${esc(f.fin)} hs</dd><dt>Actividad</dt><dd>${esc(f.actividad)}</dd>${f.observaciones ? `<dt>Observaciones</dt><dd>${esc(f.observaciones)}</dd>` : ''}</dl></div>
      ${notaHTML(r)}
      <div class="cta-fila"><button class="btn btn-sec" data-accion="volver-editar">Volver a editar</button><button class="btn btn-primary" data-accion="confirmar-solicitud">Confirmar solicitud</button></div>`,
      'Revisa la nota antes de confirmar. Se generará como PDF.');
  }
  /* Paso 1: formulario. La fecha se elige tocando un día en el calendario, que además
     muestra a la derecha el panel con los horarios de ese día (libres, reservados, etc.). */
  if (!f_esValida(S.cal.dia)){ const hd = new Date(); S.cal = { y:hd.getFullYear(), m:hd.getMonth(), dia:iso(hd) }; }   // si había quedado en un día pasado, vuelve a hoy
  if (!f_esValida(S.form.fecha)) S.form.fecha = S.cal.dia;   // por defecto, el día ya seleccionado en el calendario
  const f = S.form, hoy = iso(new Date());
  const ini = f.inicio ? Number(f.inicio.slice(0,2)) : null;
  return shell('Reservar cancha', `
    <section class="seccion" style="margin-top:8px">
      <h2 style="font-size:clamp(1.4rem,3vw,1.9rem)">1. Elige el día</h2>
      <p class="sub">Toca un día del calendario. A la derecha vas a ver los horarios libres, reservados, ocupados o bloqueados de ese día.</p>
      ${calendarioHTML('reservar')}
    </section>
    <section class="seccion">
      <h2 style="font-size:clamp(1.4rem,3vw,1.9rem)">2. Completa la reserva</h2>
      <p class="sub">Día elegido: <strong>${cap(diaSemana(f.fecha))} ${fechaLarga(f.fecha)}</strong>. Elige un horario libre y describe la actividad.</p>
      <form data-form="reserva" novalidate style="max-width:680px">
        <input type="hidden" id="fecha" name="fecha" value="${esc(f.fecha)}">
        <div class="fila2">
          <div class="campo"><label for="inicio">Hora de inicio</label><select id="inicio" name="inicio" aria-describedby="e-inicio">${optsHora(CONFIG.HORA_APERTURA, CONFIG.HORA_CIERRE - 1, f.inicio)}</select><p class="err" id="e-inicio" data-err="inicio"></p></div>
          <div class="campo"><label for="fin">Hora de finalización</label><select id="fin" name="fin" aria-describedby="e-fin">${optsHora(ini !== null ? ini + 1 : CONFIG.HORA_APERTURA + 1, CONFIG.HORA_CIERRE, f.fin)}</select><p class="err" id="e-fin" data-err="fin"></p></div>
        </div>
        <div class="disp" data-live="disp" role="status" aria-live="polite">Elige una fecha para ver los horarios no disponibles de ese día.</div>
        <div class="campo"><label for="actividad">Actividad o motivo</label><select id="actividad" name="actividad" aria-describedby="e-actividad"><option value="">Elige una opción</option>${ACTIVIDADES_RESERVA.map(x => `<option value="${x}" ${f.actividad === x ? 'selected' : ''}>${x}</option>`).join('')}</select><p class="err" id="e-actividad" data-err="actividad"></p></div>
        <div class="campo"><label for="observaciones">Observaciones <span class="ayuda">(opcional)</span></label><textarea id="observaciones" name="observaciones" maxlength="400">${esc(f.observaciones || '')}</textarea></div>
        <p class="err" data-err="general" role="alert"></p>
        <div class="acciones-form"><button type="submit" class="btn btn-primary">Comprobar disponibilidad y ver nota</button></div>
      </form>
    </section>`, 'Completa los datos. Antes de enviar verás la nota formal.');
}
/* ¿"f" es una fecha AAAA-MM-DD de hoy en adelante? (evita quedarse con una fecha vieja al reabrir el formulario) */
function f_esValida(f){ return !!f && /^\d{4}-\d{2}-\d{2}$/.test(f) && f >= iso(new Date()); }
function vCMis(){
  const u = usuarioActual(), hoy = iso(new Date()), m = minutosAhora();
  // Solo reservas actuales y próximas (no existe historial)
  const lista = ordenar(getReservas().filter(r => u && r.userId === u.id && (r.fecha > hoy || (r.fecha === hoy && mins(r.fin) > m))));
  const cuerpo = lista.length ? `<ul class="lista">${lista.map(r => `<li class="tarjeta-sol"><div class="cab-sol"><div><h3>${cap(diaSemana(r.fecha))} ${fechaCorta(r.fecha)}</h3></div>${chipSol(r.estado)}</div>
      <dl class="dl"><dt>Horario</dt><dd>${esc(r.inicio)} - ${esc(r.fin)} hs</dd><dt>Actividad</dt><dd>${esc(r.actividad)}</dd></dl></li>`).join('')}</ul>`
    : `<div class="bloque"><p class="vacio-msg">No tienes reservas actuales ni próximas.</p><button class="btn btn-primary" data-accion="ir" data-vista="c_reservar">Reservar cancha</button></div>`;
  return shell('Mis reservas', cuerpo, 'Tus reservas actuales y próximas.');
}
function vCPerfil(){
  const u = usuarioActual(); if (!u) return redirigir('publica');
  return shell('Perfil', `<div class="bloque" style="max-width:560px"><dl class="dl"><dt>Nombre</dt><dd>${esc(u.nombre)}</dd><dt>Apellido</dt><dd>${esc(u.apellido)}</dd><dt>DNI</dt><dd>${esc(u.dni)}</dd><dt>Email</dt><dd>${esc(u.email)}</dd><dt>Cuenta</dt><dd>${u.verificado ? 'Verificada' : 'Sin verificar'}</dd></dl></div>`);
}

/* Opciones <option> de horas en punto, de "desde" a "hasta" (ambas inclusive). "sel" es el valor ya elegido. */
function optsHora(desde, hasta, sel){
  let h = '<option value="">Elige una hora</option>';
  for (let x = desde; x <= hasta; x++) h += `<option value="${hh(x)}" ${sel === hh(x) ? 'selected' : ''}>${hh(x)}</option>`;
  return h;
}

Object.assign(ENVIOS, {
  /* ---- Reserva: validar y pasar a la vista previa ---- */
  reserva(form){
    const d = valorForm(form), e = {}, u = usuarioActual();
    S.form = { fecha:d.fecha, inicio:d.inicio, fin:d.fin, actividad:d.actividad.trim(), observaciones:d.observaciones.trim() };
    if (!d.fecha) e.fecha = 'Elige una fecha.';
    if (!d.inicio) e.inicio = 'Elige la hora de inicio.';
    if (!d.fin) e.fin = 'Elige la hora de finalización.';
    if (!ACTIVIDADES_RESERVA.includes(S.form.actividad)) e.actividad = 'Elige la actividad: Vóley o Básquet.';
    if (!Object.keys(e).length){
      const r = chequear(d.fecha, d.inicio, d.fin);
      if (!r.ok) e.general = r.motivo;
      else if (getReservas().some(x => x.userId === u.id && x.estado === 'pendiente' && x.fecha === d.fecha && solapa(mins(x.inicio), mins(x.fin), mins(d.inicio), mins(d.fin))))
        e.general = 'Ya tienes una solicitud pendiente en ese horario.';
    }
    if (!mostrarErrores(form, e)) return;
    S.paso = 'preview'; render(true);
  },
});

/* Disponibilidad en vivo dentro del formulario de reserva */
function actualizarDisp(form){
  const box = $('[data-live="disp"]', form); if (!box) return;
  const f = form.fecha.value, i = form.inicio.value, o = form.fin.value;
  if (!f){ box.innerHTML = 'Elige una fecha para ver los horarios no disponibles de ese día.'; return; }
  const oc = rangosNoDisponibles(f);
  let h = oc.length ? `<p><strong>Horarios no disponibles ese día:</strong> ${oc.join(', ')}.</p>` : '<p><strong>Todos los horarios de ese día están disponibles.</strong></p>';
  if (i && o){ const r = chequear(f, i, o); h += r.ok ? `<p><span class="chip t-libre">Disponible</span> El horario elegido está libre.</p>` : `<p><span class="chip t-ocupada">No disponible</span> ${esc(r.motivo)}</p>`; }
  box.innerHTML = h;
}
document.addEventListener('change', e => {
  const t = e.target, form = t.closest('form[data-form]');
  if (form && form.dataset.form === 'reserva'){
    if (t.name === 'inicio'){                                  // la hora de fin siempre es posterior a la de inicio
      const fin = form.fin, prev = fin.value, ini = t.value ? Number(t.value.slice(0,2)) : CONFIG.HORA_APERTURA;
      fin.innerHTML = optsHora(ini + 1, CONFIG.HORA_CIERRE, prev);
      if (prev && mins(prev) <= mins(t.value || '00:00')) fin.value = '';
    }
    actualizarDisp(form);
  }
});

Object.assign(ACCIONES, {
  'volver-editar'(){ S.paso = 'form'; render(true); },
  async 'confirmar-solicitud'(a){
    const u = usuarioActual(), f = S.form; if (!u || !f.fecha) return;
    const r = chequear(f.fecha, f.inicio, f.fin);                          // se vuelve a comprobar antes de guardar
    if (!r.ok){ aviso(r.motivo, 'error'); S.paso = 'form'; render(true); return; }
    a.disabled = true;
    const n = DB.leer('contador', 0) + 1; DB.guardar('contador', n);
    const ahora = ahoraLocal();
    const nueva = { id:'r' + Date.now().toString(36) + n, userId:u.id, cliente:{ nombre:u.nombre, apellido:u.apellido, dni:u.dni, email:u.email },
      fecha:f.fecha, inicio:f.inicio, fin:f.fin, actividad:f.actividad, observaciones:f.observaciones, estado:'pendiente',
      creada:ahora, decidida:null, numero:`SUM-${new Date().getFullYear()}-${String(n).padStart(4,'0')}`, pdfGenerado:null };
    const doc = generarPDFNota(nueva);                                     // se genera el PDF de la nota...
    nueva.pdfGenerado = doc ? ahora : null;                                // ...y queda asociado a la reserva
    setReservas([...getReservas(), nueva]);
    S.ultima = nueva.id; S.paso = 'ok'; render(true);
    if (!doc) aviso('La solicitud se guardó, pero no se pudo cargar el generador de PDF. Podrás descargarlo más tarde.', 'error');
  },
});

ALRENDERIZAR.push(() => { const f = $('form[data-form="reserva"]'); if (f) actualizarDisp(f); });
RENDER.c_inicio = vCInicio;
RENDER.c_reservar = vCReservar;
RENDER.c_mis = vCMis;
RENDER.c_perfil = vCPerfil;
arrancar();
