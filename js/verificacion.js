'use strict';
/* SUM Municipal - VERIFICACIÓN POR CÓDIGO
   Página: html/verificacion/verificacion.html (sirve para el registro y para la recuperación de contraseña) */

/* ---- Verificación por código de 4 dígitos (registro y recuperación) ---- */
function vVerificacion(){
  const v = S.verif; if (!v) return redirigir('login');   // sin un registro o recuperación en curso, no hay nada que verificar
  const reg = v.tipo === 'registro';
  return authMarco(false, `<h1>${reg ? 'Verificación de cuenta' : 'Recuperar contraseña'}</h1>
    <p class="sub">Hemos enviado un código de 4 dígitos a tu correo electrónico (<strong>${esc(v.email)}</strong>). Vence en ${CONFIG.CODIGO_MINUTOS} minutos.</p>
    ${v.aviso ? `<p class="aviso-caja">${esc(v.aviso)}</p>` : ''}
    ${S.demoCodigo ? `<p class="demo"><strong>Modo demostración:</strong> esta versión no tiene servidor de correo conectado. Tu código de prueba es <strong>${esc(S.demoCodigo)}</strong>.</p>` : ''}
    <form data-form="verif" novalidate>
      <div class="otp" role="group" aria-label="Código de 4 dígitos">${[0,1,2,3].map(i => `<input class="otp-d" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="${i === 0 ? 'one-time-code' : 'off'}" aria-label="Dígito ${i+1}">`).join('')}</div>
      <p class="err" data-err="general" role="alert" style="text-align:center"></p>
      <div class="acciones-form" style="justify-content:center"><button type="submit" class="btn btn-primary">Verificar</button>
        <button type="button" class="btn btn-sec" data-accion="reenviar">Reenviar código</button></div>
    </form>`);
}

Object.assign(ENVIOS, {
  /* ---- Verificar código (registro o recuperación) ---- */
  verif(form){
    const cod = $$('.otp-d', form).map(i => i.value).join(''), v = S.verif;
    if (!/^\d{4}$/.test(cod)) return mostrarErrores(form, { general:'Ingresa los 4 dígitos del código.' });
    const r = comprobarCodigo(v.email, v.tipo, cod);
    if (r !== 'ok'){
      $$('.otp-d', form).forEach(i => i.value = ''); $('.otp-d', form).focus();
      return mostrarErrores(form, { general: r === 'vencido' ? 'El código venció. Usa "Reenviar código" para pedir uno nuevo.' : r === 'incorrecto' ? 'El código es incorrecto. Vuelve a intentarlo.' : 'No hay un código vigente. Usa "Reenviar código".' });
    }
    S.demoCodigo = null;
    if (v.tipo === 'registro'){
      setUsuarios(getUsuarios().map(u => norm(u.email) === norm(v.email) ? { ...u, verificado:true } : u));
      S.verif = null;
      $('.auth-card').innerHTML = `<div class="exito" role="status"><div class="icono" aria-hidden="true">&#10003;</div><h1>Cuenta verificada</h1><p>Tu cuenta ya está lista. Te llevamos al inicio de sesión.</p></div>`;
      setTimeout(() => { if (S.vista === 'verificacion') ir('login'); }, 1800);
    } else { v.validado = true; ir('olvide_nueva'); }
  },
});

/* Casillas del código de 4 dígitos: avanzar, retroceder y pegar */
document.addEventListener('input', e => {
  const t = e.target; if (!t.classList || !t.classList.contains('otp-d')) return;
  t.value = t.value.replace(/\D/g, '').slice(-1);
  const c = $$('.otp-d'), i = c.indexOf(t); if (t.value && c[i+1]) c[i+1].focus();
});
document.addEventListener('keydown', e => {
  const t = e.target; if (!t.classList || !t.classList.contains('otp-d')) return;
  const c = $$('.otp-d'), i = c.indexOf(t);
  if (e.key === 'Backspace' && !t.value && c[i-1]){ c[i-1].focus(); c[i-1].value = ''; }
  if (e.key === 'ArrowLeft' && c[i-1]) c[i-1].focus();
  if (e.key === 'ArrowRight' && c[i+1]) c[i+1].focus();
});
document.addEventListener('paste', e => {
  const t = e.target; if (!t.classList || !t.classList.contains('otp-d')) return;
  const txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4); if (!txt) return;
  e.preventDefault(); $$('.otp-d').forEach((el, i) => el.value = txt[i] || ''); const c = $$('.otp-d'); c[Math.min(txt.length, 3)].focus();
});

Object.assign(ACCIONES, {
  reenviar(){
    const v = S.verif; if (!v) return;
    if (v.tipo === 'registro' || getUsuarios().some(u => norm(u.email) === norm(v.email))) emitirCodigo(v.email, v.tipo);
    aviso('Enviamos un código nuevo a tu correo.');
    if (S.vista === 'verificacion') render(false);
  },
});

ALRENDERIZAR.push(() => { const o = $('.otp-d'); if (o) o.focus(); });   // el cursor queda en la primera casilla
RENDER.verificacion = vVerificacion;
arrancar();
