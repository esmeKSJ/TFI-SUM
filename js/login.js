'use strict';
/* SUM Municipal - LOGIN
   Página: html/login/login.html */

/* Entrar a la aplicación con un perfil */
function entrar(sesion){
  S.sesion = sesion; DB.guardar('sesion', sesion);
  const destino = sesion.rol === 'cliente' && S.next === 'reservar' ? 'c_reservar' : homeDe(sesion.rol);
  S.next = null; ir(destino);
}

/* ---- Login ---- */
function vLogin(){
  return authMarco(false, `<h1>Iniciar sesión</h1>
    ${S.next === 'reservar' ? '<p class="aviso-caja">Para reservar la cancha primero necesitas iniciar sesión o registrarte.</p>' : ''}
    <p class="sub">¿Ya tienes cuenta? Ingresa tus datos. Si todavía no, usa <strong>Registrarse</strong>.</p>
    <form data-form="login" novalidate>
      ${campo('usuario', 'Usuario o nombre', 'text', 'autocomplete="username" required')}
      ${campo('apellido', 'Apellido', 'text', 'autocomplete="family-name"', 'Solo si ingresaste tu nombre. Con usuario, correo o DNI no hace falta.')}
      ${campo('clave', 'Contraseña', 'password', 'autocomplete="current-password" required')}
      <p class="err" data-err="general" role="alert"></p>
      <div class="acciones-form"><button type="submit" class="btn btn-primary">Iniciar sesión</button>
        <button type="button" class="btn btn-sec" data-accion="ir" data-vista="registro">Registrarse</button></div>
      <p style="margin:16px 0 0"><button type="button" class="btn-link" data-accion="ir" data-vista="olvide">¿Olvidaste tu contraseña?</button></p>
    </form>`);
}

Object.assign(ENVIOS, {
  /* ---- Iniciar sesión ---- */
  async login(form){
    const d = valorForm(form), usuario = d.usuario.trim(), apellido = d.apellido.trim(), clave = d.clave;
    const e = {};
    if (!usuario) e.usuario = 'Ingresa tu usuario o nombre.';
    if (!clave) e.clave = 'Ingresa tu contraseña.';
    if (!mostrarErrores(form, e)) return;
    const mal = () => mostrarErrores(form, { general:'Los datos ingresados no son correctos. Revisa usuario, apellido y contraseña.' });
    // 1) Administración (acepta "rosa melano" en Usuario, o "rosa" + "melano" en Usuario y Apellido)
    if (norm(usuario + ' ' + apellido) === norm(CONFIG.ADMIN.usuario)){
      return clave === CONFIG.ADMIN.clave ? entrar({ rol:'admin' }) : mal();
    }
    // 2) Prensa
    if (norm(usuario) === norm(prensaUsuario()) && !apellido){
      return (await prensaCoincide(usuario, clave)) ? entrar({ rol:'prensa' }) : mal();
    }
    // 3) Cliente: por correo, DNI, o nombre + apellido
    const h = await sha(clave), nu = norm(usuario), na = norm(apellido);
    const u = getUsuarios().filter(x => norm(x.email) === nu || x.dni === soloDni(usuario) || (na && norm(x.nombre) === nu && norm(x.apellido) === na)).find(x => x.passHash === h);
    if (!u) return mal();
    if (!u.verificado){
      S.verif = { email:u.email, tipo:'registro', aviso:'Tu cuenta todavía no está verificada. Ingresa el código que te enviamos.' };
      emitirCodigo(u.email, 'registro'); return ir('verificacion');
    }
    entrar({ rol:'cliente', id:u.id });
  },
});

RENDER.login = vLogin;
arrancar();
