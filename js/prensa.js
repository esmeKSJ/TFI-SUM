'use strict';
/* SUM Municipal - PANEL DE PRENSA
   Páginas: html/prensa/*.html */

/* =====================================================================
   VISTAS DE PRENSA (solo información pública)
   ===================================================================== */
function actCard(a){
  const h = a.inicio ? `, ${esc(a.inicio)}${a.fin ? ' - ' + esc(a.fin) : ''} hs` : '';
  return `<li class="tarjeta-sol"><div class="cab-sol"><h3>${esc(a.titulo)}</h3>${a.flyer ? '<span class="chip t-libre">Con flyer</span>' : ''}</div>
    <dl class="dl"><dt>Fecha</dt><dd>${cap(diaSemana(a.fecha))} ${fechaLarga(a.fecha)}${h}</dd>${a.descripcion ? `<dt>Detalle</dt><dd>${esc(a.descripcion)}</dd>` : ''}</dl>
    ${a.flyer ? `<img class="act-flyer" src="${a.flyer}" alt="Flyer: ${esc(a.titulo)}">` : ''}
    <div class="barra-acc" style="margin:0"><button class="btn btn-sec btn-chico" data-accion="act-editar" data-id="${esc(a.id)}">Editar</button><button class="btn btn-peligro btn-chico" data-accion="act-eliminar" data-id="${esc(a.id)}">Eliminar</button></div></li>`;
}
function actividadesPrensaHTML(){
  const propias = getActs().slice().sort((a, b) => (a.fecha + (a.inicio || '')).localeCompare(b.fecha + (b.inicio || '')));
  const conf = actividadesPublicas();
  return `<div class="barra-acc"><button class="btn btn-primary" data-accion="act-nueva">+ Agregar nueva actividad</button></div>
    <section class="bloque"><h2>Actividades publicadas</h2>
      ${propias.length ? `<ul class="lista">${propias.map(actCard).join('')}</ul>` : '<p class="vacio-msg">Todavía no agregaste actividades. Usa el botón para crear la primera.</p>'}</section>
    <section class="bloque" style="margin-top:24px"><h2>Reservas confirmadas</h2>
      ${conf.length ? `<ul class="lista">${conf.map(r => `<li class="fila"><div><strong>${esc(r.actividad)}</strong><small>${cap(diaSemana(r.fecha))} ${fechaCorta(r.fecha)}, ${esc(r.inicio)} - ${esc(r.fin)} hs</small></div></li>`).join('')}</ul>` : '<p class="vacio-msg">No hay reservas confirmadas próximas.</p>'}</section>`;
}
function vPInicio(){ return shell('Actividades', actividadesPrensaHTML(), CONFIG.NOMBRE_SUM + ' · ' + CONFIG.MUNICIPALIDAD); }
function vPActividades(){ return shell('Actividades', actividadesPrensaHTML(), 'Agrega actividades y, si quieres, un flyer: se muestra en el inicio para todos los usuarios.'); }
function vPInfo(){
  const I = getInfo();
  return shell('Información', `<form class="bloque" data-form="info" style="max-width:760px" novalidate>
    <h2>Editar información del SUM</h2>
    <div class="campo"><label for="direccion">Dirección</label><input id="direccion" name="direccion" maxlength="160" value="${esc(I.direccion)}" aria-describedby="e-direccion"><p class="err" id="e-direccion" data-err="direccion"></p></div>
    <div class="campo"><label for="horario">Horarios de funcionamiento</label><input id="horario" name="horario" maxlength="160" value="${esc(I.horario)}" aria-describedby="e-horario"><p class="err" id="e-horario" data-err="horario"></p></div>
    <div class="campo"><label for="uso">Uso de la cancha</label><textarea id="uso" name="uso" maxlength="600">${esc(I.uso)}</textarea></div>
    <div class="campo"><label for="actividades">Actividades permitidas</label><textarea id="actividades" name="actividades" maxlength="800">${esc(I.actividades.join('\n'))}</textarea><p class="ayuda">Una por línea.</p></div>
    <div class="campo"><label for="normas">Normas de utilización</label><textarea id="normas" name="normas" maxlength="1200">${esc(I.normas.join('\n'))}</textarea><p class="ayuda">Una por línea.</p></div>
    <div class="acciones-form"><button type="submit" class="btn btn-primary">Guardar información</button></div></form>`, 'Los cambios se ven en la información pública del SUM.');
}

