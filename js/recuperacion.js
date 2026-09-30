'use strict';
/* SUM Municipal - RECUPERACIÓN DE CONTRASEÑA
   Páginas: html/recuperacion/recuperar-clave.html y html/recuperacion/nueva-clave.html */

/* ---- Recuperación de contraseña ---- */
function vOlvide(){
  return authMarco(false, `<h1>¿Olvidaste tu contraseña?</h1>
    <p class="sub">Ingresa el correo con el que te registraste y te enviaremos un código para crear una contraseña nueva.</p>
    <form data-form="olvide" novalidate>${campo('email', 'Email', 'email', 'autocomplete="email" required')}
      <div class="acciones-form"><button type="submit" class="btn btn-primary">Enviar código</button>
        <button type="button" class="btn btn-sec" data-accion="ir" data-vista="login">Volver al inicio de sesión</button></div></form>`);
}
function vOlvideNueva(){
  if (!S.verif || !S.verif.validado) return redirigir('login');
  return authMarco(false, `<h1>Nueva contraseña</h1><p class="sub">Elige una contraseña nueva para tu cuenta.</p>
    <form data-form="nueva" novalidate>
      ${campo('clave', 'Nueva contraseña', 'password', 'autocomplete="new-password" required', 'Mínimo 8 caracteres, con letras y números.')}
      ${campo('clave2', 'Confirmar contraseña', 'password', 'autocomplete="new-password" required')}
      <div class="acciones-form"><button type="submit" class="btn btn-primary">Guardar contraseña</button></div></form>`);
}

Object.assign(ENVIOS, {
  /* ---- Recuperación: pedir código ---- */
  olvide(form){
    const d = valorForm(form), e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = 'Ingresa un correo válido.';
    if (!mostrarErrores(form, e)) return;
    S.verif = { email:d.email.trim(), tipo:'recuperar', validado:false };
    S.demoCodigo = null;
    if (getUsuarios().some(u => norm(u.email) === norm(d.email))) emitirCodigo(d.email.trim(), 'recuperar');
    ir('verificacion');   // mismo resultado exista o no el correo, para no revelar qué correos están registrados
  },
  /* ---- Recuperación: nueva contraseña ---- */
  async nueva(form){
    const d = valorForm(form), e = {}; validarClave(d.clave, d.clave2, e);
    if (!mostrarErrores(form, e)) return;
    const h = await sha(d.clave), email = S.verif.email;
    setUsuarios(getUsuarios().map(u => norm(u.email) === norm(email) ? { ...u, passHash:h } : u));
    S.verif = null; aviso('Contraseña actualizada. Ya puedes iniciar sesión.'); ir('login');
  },
});

RENDER.olvide = vOlvide;
RENDER.olvide_nueva = vOlvideNueva;
arrancar();
