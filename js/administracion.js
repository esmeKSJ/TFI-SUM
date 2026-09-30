'use strict';
/* SUM Municipal - PANEL DE ADMINISTRACIÓN
   Páginas: html/administracion/*.html */

/* =====================================================================
   VISTAS DE ADMINISTRACIÓN
   ===================================================================== */
const filaRes = (r, conCliente) => `<li class="fila"><div><strong>${esc(r.inicio)} - ${esc(r.fin)} hs</strong> ${esc(r.actividad)}<small>${cap(diaSemana(r.fecha))} ${fechaCorta(r.fecha)}${conCliente ? ' - ' + esc(r.cliente.nombre + ' ' + r.cliente.apellido) : ''}</small></div>${chipSol(r.estado)}</li>`;

function vAInicio(){
  const rs = getReservas(), hoy = iso(new Date());
  const delDia = ordenar(rs.filter(r => r.estado === 'aprobada' && r.fecha === hoy));
  const prox = ordenar(rs.filter(r => r.estado === 'aprobada' && r.fecha > hoy)).slice(0, 6);
  const cnt = e => rs.filter(r => r.estado === e).length;
  return shell('Inicio', `${marcadorHTML(false, 'admin')}
    <div class="cifras" role="group" aria-label="Solicitudes">
      <button data-accion="ir-sol" data-tab="pendiente"><b>${cnt('pendiente')}</b><span>Solicitudes pendientes</span></button>
      <button data-accion="ir-sol" data-tab="aprobada"><b>${cnt('aprobada')}</b><span>Solicitudes aprobadas</span></button>
      <button data-accion="ir-sol" data-tab="rechazada"><b>${cnt('rechazada')}</b><span>Solicitudes rechazadas</span></button>
    </div>
    <div class="dos-col">
      <section class="bloque"><h2>Reservas del día</h2>${delDia.length ? `<ul class="lista">${delDia.map(r => filaRes(r, true)).join('')}</ul>` : '<p class="vacio-msg">Hoy no hay reservas aprobadas.</p>'}</section>
      <section class="bloque"><h2>Próximas reservas</h2>${prox.length ? `<ul class="lista">${prox.map(r => filaRes(r, true)).join('')}</ul>` : '<p class="vacio-msg">No hay próximas reservas aprobadas.</p>'}</section>
    </div>`);
}
function vACalendario(){
  return shell('Calendario', calendarioHTML('admin'), 'Todas las reservas y la disponibilidad. Toca una reserva para ver su detalle.');
}
function vAReservas(){
  const lista = ordenar(getReservas());
  const filas = lista.map(r => `<tr><td>${esc(r.cliente.nombre + ' ' + r.cliente.apellido)}</td><td>${fechaCorta(r.fecha)}</td><td>${esc(r.inicio)}</td><td>${esc(r.fin)}</td><td>${esc(r.actividad)}</td><td>${chipSol(r.estado)}</td>
    <td><div class="acciones"><button class="btn btn-sec btn-chico" data-accion="ver-reserva" data-id="${esc(r.id)}">Ver detalle</button><button class="btn btn-sec btn-chico" data-accion="ver-solicitud" data-id="${esc(r.id)}">Ver solicitud</button><button class="btn btn-sec btn-chico" data-accion="ver-nota" data-id="${esc(r.id)}">Ver PDF</button>${['pendiente','aprobada'].includes(r.estado) ? `<button class="btn btn-peligro btn-chico" data-accion="cancelar-reserva" data-id="${esc(r.id)}">Cancelar</button>` : ''}</div></td></tr>`).join('');
  return shell('Reservas', `<div class="barra"><p class="sub" style="margin:0">${lista.length} ${lista.length === 1 ? 'reserva registrada' : 'reservas registradas'}.</p><button class="btn btn-primary" data-accion="informe-abrir">GENERAR INFORME PDF</button></div>
    ${lista.length ? `<div class="tabla-wrap"><table><thead><tr><th>Cliente</th><th>Fecha</th><th>Hora de inicio</th><th>Hora de finalización</th><th>Actividad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${filas}</tbody></table></div>` : '<div class="bloque"><p class="vacio-msg">Todavía no hay reservas.</p></div>'}`);
}
function vASolicitudes(){
  const rs = ordenar(getReservas()), tab = S.solTab;
  const cnt = e => rs.filter(r => r.estado === e).length;
  const lista = rs.filter(r => r.estado === tab);
  const tabs = ['pendiente','aprobada','rechazada'].map(e => `<button aria-pressed="${tab === e}" data-accion="tab-sol" data-tab="${e}">${{ pendiente:'Pendientes', aprobada:'Aprobadas', rechazada:'Rechazadas' }[e]} (${cnt(e)})</button>`).join('');
  const tarjetas = lista.map(r => `<li class="tarjeta-sol"><div class="cab-sol"><h3>${esc(r.cliente.nombre + ' ' + r.cliente.apellido)}</h3>${chipSol(r.estado)}</div>
    <dl class="dl"><dt>Fecha</dt><dd>${cap(diaSemana(r.fecha))} ${fechaCorta(r.fecha)}</dd><dt>Horario</dt><dd>${esc(r.inicio)} - ${esc(r.fin)} hs</dd><dt>Actividad</dt><dd>${esc(r.actividad)}</dd></dl>
    <div class="acciones"><button class="btn btn-sec btn-chico" data-accion="ver-solicitud" data-id="${esc(r.id)}">Ver solicitud</button><button class="btn btn-sec btn-chico" data-accion="ver-nota" data-id="${esc(r.id)}">Ver nota formal</button><button class="btn btn-sec btn-chico" data-accion="pdf-nota" data-id="${esc(r.id)}">Descargar PDF</button>
    ${r.estado === 'pendiente' ? `<button class="btn btn-primary btn-chico" data-accion="aprobar" data-id="${esc(r.id)}">Aprobar</button><button class="btn btn-peligro btn-chico" data-accion="rechazar" data-id="${esc(r.id)}">Rechazar</button>` : ''}</div></li>`).join('');
  return shell('Solicitudes', `<div class="tabs" role="group" aria-label="Estado de las solicitudes">${tabs}</div>
    ${lista.length ? `<ul class="lista">${tarjetas}</ul>` : `<div class="bloque"><p class="vacio-msg">No hay solicitudes ${{ pendiente:'pendientes', aprobada:'aprobadas', rechazada:'rechazadas' }[tab]}.</p></div>`}`,
    'Al aprobar una solicitud, el horario queda reservado en el calendario. Al rechazarla, el horario sigue disponible.');
}
function vACancha(){
  const c = getCancha();
  const op = (v, t, d) => `<label class="radio-op"><input type="radio" name="estado" value="${v}" ${c.estado === v ? 'checked' : ''}><div><strong>${t}</strong><span>${d}</span></div></label>`;
  return shell('Cancha', `${marcadorHTML(false, 'admin')}
    <form data-form="cancha" class="bloque" style="max-width:680px;margin-top:24px" novalidate>
      <h2>Administrar el estado</h2>
      <div class="radios" role="radiogroup" aria-label="Estado de la cancha">
        ${op('disponible', 'Disponible', 'El estado se calcula solo, según las reservas aprobadas.')}
        ${op('ocupada', 'Ocupada', 'Se muestra como ocupada hasta que la cambies.')}
        ${op('reservada', 'Reservada', 'Se muestra como reservada hasta que la cambies.')}
        ${op('fuera_de_servicio', 'Fuera de servicio', 'Bloquea la cancha en las fechas que indiques.')}
      </div>
      <div data-fuera ${c.estado === 'fuera_de_servicio' ? '' : 'hidden'} style="margin-top:18px">
        <div class="campo"><label for="motivo">Motivo</label><input id="motivo" name="motivo" maxlength="140" value="${esc(c.motivo)}" aria-describedby="e-motivo"><p class="err" id="e-motivo" data-err="motivo"></p></div>
        <div class="fila2">
          <div class="campo"><label for="desde">Fecha de inicio</label><input id="desde" name="desde" type="date" value="${esc(c.desde)}" aria-describedby="e-desde"><p class="err" id="e-desde" data-err="desde"></p></div>
          <div class="campo"><label for="hasta">Fecha de finalización</label><input id="hasta" name="hasta" type="date" value="${esc(c.hasta)}" aria-describedby="e-hasta"><p class="ayuda">Déjala vacía si aún no se sabe.</p><p class="err" id="e-hasta" data-err="hasta"></p></div>
        </div>
      </div>
      <div class="acciones-form" style="margin-top:18px"><button type="submit" class="btn btn-primary">Guardar estado</button></div>
    </form>`);
}
function vAPrensa(){
  const acts = actividadesPublicas().slice(0, 6);
  return shell('Prensa', `<div class="dos-col" style="margin-top:0">
    <form class="bloque" data-form="prensa-cred" novalidate><h2>Acceso del perfil Prensa</h2>
      <p class="sub">Define con qué datos ingresa el perfil Prensa desde el inicio de sesión. Es una cuenta compartida, solo de consulta.</p>
      ${campo('pusuario', 'Usuario de Prensa', 'text', `value="${esc(prensaUsuario())}" autocomplete="off"`)}
      ${campo('pclave', 'Nueva contraseña', 'password', 'autocomplete="new-password"', 'Mínimo 8 caracteres, con letras y números.')}
      ${campo('pclave2', 'Confirmar contraseña', 'password', 'autocomplete="new-password"')}
      <div class="acciones-form"><button type="submit" class="btn btn-primary">Guardar acceso de Prensa</button></div></form>
    <section class="bloque"><h2>Lo que ve Prensa</h2>
      <p class="sub">Puede agregar actividades (con flyer opcional), ver las reservas confirmadas y editar la información del SUM. No ve DNI, CUIL, emails, teléfonos ni datos internos.</p>
      ${acts.length ? `<ul class="lista">${acts.map(r => `<li class="fila"><div><strong>${esc(r.actividad)}</strong><small>${cap(diaSemana(r.fecha))} ${fechaCorta(r.fecha)}, ${esc(r.inicio)} - ${esc(r.fin)} hs</small></div></li>`).join('')}</ul>` : '<p class="vacio-msg">No hay actividades confirmadas próximas.</p>'}
    </section></div>`);
}