function abrirFormActividad(a){
  S.flyer = a ? (a.flyer || '') : '';
  const v = a || {};
  abrirModal(a ? 'Editar actividad' : 'Nueva actividad', `<form data-form="actividad" id="form-actividad" novalidate>
    <input type="hidden" name="id" value="${esc(v.id || '')}">
    <div class="campo"><label for="titulo">Nombre de la actividad</label><input id="titulo" name="titulo" maxlength="100" value="${esc(v.titulo || '')}" aria-describedby="e-titulo"><p class="err" id="e-titulo" data-err="titulo"></p></div>
    <div class="campo"><label for="fecha-act">Fecha</label><input id="fecha-act" name="fecha" type="date" value="${esc(v.fecha || iso(new Date()))}" aria-describedby="e-fecha"><p class="err" id="e-fecha" data-err="fecha"></p></div>
    <div class="fila2">
      <div class="campo"><label for="inicio-act">Hora de inicio <span class="ayuda">(opcional)</span></label><input id="inicio-act" name="inicio" type="time" value="${esc(v.inicio || '')}"></div>
      <div class="campo"><label for="fin-act">Hora de fin <span class="ayuda">(opcional)</span></label><input id="fin-act" name="fin" type="time" value="${esc(v.fin || '')}" aria-describedby="e-fin"><p class="err" id="e-fin" data-err="fin"></p></div>
    </div>
    <div class="campo"><label for="descripcion">Descripción <span class="ayuda">(opcional)</span></label><textarea id="descripcion" name="descripcion" maxlength="400">${esc(v.descripcion || '')}</textarea></div>
    <div class="campo"><label for="flyer">Flyer <span class="ayuda">(opcional, imagen)</span></label><input id="flyer" name="flyer" type="file" accept="image/*" aria-describedby="e-flyer"><p class="err" id="e-flyer" data-err="flyer"></p>
      <div data-preview>${S.flyer ? `<img class="miniatura" src="${S.flyer}" alt="Vista previa del flyer">` : ''}</div>
      ${S.flyer ? '<button type="button" class="btn btn-sec btn-chico" style="margin-top:8px" data-accion="quitar-flyer">Quitar flyer</button>' : ''}</div>
  </form>`, `<button class="btn btn-sec" data-accion="cerrar-modal">Cancelar</button><button class="btn btn-primary" type="submit" form="form-actividad">Guardar actividad</button>`);
}

Object.assign(ENVIOS, {
  /* ---- Prensa: actividad (nueva o editada) ---- */
  actividad(form){
    const d = valorForm(form), e = {};
    if (!d.titulo.trim()) e.titulo = 'Ingresa el nombre de la actividad.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.fecha || '')) e.fecha = 'Elige la fecha.';
    if (d.inicio && d.fin && mins(d.fin) <= mins(d.inicio)) e.fin = 'La hora de fin debe ser posterior a la de inicio.';
    if (!mostrarErrores(form, e)) return;
    const l = getActs(), id = d.id, datos = { titulo:d.titulo.trim(), fecha:d.fecha, inicio:d.inicio || '', fin:d.fin || '', descripcion:(d.descripcion || '').trim(), flyer:S.flyer || '' };
    const i = id ? l.findIndex(x => x.id === id) : -1;
    if (i >= 0) l[i] = Object.assign(l[i], datos); else l.push(Object.assign({ id:'a' + Date.now().toString(36), creada:ahoraLocal() }, datos));
    if (!setActs(l)) aviso('No se pudo guardar de forma permanente (¿imagen muy pesada?). La actividad durará solo esta sesión.', 'error');
    else aviso(i >= 0 ? 'Actividad actualizada.' : 'Actividad agregada.');
    S.flyer = ''; cerrarModal(); render(false);
  },
  /* ---- Prensa: información del SUM ---- */
  info(form){
    const d = valorForm(form), e = {}, lineas = t => (t || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    if (!d.direccion.trim()) e.direccion = 'Indica la dirección.';
    if (!d.horario.trim()) e.horario = 'Indica los horarios.';
    if (!mostrarErrores(form, e)) return;
    DB.guardar('info', { direccion:d.direccion.trim(), horario:d.horario.trim(), uso:d.uso.trim(), actividades:lineas(d.actividades), normas:lineas(d.normas) });
    aviso('Información actualizada.'); render(false);
  },
});

document.addEventListener('change', async e => {
  const t = e.target, form = t.closest('form[data-form]');
  /* Flyer de una actividad: valida que sea imagen y la reduce para ahorrar espacio */
  if (t.matches('input[type=file][name=flyer]')){
    const file = t.files && t.files[0], err = $('[data-err="flyer"]', form), prev = $('[data-preview]', form);
    if (!file){ return; }
    const fallo = m => { if (err) err.textContent = m; t.value = ''; };
    if (!file.type.startsWith('image/')) return fallo('El archivo debe ser una imagen (JPG, PNG, etc.).');
    if (file.size > 10*1024*1024) return fallo('La imagen pesa más de 10 MB. Elige una más liviana.');
    try{
      const url = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(file); });
      const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
      const esc_ = Math.min(1, 1000 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * esc_); cv.height = Math.round(img.height * esc_);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      S.flyer = cv.toDataURL('image/jpeg', 0.75);
      if (err) err.textContent = '';
      if (prev) prev.innerHTML = `<img class="miniatura" src="${S.flyer}" alt="Vista previa del flyer">`;
    }catch(x){ fallo('No se pudo leer la imagen. Prueba con otro archivo.'); }
  }
});

Object.assign(ACCIONES, {
  'quitar-flyer'(a){ S.flyer = ''; const p = $('#form-actividad [data-preview]'); if (p) p.innerHTML = ''; const f = $('#form-actividad input[type=file]'); if (f) f.value = ''; a.remove(); },
  'act-nueva'(){ abrirFormActividad(null); },
  'act-editar'(a){ abrirFormActividad(getActs().find(x => x.id === a.dataset.id) || null); },
  async 'act-eliminar'(a){
    if (!(await confirmar('Eliminar actividad', 'Se eliminará la actividad y su flyer. ¿Continuar?', 'Eliminar', true))) return;
    setActs(getActs().filter(x => x.id !== a.dataset.id)); aviso('Actividad eliminada.'); render(false);
  },
});

RENDER.p_inicio = vPInicio;
RENDER.p_actividades = vPActividades;
RENDER.p_info = vPInfo;
arrancar();
