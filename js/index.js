'use strict';
/* SUM Municipal - VISTA PÚBLICA
   Página: index.html (estado de la cancha, calendario e información del SUM; no requiere sesión) */

/* ---------- Flyers publicados por Prensa (se ven en el inicio, sobre el estado de la cancha) ---------- */
function flyersVigentes(){
  const hoy = iso(new Date());
  return getActs().filter(a => a.flyer && (!a.fecha || a.fecha >= hoy)).sort((a, b) => (a.fecha || '9').localeCompare(b.fecha || '9'));
}
function flyersHTML(){
  const fl = flyersVigentes(); if (!fl.length) return '';
  return `<section class="flyers" aria-label="Actividades destacadas">${fl.map(a => `<button type="button" class="flyer-card" data-accion="ver-flyer" data-id="${esc(a.id)}"><img src="${a.flyer}" alt="Flyer: ${esc(a.titulo)}"><span>${esc(a.titulo)}${a.fecha ? `<small>${cap(diaSemana(a.fecha))} ${fechaCorta(a.fecha)}${a.inicio ? ', ' + esc(a.inicio) + (a.fin ? ' - ' + esc(a.fin) : '') + ' hs' : ''}</small>` : ''}</span></button>`).join('')}</section>`;
}

/* ---------- Información pública del SUM ---------- */
function infoHTML(){
  const I = getInfo();
  return `<section class="seccion" aria-labelledby="t-info"><h2 id="t-info">Información del SUM</h2>
    <dl class="info-datos">
      <div><dt>Nombre</dt><dd>${esc(CONFIG.NOMBRE_SUM)}</dd></div>
      <div><dt>Municipalidad</dt><dd>${esc(CONFIG.MUNICIPALIDAD)}</dd></div>
      <div><dt>Dirección</dt><dd>${esc(I.direccion)}</dd></div>
      <div><dt>Horarios de funcionamiento</dt><dd>${esc(I.horario)}</dd></div>
    </dl>
    <div class="info-listas">
      <div><h3>Uso de la cancha</h3><p>${esc(I.uso)}</p></div>
      <div><h3>Actividades permitidas</h3><ul>${I.actividades.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>
      <div><h3>Normas de utilización</h3><ul>${I.normas.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>
    </div></section>`;
}

/* ---- Vista pública inicial (NO es una landing page: es la consulta rápida del SUM) ---- */
function vPublica(){
  const acc = S.sesion
    ? `<button class="btn btn-sec btn-chico" data-accion="mi-panel">Ir a mi panel</button>`
    : `<button class="btn btn-sec btn-chico" data-accion="ingresar">Ingresar</button>`;
  return `${cabecera(acc)}
  <main class="contenedor" id="main">
    <h1 class="sr-only">${esc(CONFIG.NOMBRE_SUM)} - ${esc(CONFIG.MUNICIPALIDAD)}</h1>
    ${flyersHTML()}
    ${marcadorHTML('RESERVAR CANCHA')}
    <section class="seccion" aria-labelledby="t-cal"><h2 id="t-cal">Calendario de disponibilidad</h2>
      <p class="sub">Elige un día para ver qué horarios están libres, reservados, ocupados o bloqueados. No hace falta iniciar sesión.</p>
      ${calendarioHTML('publica')}
      <div class="cta-fila"><button class="btn btn-primary" data-accion="reservar">RESERVAR CANCHA</button></div>
    </section>
    ${infoHTML()}
  </main>${pie()}`;
}

Object.assign(ACCIONES, {
  'ver-flyer'(a){
    const x = getActs().find(v => v.id === a.dataset.id); if (!x) return;
    abrirModal(x.titulo, `<img class="flyer-vista" src="${x.flyer}" alt="Flyer: ${esc(x.titulo)}">${x.descripcion ? `<p style="margin-top:12px">${esc(x.descripcion)}</p>` : ''}`);
  },
});

RENDER.publica = vPublica;
arrancar();