/* Modales de detalle (Administración) */
function detalleHTML(r){
  return `<dl class="dl"><dt>Cliente</dt><dd>${esc(r.cliente.nombre + ' ' + r.cliente.apellido)}</dd><dt>Fecha</dt><dd>${cap(diaSemana(r.fecha))} ${fechaLarga(r.fecha)}</dd><dt>Horario</dt><dd>${esc(r.inicio)} a ${esc(r.fin)} hs</dd><dt>Actividad</dt><dd>${esc(r.actividad)}</dd><dt>Estado</dt><dd>${chipSol(r.estado)}</dd><dt>Solicitud asociada</dt><dd>${esc(r.numero)}</dd></dl>`;
}
function solicitudHTML(r){
  return `<dl class="dl"><dt>Número</dt><dd>${esc(r.numero)}</dd><dt>Fecha de solicitud</dt><dd>${fechaCorta(r.creada)}</dd><dt>Solicitante</dt><dd>${esc(r.cliente.nombre + ' ' + r.cliente.apellido)}</dd><dt>DNI</dt><dd>${esc(r.cliente.dni)}</dd><dt>Email</dt><dd>${esc(r.cliente.email)}</dd><dt>Fecha de uso</dt><dd>${fechaLarga(r.fecha)}</dd><dt>Horario</dt><dd>${esc(r.inicio)} a ${esc(r.fin)} hs</dd><dt>Actividad</dt><dd>${esc(r.actividad)}</dd><dt>Observaciones</dt><dd>${esc(r.observaciones || 'Sin observaciones')}</dd><dt>Estado</dt><dd>${chipSol(r.estado)}</dd></dl>`;
}
const botonesDetalle = id => `<button class="btn btn-sec" data-accion="ver-solicitud" data-id="${esc(id)}">Ver solicitud</button><button class="btn btn-primary" data-accion="ver-nota" data-id="${esc(id)}">Ver nota (PDF)</button>`;

