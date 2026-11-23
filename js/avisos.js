const URL_FUNCION = 'https://lekqmspkizhxsceyswzu.supabase.co/functions/v1/avisar';
const CLAVE_API = 'sb_publishable_voSDxyUttxgPjrF0l0MG7w_7XCPV2Dr';
const CLAVE_LOCAL = 'hogar-avisos';

async function llamar(cuerpo) {
  const r = await fetch(URL_FUNCION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: CLAVE_API, Authorization: `Bearer ${CLAVE_API}` },
    body: JSON.stringify(cuerpo)
  });
  if (!r.ok) throw new Error(`avisos ${r.status}`);
  return r.json();
}

function base64ABytes(b64) {
  const relleno = '='.repeat((4 - (b64.length % 4)) % 4);
  const s = atob((b64 + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, c => c.charCodeAt(0));
}

export function soportado() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function instalada() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export function activos() {
  try {
    return localStorage.getItem(CLAVE_LOCAL) === 'si' && soportado() && Notification.permission === 'granted';
  } catch (e) {
    return false;
  }
}

export async function activar(hogar, yo) {
  if (!soportado()) throw new Error('no-soportado');
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') throw new Error('denegado');
  const reg = await navigator.serviceWorker.ready;
  const { clave } = await llamar({ accion: 'clave' });
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ABytes(clave) });
  await llamar({ accion: 'suscribir', hogar, yo, sub: sub.toJSON() });
  localStorage.setItem(CLAVE_LOCAL, 'si');
  localStorage.setItem(`${CLAVE_LOCAL}-dia`, new Date().toDateString());
  return true;
}

export async function desactivar() {
  localStorage.removeItem(CLAVE_LOCAL);
  if (!soportado()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    try {
      await llamar({ accion: 'quitar', hogar: 'XXXXXX', yo: 0, endpoint: sub.endpoint });
    } catch (e) {}
    await sub.unsubscribe();
  }
}

export async function renovar(hogar, yo) {
  if (!activos() || !hogar) return;
  const hoy = new Date().toDateString();
  if (localStorage.getItem(`${CLAVE_LOCAL}-dia`) === hoy) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return activar(hogar, yo);
    await llamar({ accion: 'suscribir', hogar, yo, sub: sub.toJSON() });
    localStorage.setItem(`${CLAVE_LOCAL}-dia`, hoy);
  } catch (e) {}
}

export function enviar(hogar, yo, tipo, titulo, texto) {
  if (!hogar) return;
  llamar({ accion: 'enviar', hogar, yo, tipo, titulo, texto }).catch(() => {});
}
