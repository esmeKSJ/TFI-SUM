'use strict';
/* SUM Municipal - JS GENERAL
   Lo que comparten TODAS las páginas: configuración, utilidades, almacenamiento, disponibilidad,
   navegación y componentes de interfaz. Cada página lo carga primero y después su script propio. */

/* =====================================================================
   CONFIGURACIÓN  (todo lo que se puede modificar está aquí)
   ===================================================================== */
const CONFIG = {
  NOMBRE_SUM: 'SUM Municipal',
  MUNICIPALIDAD: 'Municipalidad de Bella Vista',

  // ★ Ruta del logo de la Municipalidad, contada desde la carpeta raíz (donde está index.html). Cambiar solo este valor.
  LOGO_RUTA: 'ruta/al/logo-municipalidad.png',

  DIRECCION: 'Calle y número a completar, Bella Vista, Tucumán',
  HORARIO_TEXTO: 'Todos los días, de 08:00 a 23:00 hs',
  HORA_APERTURA: 8,    // hora de apertura (0-23)
  HORA_CIERRE: 23,     // hora de cierre (0-23). Los turnos son de 1 hora.

  // ★ Cuenta de Administración predeterminada. Modificar aquí cuando se necesite.
  //   (Nunca se muestran en la interfaz.)
  ADMIN: { usuario: 'Admin sum', clave: 'admin123' },

  // Cuenta inicial del perfil Prensa (la Administración puede cambiarla desde su sección "Prensa").
  PRENSA: { usuario: 'prensa', clave: 'prensa123' },

  MI_ARGENTINA_URL: 'https://mi.argentina.gob.ar',
  
  CIUDAD_NOTA: 'San Miguel de Tucumán',   // ciudad que aparece en la nota formal
  CODIGO_MINUTOS: 10,                     // duración de los códigos de 4 dígitos

  // MODO DEMOSTRACIÓN: mientras sea true
  //  - no hay servidor de correo, por lo que el código de 4 dígitos se muestra en pantalla;
  //  - se cargan algunas reservas de ejemplo la primera vez;
  //  - se muestra un aviso al pie de la vista pública.
  // Poner en false al conectar un servidor real (ver enviarEmail()).
  MODO_DEMO: true,

  // Contenido informativo de la vista pública (editable)
  INFO: {
    uso: 'La cancha se utiliza por turnos de una hora, previa solicitud y aprobación de la Administración. Las reservas pueden hacerse con cuenta verificada.',
    actividades: ['Fútbol sala', 'Básquet', 'Vóley', 'Handball', 'Actividades deportivas y recreativas', 'Eventos comunitarios y escolares'],
    normas: [
      'Usar calzado deportivo de suela limpia.',
      'Respetar el horario reservado y dejar la cancha ordenada.',
      'No se permite ingresar bebidas alcohólicas.',
      'El solicitante es responsable por los daños que se produzcan durante su turno.',
      'Los menores de edad deben estar acompañados por un adulto responsable.'
    ]
  }
};