Object.assign(ENVIOS, {
  /* ---- Estado de la cancha ---- */
  cancha(form){
    const d = valorForm(form), e = {};
    if (d.estado === 'fuera_de_servicio'){
      if (!d.motivo.trim()) e.motivo = 'Indica el motivo.';
      if (!d.desde) e.desde = 'Indica la fecha de inicio.';
      if (d.hasta && d.desde && d.hasta < d.desde) e.hasta = 'La fecha final no puede ser anterior a la de inicio.';
    }
    if (!mostrarErrores(form, e)) return;
    const fuera = d.estado === 'fuera_de_servicio';
    const nuevo = { estado:d.estado, motivo:fuera ? d.motivo.trim() : '', desde:fuera ? d.desde : '', hasta:fuera ? d.hasta : '' };
    setCancha(nuevo);
    let extra = '';
    if (fuera){
      const n = aprobadas().filter(r => r.fecha >= nuevo.desde && (!nuevo.hasta || r.fecha <= nuevo.hasta)).length;
      if (n) extra = ` Hay ${n} reserva${n > 1 ? 's aprobadas' : ' aprobada'} en ese período: revísalas en Reservas.`;
    }
    aviso('Estado de la cancha actualizado.' + extra); render(false);
  },
  /* ---- Acceso de Prensa (Administración) ---- */
  async 'prensa-cred'(form){
    const d = valorForm(form), e = {};
    if (!d.pusuario.trim()) e.pusuario = 'Indica el usuario.';
    validarClave(d.pclave, d.pclave2, e, 'pclave', 'pclave2');
    if (!mostrarErrores(form, e)) return;
    DB.guardar('prensa', { usuario:d.pusuario.trim(), passHash:await sha(d.pclave) });
    aviso('Acceso de Prensa actualizado.'); render(false);
  },
  /* ---- Informe PDF (modal) ---- */
  informe(form){
    const d = valorForm(form);
    if (!d.fecha) return mostrarErrores(form, { fecha:'Elige una fecha.' });
    const r = generarInforme(d.periodo, d.fecha);
    if (!r) return aviso('No se pudo cargar el generador de PDF. Revisa tu conexión.', 'error');
    guardarPDF(r.doc, r.nombre); cerrarModal();
  }
});

