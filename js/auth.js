'use strict';
/* SUM Municipal - COMÚN DE ACCESO
   Lo comparten login, registro, recuperación y verificación: marco de pantalla y códigos de 4 dígitos. */

/* ---- Marco de las pantallas de acceso ---- */
const authMarco = (ancho, cuerpo) => `${cabecera('<button class="btn btn-sec btn-chico" data-accion="volver-publica">Volver al SUM</button>')}
  <main class="contenedor" id="main"><div class="auth-card ${ancho ? 'ancho' : ''}">${cuerpo}</div></main>${pie()}`;

/* =====================================================================
   CORREO Y CÓDIGOS DE VERIFICACIÓN
   ===================================================================== */
/* ★ PUNTO DE INTEGRACIÓN: aquí se conecta el envío real de correos (servidor propio, EmailJS, etc.).
   Debe devolver una promesa que resuelva true si el correo salió. */
function enviarEmail(destino, asunto, cuerpo){
  if (CONFIG.MODO_DEMO) console.info('[DEMO] Correo a', destino, '|', asunto, '|', cuerpo);
  return Promise.resolve(true);
}
function generarCodigo(){
  try{ return String(1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000)); }
  catch(e){ return String(1000 + Math.floor(Math.random() * 9000)); }
}
/* Crea y "envía" un código de 4 dígitos con vencimiento */
function emitirCodigo(email, tipo){
  const cod = generarCodigo(), cs = DB.leer('codigos', {});
  cs[`${tipo}:${norm(email)}`] = { codigo:cod, expira:Date.now() + CONFIG.CODIGO_MINUTOS*60000 };
  DB.guardar('codigos', cs);
  enviarEmail(email, tipo === 'registro' ? 'Código de verificación de cuenta' : 'Código para recuperar tu contraseña',
    `Tu código de 4 dígitos es ${cod}. Vence en ${CONFIG.CODIGO_MINUTOS} minutos.`);
  S.demoCodigo = CONFIG.MODO_DEMO ? cod : null;
}
function comprobarCodigo(email, tipo, ingresado){
  const k = `${tipo}:${norm(email)}`, cs = DB.leer('codigos', {}), c = cs[k];
  if (!c) return 'invalido';
  if (Date.now() > c.expira) return 'vencido';
  if (c.codigo !== ingresado) return 'incorrecto';
  delete cs[k]; DB.guardar('codigos', cs); return 'ok';
}