/* =====================================================================
   UTILIDADES GENERALES
   ===================================================================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
/* Escapa texto para insertarlo de forma segura en HTML */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const p2 = n => String(n).padStart(2, '0');
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const iso   = d => `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;      // Date -> 'AAAA-MM-DD'
const deISO = s => { const [y,m,d] = s.slice(0,10).split('-').map(Number); return new Date(y, m-1, d); };
const ahoraLocal = () => { const d = new Date(); return `${iso(d)}T${p2(d.getHours())}:${p2(d.getMinutes())}`; };
const fechaLarga = s => { const d = deISO(s); return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; };
const fechaCorta = s => { const [y,m,d] = s.slice(0,10).split('-'); return `${d}/${m}/${y}`; };
const diaMes     = s => { const d = deISO(s); return `${d.getDate()} de ${MESES[d.getMonth()]}`; };
const diaSemana  = s => DIAS[deISO(s).getDay()];
const mins  = hhmm => { const [h,m] = hhmm.split(':').map(Number); return h*60 + m; };   // 'HH:MM' -> minutos
const hh    = h => `${p2(h)}:00`;
const solapa = (a1,a2,b1,b2) => a1 < b2 && b1 < a2;                                       // ¿se superponen dos rangos?
const norm  = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
const titulo = s => String(s||'').trim().replace(/\s+/g,' ').toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (m,a,b) => a + b.toUpperCase());
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const minutosAhora = () => { const d = new Date(); return d.getHours()*60 + d.getMinutes(); };

/* Hash de contraseñas (SHA-256 cuando el navegador lo permite). */
async function sha(txt){
  const s = 'sumbv|' + txt;
  try{
    if (window.crypto && crypto.subtle){
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join('');
    }
  }catch(e){ /* se usa el respaldo */ }
  let h = 5381; for (const ch of s){ h = ((h << 5) + h + ch.charCodeAt(0)) | 0; } return 'x' + h;   // respaldo no criptográfico
}

/* =====================================================================
   ALMACENAMIENTO (localStorage con respaldo en memoria)
   ---------------------------------------------------------------------
   Toda la persistencia pasa por el objeto DB. Para conectar un servidor
   real, se reemplazan leer() y guardar() (o las funciones getUsuarios, setUsuarios, etc. de abajo).
   ===================================================================== */
const PREF = 'sumbv_';
const memoria = {};
let usaLS = true;
try{ localStorage.setItem(PREF+'t','1'); localStorage.removeItem(PREF+'t'); }catch(e){ usaLS = false; }
const DB = {
  leer(k, def){
    try{
      const raw = (k in memoria) ? memoria[k] : (usaLS ? localStorage.getItem(PREF+k) : null);
      return raw == null ? def : JSON.parse(raw);
    }catch(e){ return def; }
  },
  guardar(k, v){
    const raw = JSON.stringify(v);
    try{ if (usaLS){ localStorage.setItem(PREF+k, raw); delete memoria[k]; return true; } }catch(e){ /* cuota llena o bloqueado */ }
    memoria[k] = raw; return false;
  }
};
const getUsuarios = () => DB.leer('usuarios', []);
const setUsuarios = v => DB.guardar('usuarios', v);
const getReservas = () => DB.leer('reservas', []);
const setReservas = v => DB.guardar('reservas', v);
const getActs = () => DB.leer('actividades', []);
const setActs = v => DB.guardar('actividades', v);
const INFO_BASE = () => ({ direccion:CONFIG.DIRECCION, horario:CONFIG.HORARIO_TEXTO, uso:CONFIG.INFO.uso, actividades:CONFIG.INFO.actividades, normas:CONFIG.INFO.normas });
const getInfo = () => Object.assign(INFO_BASE(), DB.leer('info', {}));
const getCancha   = () => DB.leer('cancha', { estado:'disponible', motivo:'', desde:'', hasta:'' });
const setCancha   = v => DB.guardar('cancha', v);

/* Cuenta de Prensa: si la Administración la cambió, se usa la guardada; si no, la de CONFIG */
async function prensaCoincide(usuario, clave){
  const g = DB.leer('prensa', null);
  if (g) return norm(usuario) === norm(g.usuario) && (await sha(clave)) === g.passHash;
  return norm(usuario) === norm(CONFIG.PRENSA.usuario) && clave === CONFIG.PRENSA.clave;
}
const prensaUsuario = () => (DB.leer('prensa', null) || CONFIG.PRENSA).usuario;

/* =====================================================================
   NAVEGACIÓN ENTRE PÁGINAS Y ESTADO
   ---------------------------------------------------------------------
   Cada pantalla es un archivo HTML propio. Cada <body> declara:
     data-raiz="../../"   -> cómo volver a la carpeta donde está index.html
     data-vista="login"   -> qué vista dibuja esa página (ver VISTAS / RUTAS)
   ===================================================================== */
const RAIZ = document.body.dataset.raiz || '';

/* Archivo de cada vista, relativo a la raíz del sitio */
const RUTAS = {
  publica:'index.html',
  login:'html/login/login.html',
  registro:'html/registro/registro.html',
  verificacion:'html/verificacion/verificacion.html',
  olvide:'html/recuperacion/recuperar-clave.html',
  olvide_nueva:'html/recuperacion/nueva-clave.html',
  c_inicio:'html/cliente/inicio.html', c_reservar:'html/cliente/reservar.html',
  c_mis:'html/cliente/mis-reservas.html', c_perfil:'html/cliente/perfil.html',
  a_inicio:'html/administracion/inicio.html', a_calendario:'html/administracion/calendario.html',
  a_reservas:'html/administracion/reservas.html', a_solicitudes:'html/administracion/solicitudes.html',
  a_cancha:'html/administracion/cancha.html', a_prensa:'html/administracion/prensa.html',
  p_inicio:'html/prensa/inicio.html', p_actividades:'html/prensa/actividades.html', p_info:'html/prensa/informacion.html'
};
const urlDe = v => RAIZ + RUTAS[v];

/* Estado temporal que tiene que viajar de una página a la otra (a dónde ir después de iniciar sesión,
   el correo que se está verificando, el formulario de reserva en curso...). Dura lo que dure la pestaña. */
const TEMP = {
  leer(k, def){
    try{ const raw = sessionStorage.getItem(PREF + 'tmp_' + k); return raw == null ? def : JSON.parse(raw); }
    catch(e){ return DB.leer('tmp_' + k, def); }
  },
  guardar(k, v){
    try{ sessionStorage.setItem(PREF + 'tmp_' + k, JSON.stringify(v)); }
    catch(e){ DB.guardar('tmp_' + k, v); }
  }
};
const TEMP_CLAVES = ['next', 'verif', 'demoCodigo', 'form', 'paso', 'ultima', 'solTab', 'cal'];

const hoyD = new Date();
const S = {
  vista:'',                                // la fija cada página con <body data-vista="...">
  sesion: DB.leer('sesion', null),         // { rol:'cliente'|'admin'|'prensa', id }
  next: TEMP.leer('next', null),           // a dónde ir después de iniciar sesión
  menu:false,                              // menú móvil abierto
  cal: TEMP.leer('cal', { y:hoyD.getFullYear(), m:hoyD.getMonth(), dia:iso(hoyD) }),
  form: TEMP.leer('form', {}), paso: TEMP.leer('paso', 'form'), ultima: TEMP.leer('ultima', null),   // formulario de reserva
  verif: TEMP.leer('verif', null), demoCodigo: TEMP.leer('demoCodigo', null),                         // verificación por código
  flyer:'',                                // flyer temporal al crear/editar una actividad (Prensa)
  solTab: TEMP.leer('solTab', 'pendiente'),
  logoRoto:false
};
function guardarEstado(){ TEMP_CLAVES.forEach(k => TEMP.guardar(k, S[k])); }
window.addEventListener('pagehide', guardarEstado);
/* Si el navegador muestra una copia en caché al volver atrás (por ejemplo tras cerrar sesión), se recarga para volver a validar el acceso */
window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

/* =====================================================================
   LÓGICA DE DISPONIBILIDAD Y ESTADO DE LA CANCHA
   ===================================================================== */
const aprobadas = () => getReservas().filter(r => r.estado === 'aprobada');
const ordenar   = arr => arr.slice().sort((x,y) => (x.fecha + x.inicio).localeCompare(y.fecha + y.inicio));
/* ¿La cancha está "fuera de servicio" en esa fecha? */
const fueraVigente = (c, fecha) => c.estado === 'fuera_de_servicio' && (!c.desde || fecha >= c.desde) && (!c.hasta || fecha <= c.hasta);

/* Estado de una hora (turno de 1 h) de un día: libre / reservado / ocupado / bloqueado / fuera */
function estadoHora(fecha, h){
  if (fueraVigente(getCancha(), fecha)) return { e:'fuera' };
  const a = h*60, b = a + 60, hoy = iso(new Date()), m = minutosAhora();
  const r = aprobadas().find(x => x.fecha === fecha && solapa(mins(x.inicio), mins(x.fin), a, b));
  if (r){
    const enCurso = fecha === hoy && mins(r.inicio) <= m && m < mins(r.fin);
    return { e: enCurso ? 'ocupado' : 'reservado', r };
  }
  if (fecha < hoy || (fecha === hoy && a <= m)) return { e:'bloqueado' };   // horario que ya pasó
  return { e:'libre' };
}

/* Comprueba si se puede reservar [inicio, fin) en una fecha. Evita superposiciones. */
function chequear(fecha, inicio, fin, excluirId){
  if (!fecha || !inicio || !fin) return { ok:false, motivo:'Completa la fecha y las horas de inicio y de finalización.' };
  const a = mins(inicio), b = mins(fin);
  if (b <= a) return { ok:false, motivo:'La hora de finalización debe ser posterior a la de inicio.' };
  if (a < CONFIG.HORA_APERTURA*60 || b > CONFIG.HORA_CIERRE*60)
    return { ok:false, motivo:`El SUM funciona de ${hh(CONFIG.HORA_APERTURA)} a ${hh(CONFIG.HORA_CIERRE)} hs.` };
  const hoy = iso(new Date());
  if (fecha < hoy || (fecha === hoy && a <= minutosAhora())) return { ok:false, motivo:'El horario elegido ya pasó.' };
  if (fueraVigente(getCancha(), fecha)) return { ok:false, motivo:'La cancha estará fuera de servicio en esa fecha.' };
  if (aprobadas().some(r => r.id !== excluirId && r.fecha === fecha && solapa(mins(r.inicio), mins(r.fin), a, b)))
    return { ok:false, motivo:'Ese horario se superpone con una reserva ya aprobada.' };
  return { ok:true };
}

/* Estado actual global de la cancha (lo que muestra el marcador) */
function estadoActual(){
  const c = getCancha(), hoy = iso(new Date()), m = minutosAhora();
  if (fueraVigente(c, hoy)) return { clave:'fuera', motivo:c.motivo, desde:c.desde, hasta:c.hasta, manual:true, ref:null, proxima:null };
  const apr = ordenar(aprobadas());
  const enCurso = apr.find(r => r.fecha === hoy && mins(r.inicio) <= m && m < mins(r.fin)) || null;
  const futuras = apr.filter(r => r.fecha > hoy || (r.fecha === hoy && mins(r.inicio) > m));
  const proximaHoy = futuras.find(r => r.fecha === hoy) || null;
  let clave = 'libre', ref = null, manual = false;
  if (c.estado === 'ocupada')        { clave = 'ocupada';   ref = enCurso;                 manual = true; }
  else if (c.estado === 'reservada') { clave = 'reservada'; ref = proximaHoy || enCurso;   manual = true; }
  else if (enCurso)                  { clave = 'ocupada';   ref = enCurso; }
  else if (proximaHoy)               { clave = 'reservada'; ref = proximaHoy; }
  const proxima = futuras.find(r => r !== ref) || null;   // la siguiente reserva distinta de la mostrada
  return { clave, ref, manual, proxima };
}

/* Rangos no disponibles de un día, ej. ['15:00 - 16:00', '18:00 - 20:00'] */
function rangosNoDisponibles(fecha){
  const out = []; let ini = null;
  for (let h = CONFIG.HORA_APERTURA; h <= CONFIG.HORA_CIERRE; h++){
    const bloq = h < CONFIG.HORA_CIERRE && estadoHora(fecha, h).e !== 'libre';
    if (bloq && ini === null) ini = h;
    if (!bloq && ini !== null){ out.push(`${hh(ini)} - ${hh(h)}`); ini = null; }
  }
  return out;
}
/* Actividades confirmadas próximas (sin datos personales): las usan Prensa y la sección "Prensa" de Administración */
function actividadesPublicas(){
  const hoy = iso(new Date()), m = minutosAhora();
  return ordenar(aprobadas().filter(r => r.fecha > hoy || (r.fecha === hoy && mins(r.fin) > m)));
}
const buscar = id => getReservas().find(r => r.id === id);

/* =====================================================================
   DATOS DE DEMOSTRACIÓN (solo si CONFIG.MODO_DEMO y no hay reservas guardadas)
   ===================================================================== */
function sembrarDemo(){
  if (!CONFIG.MODO_DEMO || DB.leer('reservas', null) !== null) return;
  const hoy = new Date(), d = n => { const x = new Date(hoy); x.setDate(x.getDate() + n); return iso(x); };
  const c = (nombre, apellido, dni) => ({ nombre, apellido, dni, email:'demo@ejemplo.com' });
  const mk = (i, cli, fecha, ini, fin, act, obs, est) => ({
    id:'demo'+i, userId:'demo', cliente:cli, fecha, inicio:ini, fin, actividad:act, observaciones:obs, estado:est,
    creada: ahoraLocal(), decidida: est === 'pendiente' ? null : ahoraLocal(), numero:`SUM-DEMO-${p2(i)}`, pdfGenerado: ahoraLocal()
  });
  const lista = [];
  const hIni = Math.min(Math.max(hoy.getHours() + 2, CONFIG.HORA_APERTURA), CONFIG.HORA_CIERRE - 2);
  if (hoy.getHours() + 2 <= CONFIG.HORA_CIERRE - 2) lista.push(mk(1, c('Laura','Benítez','30123456'), d(0), hh(hIni), hh(hIni+2), 'Entrenamiento de fútbol sala', '', 'aprobada'));
  lista.push(mk(2, c('Martín','Sosa','28456789'), d(1), '18:00', '20:00', 'Torneo barrial de vóley', 'Se necesitan 20 sillas.', 'aprobada'));
  lista.push(mk(3, c('Andrea','Molina','27333444'), d(3), '10:00', '12:00', 'Acto escolar de la escuela N° 214', '', 'aprobada'));
  lista.push(mk(4, c('Carolina','Ruiz','33987654'), d(4), '20:00', '22:00', 'Práctica de básquet', 'Grupo de 12 personas.', 'pendiente'));
  lista.push(mk(5, c('Julián','Paz','35222111'), d(6), '15:00', '17:00', 'Cumpleaños infantil', '', 'pendiente'));
  setReservas(lista);
}

/* Qué rol puede ver cada vista (null = pública) */
const VISTAS = {
  publica:null, login:null, registro:null, verificacion:null, olvide:null, olvide_nueva:null,
  c_inicio:'cliente', c_reservar:'cliente', c_mis:'cliente', c_perfil:'cliente',
  a_inicio:'admin', a_calendario:'admin', a_reservas:'admin', a_solicitudes:'admin', a_cancha:'admin', a_prensa:'admin',
  p_inicio:'prensa', p_actividades:'prensa', p_info:'prensa'
};
/* Menú de cada perfil. Cliente NO tiene "Historial"; Administración NO tiene Horarios/Configuración/Usuarios. */
const NAV = {
  cliente:[['c_inicio','Inicio'],['c_reservar','Reservar cancha'],['c_mis','Mis reservas'],['c_perfil','Perfil']],
  admin:[['a_inicio','Inicio'],['a_calendario','Calendario'],['a_reservas','Reservas'],['a_solicitudes','Solicitudes'],['a_cancha','Cancha'],['a_prensa','Prensa']],
  prensa:[['p_inicio','Inicio'],['p_actividades','Actividades'],['p_info','Información']]
};
const permitida = v => (v in VISTAS) && (!VISTAS[v] || (S.sesion && S.sesion.rol === VISTAS[v]));
const homeDe = rol => ({ cliente:'c_inicio', admin:'a_inicio', prensa:'p_inicio' }[rol]);


/* Ir a otra página. Antes se guarda el estado temporal para que la página siguiente lo encuentre. */
function ir(v){
  if (v === 'c_reservar' && (S.vista !== 'c_reservar' || S.paso === 'ok')){ S.paso = 'form'; S.form = {}; }   // formulario nuevo (también tras enviar una solicitud)
  S.menu = false; guardarEstado();
  location.href = urlDe(v);
}
/* Igual que ir(), pero sin dejar la página actual en el historial. Devuelve '' para que render() no dibuje nada. */
function redirigir(v){ guardarEstado(); location.replace(urlDe(v)); return ''; }

/* Usuario en sesión (cliente) */
const usuarioActual = () => S.sesion && S.sesion.rol === 'cliente' ? getUsuarios().find(u => u.id === S.sesion.id) : null;
const nombreSesion = () => {
  if (!S.sesion) return '';
  if (S.sesion.rol === 'admin') return titulo(CONFIG.ADMIN.usuario);
  if (S.sesion.rol === 'prensa') return 'Prensa';
  const u = usuarioActual(); return u ? `${u.nombre} ${u.apellido}` : '';
};
const rolEtiqueta = { cliente:'Cliente', admin:'Administración', prensa:'Prensa' };

/* =====================================================================
   COMPONENTES DE INTERFAZ REUTILIZABLES
   ===================================================================== */
const EMBLEMA = `<svg class="logo" viewBox="0 0 48 48" role="img" aria-label="Escudo provisorio de la Municipalidad de Bella Vista"><path d="M24 3 6 9v14c0 11 8 19 18 22 10-3 18-11 18-22V9z" fill="var(--brand)"/><circle cx="24" cy="24" r="8" fill="none" stroke="var(--brand-ink)" stroke-width="2"/><path d="M24 16v16M16 24h16" stroke="var(--brand-ink)" stroke-width="2"/></svg>`;

/* ★ LOGO: esta es la línea que coloca la imagen. La ruta se toma de CONFIG.LOGO_RUTA. */
/* La ruta del logo se cuenta desde la raíz del sitio; RAIZ la ajusta según la carpeta de cada página */
function rutaLogo(){ return /^(https?:|data:|\/)/.test(CONFIG.LOGO_RUTA) ? CONFIG.LOGO_RUTA : RAIZ + CONFIG.LOGO_RUTA; }
function logoHTML(){
  if (S.logoRoto) return EMBLEMA;
  return `<img class="logo" src="${esc(rutaLogo())}" alt="Logo Municipalidad de Bella Vista" data-logo>`;
}
/* Si la imagen no carga (ruta inexistente), se reemplaza por el escudo provisorio */
document.addEventListener('error', e => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.hasAttribute('data-logo')){ S.logoRoto = true; t.insertAdjacentHTML('afterend', EMBLEMA); t.remove(); }
}, true);

const marcaHTML = () => `<div class="marca">${logoHTML()}<div class="marca-txt"><span class="marca-nombre">${esc(CONFIG.NOMBRE_SUM)}</span><span class="marca-muni">${esc(CONFIG.MUNICIPALIDAD)}</span></div></div>`;
const cabecera = (acc = '') => `<header class="cab"><div class="cab-in">${marcaHTML()}<div class="cab-acc">${acc}</div></div></header>`;
const pie = () => `<footer class="contenedor pie">${esc(CONFIG.NOMBRE_SUM)} - ${esc(CONFIG.MUNICIPALIDAD)}${CONFIG.MODO_DEMO ? '<br>Versión de demostración: los datos se guardan solo en este navegador y los códigos de verificación se muestran en pantalla.' : ''}</footer>`;

/* Chips de estado */
const ETIQ_HORA = { libre:'Libre', reservado:'Reservado', ocupado:'Ocupado', bloqueado:'Bloqueado', fuera:'Fuera de servicio' };
const TONO_HORA = { libre:'t-libre', reservado:'t-reservada', ocupado:'t-ocupada', bloqueado:'t-bloq', fuera:'t-fuera' };
const ETIQ_SOL  = { pendiente:'Pendiente', aprobada:'Aprobada', rechazada:'Rechazada', cancelada:'Cancelada' };
const TONO_SOL  = { pendiente:'t-reservada', aprobada:'t-libre', rechazada:'t-ocupada', cancelada:'t-fuera' };
const chipSol   = e => `<span class="chip ${TONO_SOL[e]}">${ETIQ_SOL[e]}</span>`;
const leyendaHTML = () => `<div class="leyenda" aria-label="Referencias">${['libre','reservado','ocupado','bloqueado','fuera'].map(k => `<span class="chip ${TONO_HORA[k]}">${ETIQ_HORA[k]}</span>`).join('')}</div>`;

/* ---------- Marcador con el ESTADO ACTUAL de la cancha ---------- */
const ETIQ_CANCHA = { libre:'LIBRE', reservada:'RESERVADA', ocupada:'OCUPADA', fuera:'FUERA DE SERVICIO' };
function marcadorInterior(e){
  let h = `<p class="mar-label">Estado actual de la cancha</p>
    <h2 class="mar-estado${e.clave === 'fuera' ? ' largo' : ''}"><span class="lampara" aria-hidden="true"></span><span><span class="sr-only">Estado actual: </span>${ETIQ_CANCHA[e.clave]}</span></h2>`;
  if (e.clave === 'fuera'){
    if (e.motivo) h += `<p class="mar-nota">Motivo: ${esc(e.motivo)}</p>`;
    if (e.hasta) h += `<p class="mar-nota">Hasta el ${fechaCorta(e.hasta)}</p>`;
  } else if (e.ref && (e.clave === 'ocupada' || e.clave === 'reservada')){
    h += `<dl class="mar-horas"><div><dt>Desde</dt><dd>${esc(e.ref.inicio)} hs</dd></div><div><dt>Hasta</dt><dd>${esc(e.ref.fin)} hs</dd></div></dl>`;
    if (e.ref.fecha !== iso(new Date())) h += `<p class="mar-nota">${cap(diaSemana(e.ref.fecha))} ${fechaCorta(e.ref.fecha)}</p>`;
  } else if (e.manual){
    h += `<p class="mar-nota">Estado definido por la Administración.</p>`;
  }
  if (e.proxima){
    h += `<div class="mar-prox"><span class="lbl">Próxima reserva</span><b>${fechaCorta(e.proxima.fecha)}</b><b>${esc(e.proxima.inicio)} - ${esc(e.proxima.fin)} hs</b></div>`;
  }
  return h;
}
/* cta: texto del botón "Reservar cancha" (o false para no mostrarlo) */
function marcadorHTML(cta, variante){
  const e = estadoActual();
  return `<section class="marcador${variante ? ' marcador--' + variante : ''}" aria-label="Estado actual de la cancha">
    <div class="mar-int t-${e.clave}" data-live="estado">${marcadorInterior(e)}</div>
    ${cta ? `<button class="btn btn-cta" data-accion="reservar">${esc(cta)}</button>` : ''}
  </section>`;
}
/* Refresca solo el marcador y la lista del día cada 30 s (sin perder lo que el usuario escribe) */
function actualizarVivo(){
  $$('[data-live="estado"]').forEach(el => { const e = estadoActual(); el.className = 'mar-int t-' + e.clave; el.innerHTML = marcadorInterior(e); });
  const p = $('[data-live="dia"]'); if (p) p.innerHTML = diaPanelInterior(p.dataset.scope);
}
setInterval(actualizarVivo, 30000);

/* ---------- Calendario mensual + horarios del día ----------
   scope: 'publica' | 'cliente' | 'admin' | 'prensa'  (cambia el detalle mostrado) */
function claseDia(f){
  if (fueraVigente(getCancha(), f)) return 'fuera';
  return aprobadas().some(r => r.fecha === f) ? 'con' : '';
}
function diaPanelInterior(scope){
  const f = S.cal.dia;
  let h = `<h3>${cap(diaSemana(f))} ${diaMes(f)}</h3><p class="sub">Horarios del día. ${scope === 'admin' ? 'Toca una reserva para ver su detalle.' : ''}</p><ul class="horas">`;
  for (let x = CONFIG.HORA_APERTURA; x < CONFIG.HORA_CIERRE; x++){
    const st = estadoHora(f, x);
    let der = `<span class="chip ${TONO_HORA[st.e]}">${ETIQ_HORA[st.e]}</span>`;
    if (st.r && scope === 'prensa') der = `<span class="act">${esc(st.r.actividad)}</span>` + der;
    if (st.r && scope === 'admin')  der = `<button class="btn btn-sec btn-chico" data-accion="ver-reserva" data-id="${esc(st.r.id)}">Ver reserva</button>` + der;
    h += `<li class="hora ${TONO_HORA[st.e]}"><span class="rango">${hh(x)} - ${hh(x+1)}</span><span class="der">${der}</span></li>`;
  }
  return h + '</ul>';
}
function calendarioHTML(scope){
  const { y, m } = S.cal, hoy = iso(new Date());
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;      // semana que empieza en lunes
  const n = new Date(y, m + 1, 0).getDate();
  let celdas = '';
  for (let i = 0; i < offset; i++) celdas += '<span class="dia vacio" aria-hidden="true"></span>';
  for (let d = 1; d <= n; d++){
    const f = `${y}-${p2(m+1)}-${p2(d)}`, cl = claseDia(f);
    const desc = cl === 'con' ? ', con reservas' : cl === 'fuera' ? ', fuera de servicio' : '';
    celdas += `<button class="dia ${cl} ${f < hoy ? 'pas' : ''} ${f === hoy ? 'hoy' : ''} ${f === S.cal.dia ? 'sel' : ''}" data-accion="cal-dia" data-fecha="${f}" aria-pressed="${f === S.cal.dia}" aria-label="${d} de ${MESES[m]}${desc}">${d}<i class="pto"></i></button>`;
  }
  return `<div data-cal="${scope}"><div class="cal-wrap">
    <div class="cal" role="group" aria-label="Calendario de ${MESES[m]} de ${y}">
      <div class="cal-cab"><button class="cal-nav" data-accion="cal-mes" data-d="-1" aria-label="Mes anterior">&lsaquo;</button><h3>${MESES[m]} ${y}</h3><button class="cal-nav" data-accion="cal-mes" data-d="1" aria-label="Mes siguiente">&rsaquo;</button></div>
      <div class="cal-sem" aria-hidden="true">${['L','M','M','J','V','S','D'].map(x => `<span>${x}</span>`).join('')}</div>
      <div class="cal-grid">${celdas}</div>
      <p class="ayuda" style="margin-top:12px">Punto naranja: día con reservas. Punto gris: cancha fuera de servicio.</p>
    </div>
    <div class="dia-panel" data-live="dia" data-scope="${scope}">${diaPanelInterior(scope)}</div>
  </div>${leyendaHTML()}</div>`;
}
function refrescarCalendario(enfocarDia){
  const r = $('[data-cal]'); if (!r) return;
  r.outerHTML = calendarioHTML(r.dataset.cal);
  if (enfocarDia){ const b = $('.dia.sel'); if (b) b.focus({ preventScroll:true }); }
}

/* ---------- Marco (menú lateral) de los paneles con sesión ---------- */
function shell(tit, cuerpo, sub){
  const rol = S.sesion.rol;
  const items = NAV[rol].map(([v, t]) => `<button data-accion="ir" data-vista="${v}" ${S.vista === v ? 'aria-current="page"' : ''}>${esc(t)}</button>`).join('');
  return `<div class="app">
    <aside class="lado"><div class="lado-in">
      <div class="lado-cab">${marcaHTML()}<button class="btn btn-sec btn-chico menu-btn" data-accion="menu" aria-expanded="${S.menu}" aria-controls="nav-principal">Menú</button></div>
      <p class="usuario-chip"><b>${esc(nombreSesion())}</b>${rolEtiqueta[rol]}</p>
      <nav class="nav" id="nav-principal" aria-label="Menú principal">${items}<button class="salir" data-accion="salir">Cerrar sesión</button></nav>
    </div></aside>
    <main class="cuerpo" id="main"><h1 class="pag-tit">${esc(tit)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}${cuerpo}</main>
  </div>`;
}
const conMenu = html => html.replace('<aside class="lado">', S.menu ? '<aside class="lado abierto">' : '<aside class="lado">');

/* ---------- Ventanas modales ---------- */
let foco = null;
function abrirModal(titulo_, cuerpo, pieHTML = ''){
  foco = document.activeElement;
  $('#modal-root').innerHTML = `<div class="modal-fondo" data-accion="fondo"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-t">
    <div class="modal-cab"><h2 id="modal-t">${esc(titulo_)}</h2><button class="btn btn-sec btn-chico" data-accion="cerrar-modal" aria-label="Cerrar">Cerrar</button></div>
    <div>${cuerpo}</div>${pieHTML ? `<div class="modal-pie">${pieHTML}</div>` : ''}</div></div>`;
  const b = $('#modal-root [data-accion="cerrar-modal"]'); if (b) b.focus();
}
function cerrarModal(){ $('#modal-root').innerHTML = ''; if (foco && foco.focus) try{ foco.focus(); }catch(e){} }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal-root .modal')) cerrarModal(); });
/* Confirmación (reemplaza a window.confirm) */
function confirmar(titulo_, texto, textoBoton, peligro){
  return new Promise(res => {
    abrirModal(titulo_, `<p>${esc(texto)}</p>`,
      `<button class="btn btn-sec" data-accion="conf-no">Volver</button><button class="btn ${peligro ? 'btn-peligro' : 'btn-primary'}" data-accion="conf-si">${esc(textoBoton)}</button>`);
    const fin = v => { document.removeEventListener('click', h, true); document.removeEventListener('keydown', k); cerrarModal(); res(v); };
    const k = ev => { if (ev.key === 'Escape') fin(false); };
    document.addEventListener('keydown', k);
    const h = e => {
      const a = e.target.closest('[data-accion]'); if (!a) return;
      if (a.dataset.accion === 'conf-si'){ e.stopPropagation(); fin(true); }
      else if (['conf-no','cerrar-modal'].includes(a.dataset.accion) || (a.dataset.accion === 'fondo' && e.target === a)){ e.stopPropagation(); fin(false); }
    };
    document.addEventListener('click', h, true);
  });
}
function aviso(msg, tipo){
  const t = document.createElement('div'); t.className = 'toast' + (tipo === 'error' ? ' error' : ''); t.textContent = msg;
  $('#aviso').appendChild(t); setTimeout(() => t.remove(), 4200);
}

/* =====================================================================
   UTILIDADES DE FORMULARIOS
   ===================================================================== */
const campo = (id, etiqueta, tipo, extra = '', ayuda = '') => `<div class="campo"><label for="${id}">${etiqueta}</label>
  <input id="${id}" name="${id}" type="${tipo}" ${extra} aria-describedby="e-${id}"><p class="ayuda" ${ayuda ? '' : 'hidden'}>${ayuda}</p><p class="err" id="e-${id}" data-err="${id}"></p></div>`;
const valorForm = f => Object.fromEntries([...new FormData(f).entries()].filter(([, v]) => typeof v === 'string'));
/* Muestra los errores junto a cada campo (sin volver a dibujar el formulario, para conservar lo escrito) */
function mostrarErrores(form, errs){
  $$('[data-err]', form).forEach(p => { p.textContent = errs[p.dataset.err] || ''; });
  $$('input,select,textarea', form).forEach(i => { if (errs[i.name]) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); });
  const primero = $$('input,select,textarea', form).find(i => errs[i.name]); if (primero) primero.focus();
  return Object.keys(errs).length === 0;
}
const validarClave = (c, c2, e, k1 = 'clave', k2 = 'clave2') => {
  if (c.length < 8 || !/[A-Za-z]/.test(c) || !/\d/.test(c)) e[k1] = 'Usa al menos 8 caracteres, con letras y números.';
  else if (c !== c2) e[k2] = 'Las contraseñas no coinciden.';
};
const soloDni = s => String(s || '').replace(/[.\s]/g, '');

/* =====================================================================
   RENDERIZADO Y ARRANQUE
   ===================================================================== */
const RENDER = {};        // cada página registra aquí su vista: RENDER.login = vLogin
const ALRENDERIZAR = [];  // funciones que una página puede agregar para ejecutarlas después de dibujar
function render(navegando){
  if (!permitida(S.vista)){ redirigir('publica'); return; }
  const html = RENDER[S.vista]();
  if (html === '') return;                 // la vista ya mandó al usuario a otra página
  $('#app').innerHTML = conMenu(html);
  ALRENDERIZAR.forEach(fn => fn());
  if (navegando){
    window.scrollTo(0, 0);
    const t = $('main h1, main h2'); if (t && S.vista !== 'verificacion'){ t.setAttribute('tabindex', '-1'); t.focus({ preventScroll:true }); }
  }
}
/* Lo llama cada script de página como última línea */
function arrancar(){
  S.vista = document.body.dataset.vista;
  sembrarDemo();
  if (S.sesion && S.sesion.rol === 'cliente' && !usuarioActual()){ S.sesion = null; DB.guardar('sesion', null); }   // sesión de una cuenta que ya no existe
  render(false);
}

/* =====================================================================
   FORMULARIOS (envío) Y ACCIONES (botones con data-accion)
   ---------------------------------------------------------------------
   Cada página agrega lo suyo:  Object.assign(ENVIOS, {...})  y  Object.assign(ACCIONES, {...})
   ===================================================================== */
const ENVIOS = {};
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const fn = ENVIOS[f.dataset.form]; if (fn) fn(f);
});
const ACCIONES = {
  /* Botón "Reservar cancha": sin sesión va al LOGIN; con sesión de cliente va a reservar */
  reservar(){
    if (S.sesion && S.sesion.rol === 'cliente' && usuarioActual()) return ir('c_reservar');
    if (S.sesion){ aviso('Solo los clientes pueden reservar. Cierra sesión para ingresar como cliente.', 'error'); return; }
    S.next = 'reservar'; ir('login');
  },
  ingresar(){ S.next = null; ir('login'); },
  'mi-panel'(){ ir(homeDe(S.sesion.rol)); },
  'volver-publica'(){ ir('publica'); },
  ir(a){ ir(a.dataset.vista); },
  menu(){ S.menu = !S.menu; const l = $('.lado'); if (l) l.classList.toggle('abierto', S.menu); const b = $('.menu-btn'); if (b) b.setAttribute('aria-expanded', S.menu); },
  salir(){ S.sesion = null; DB.guardar('sesion', null); S.paso = 'form'; S.form = {}; ir('publica'); },

  /* Calendario */
  'cal-dia'(a){
    if (S.vista === 'c_reservar' && S.paso === 'form' && a.dataset.fecha < iso(new Date())){ aviso('Elige un día de hoy en adelante.', 'error'); return; }
    S.cal.dia = a.dataset.fecha; const d = deISO(S.cal.dia); S.cal.y = d.getFullYear(); S.cal.m = d.getMonth();
    if (S.vista === 'c_reservar' && S.paso === 'form'){ S.form.fecha = S.cal.dia; render(false); return; }   // vuelve a dibujar la reserva con el nuevo día
    refrescarCalendario(true);
  },
  'cal-mes'(a){
    const d = new Date(S.cal.y, S.cal.m + Number(a.dataset.d), 1); S.cal.y = d.getFullYear(); S.cal.m = d.getMonth();
    const dia = deISO(S.cal.dia); if (dia.getMonth() !== S.cal.m || dia.getFullYear() !== S.cal.y) S.cal.dia = iso(d);
    refrescarCalendario(false);
  },
  'cerrar-modal'(){ cerrarModal(); },
  fondo(a, e){ if (e.target === a) cerrarModal(); }
};
document.addEventListener('click', e => {
  const a = e.target.closest('[data-accion]'); if (!a) return;
  const fn = ACCIONES[a.dataset.accion]; if (fn) fn(a, e);
});