document.addEventListener('change', e => {
  const t = e.target, form = t.closest('form[data-form]');
  if (form && form.dataset.form === 'cancha' && t.name === 'estado'){
    const b = $('[data-fuera]', form); if (b) b.hidden = t.value !== 'fuera_de_servicio';
  }
});

Object.assign(ACCIONES, {
  'ver-reserva'(a){ const r = buscar(a.dataset.id); if (r) abrirModal('Detalle de la reserva', detalleHTML(r), botonesDetalle(r.id)); },
  'ver-solicitud'(a){ const r = buscar(a.dataset.id); if (r) abrirModal('Solicitud', solicitudHTML(r), `<button class="btn btn-sec" data-accion="ver-nota" data-id="${esc(r.id)}">Ver nota formal</button>`); },
  'ver-nota'(a){ const r = buscar(a.dataset.id); if (r) abrirModal('Nota formal (PDF)', notaHTML(r), `<button class="btn btn-primary" data-accion="pdf-nota" data-id="${esc(r.id)}">Descargar PDF</button>`); },

  /* Administración: aprobar / rechazar / cancelar */
  aprobar(a){
    const r = buscar(a.dataset.id); if (!r) return;
    const ch = chequear(r.fecha, r.inicio, r.fin, r.id);                   // evita superposiciones al aprobar
    if (!ch.ok){ aviso('No se puede aprobar: ' + ch.motivo, 'error'); return; }
    setReservas(getReservas().map(x => x.id === r.id ? { ...x, estado:'aprobada', decidida:ahoraLocal() } : x));
    aviso('Solicitud aprobada. El horario quedó reservado en el calendario.'); render(false);
  },
  async rechazar(a){
    const r = buscar(a.dataset.id); if (!r) return;
    if (!(await confirmar('Rechazar solicitud', `Se rechazará la solicitud de ${r.cliente.nombre} ${r.cliente.apellido} del ${fechaCorta(r.fecha)}. El horario seguirá disponible.`, 'Rechazar solicitud', true))) return;
    setReservas(getReservas().map(x => x.id === r.id ? { ...x, estado:'rechazada', decidida:ahoraLocal() } : x));
    aviso('Solicitud rechazada.'); render(false);
  },
  async 'cancelar-reserva'(a){
    const r = buscar(a.dataset.id); if (!r) return;
    if (!(await confirmar('Cancelar reserva', `Se cancelará la reserva de ${r.cliente.nombre} ${r.cliente.apellido} del ${fechaCorta(r.fecha)}, ${r.inicio} a ${r.fin} hs. El horario quedará libre.`, 'Cancelar reserva', true))) return;
    setReservas(getReservas().map(x => x.id === r.id ? { ...x, estado:'cancelada', decidida:ahoraLocal() } : x));
    aviso('Reserva cancelada.'); render(false);
  },
  'tab-sol'(a){ S.solTab = a.dataset.tab; render(false); },
  'ir-sol'(a){ S.solTab = a.dataset.tab; ir('a_solicitudes'); },

  /* Administración: informe PDF */
  'informe-abrir'(){
    abrirModal('Generar informe PDF', `<form data-form="informe" id="form-informe" novalidate>
      <div class="campo"><span class="lbl">Período</span><div class="radios">
        <label class="radio-op"><input type="radio" name="periodo" value="dia" checked><div><strong>Día</strong></div></label>
        <label class="radio-op"><input type="radio" name="periodo" value="semana"><div><strong>Semana</strong><span>De lunes a domingo, según la fecha elegida.</span></div></label>
        <label class="radio-op"><input type="radio" name="periodo" value="mes"><div><strong>Mes</strong><span>El mes completo de la fecha elegida.</span></div></label></div></div>
      <div class="campo"><label for="fecha-inf">Fecha</label><input id="fecha-inf" name="fecha" type="date" value="${iso(new Date())}" aria-describedby="e-fecha"><p class="err" id="e-fecha" data-err="fecha"></p></div>
      <p class="ayuda">Incluye las reservas aprobadas, pendientes y canceladas del período.</p></form>`,
      `<button class="btn btn-sec" data-accion="cerrar-modal">Cancelar</button><button class="btn btn-primary" type="submit" form="form-informe">Generar informe</button>`);
  },
});

RENDER.a_inicio = vAInicio;
RENDER.a_calendario = vACalendario;
RENDER.a_reservas = vAReservas;
RENDER.a_solicitudes = vASolicitudes;
RENDER.a_cancha = vACancha;
RENDER.a_prensa = vAPrensa;
arrancar();
