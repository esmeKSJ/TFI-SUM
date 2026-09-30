'use strict';
/* SUM Municipal - REGISTRO
   Página: html/registro/registro.html */

/* ---- Registro de cliente ---- */
function vRegistro(){
  return authMarco(true, `<h1>Registrarse</h1>
    <p class="sub">Crea tu cuenta para solicitar reservas. Todos los campos son obligatorios.</p>
    <form data-form="registro" novalidate>
      <div class="fila2">${campo('nombre', 'Nombre', 'text', 'autocomplete="given-name" required')}${campo('apellido', 'Apellido', 'text', 'autocomplete="family-name" required')}</div>
      <div class="fila2">${campo('dni', 'DNI', 'text', 'inputmode="numeric" autocomplete="off" required', 'Solo números, sin puntos.')}${campo('email', 'Email', 'email', 'autocomplete="email" required')}</div>
      <div class="fila2">${campo('clave', 'Contraseña', 'password', 'autocomplete="new-password" required', 'Mínimo 8 caracteres, con letras y números.')}${campo('clave2', 'Confirmación de contraseña', 'password', 'autocomplete="new-password" required')}</div>
      ${campo('cuil', 'CUIL', 'text', 'inputmode="numeric" pattern="[0-9]{11}" maxlength="11" minlength="11" autocomplete="off" required', 'Exactamente 11 números, sin guiones ni espacios.')}
      <p class="err" data-err="general" role="alert"></p>
      <div class="acciones-form"><button type="submit" class="btn btn-primary">Crear cuenta</button>
        <button type="button" class="btn btn-sec" data-accion="ir" data-vista="login">Ya tengo cuenta</button></div>
    </form>`);
}

Object.assign(ENVIOS, {
  /* ---- Registro ---- */
  async registro(form){
    const d = valorForm(form), us = getUsuarios(), e = {};
    const nombreOk = /^[\p{L}][\p{L}'’\- ]{1,49}$/u;
    if (!nombreOk.test(d.nombre.trim())) e.nombre = 'Ingresa tu nombre (solo letras, mínimo 2).';
    if (!nombreOk.test(d.apellido.trim())) e.apellido = 'Ingresa tu apellido (solo letras, mínimo 2).';
    const dni = soloDni(d.dni);
    if (!/^\d{7,8}$/.test(dni)) e.dni = 'El DNI debe tener 7 u 8 números.';
    else if (us.some(u => u.dni === dni)) e.dni = 'Ya existe una cuenta con ese DNI.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = 'Ingresa un correo válido, por ejemplo nombre@correo.com.';
    else if (us.some(u => norm(u.email) === norm(d.email))) e.email = 'Ya existe una cuenta con ese correo.';
    validarClave(d.clave, d.clave2, e);
    const cuil = String(d.cuil || '').trim();
    if (!/^\d{11}$/.test(cuil)) e.cuil = 'El CUIL debe tener exactamente 11 números (sin guiones ni espacios).';
    else if (us.some(u => u.cuil === cuil)) e.cuil = 'Ya existe una cuenta con ese CUIL.';
    if (!mostrarErrores(form, e)) return;
    const u = { id:'u' + Date.now().toString(36), nombre:titulo(d.nombre), apellido:titulo(d.apellido), dni, cuil, email:d.email.trim(), passHash:await sha(d.clave), verificado:false };
    us.push(u);
    if (!setUsuarios(us)) aviso('El navegador no permite guardar datos permanentes; la cuenta durará solo esta sesión.', 'error');
    S.verif = { email:u.email, tipo:'registro' };
    emitirCodigo(u.email, 'registro'); ir('verificacion');
  },
});

/* CUIL: solo dígitos, máximo 11 */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches && t.matches('input[name=cuil]')){ const l = t.value.replace(/\D/g, '').slice(0, 11); if (l !== t.value) t.value = l; }
});

RENDER.registro = vRegistro;
arrancar();
