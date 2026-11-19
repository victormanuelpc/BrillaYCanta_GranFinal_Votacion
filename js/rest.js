// Acceso a Firebase por REST para la pagina del PUBLICO.
//
// Por que REST: el plan gratuito (Spark) admite solo 100 conexiones abiertas a la
// vez. Las peticiones REST son preguntas cortas que no dejan una conexion abierta,
// asi que 400+ celulares pueden usar el sistema sin ocupar esos cupos.
// El publico tampoco crea cuentas (Firebase limita a 100 cuentas nuevas por hora
// desde una misma red): cada boleta se protege con una clave secreta aleatoria que
// solo conoce el celular que la registro.
import { CONFIG_FIREBASE } from './config.js';

const BASE = String(CONFIG_FIREBASE.databaseURL || '').replace(/\/+$/, '');
export const TS = { '.sv': 'timestamp' };

export class ErrorRest extends Error {
  constructor(msg, { permiso = false, red = false, estado = 0 } = {}) { super(msg); this.permiso = permiso; this.red = red; this.estado = estado; }
}

async function pedir(metodo, ruta, cuerpo, { espera = 12000 } = {}) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), espera) : null;
  let res;
  try {
    res = await fetch(`${BASE}/${ruta}.json${metodo === 'GET' ? '' : '?print=silent'}`, {
      method: metodo,
      cache: 'no-store',
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: ctl ? ctl.signal : undefined,
    });
  } catch (e) {
    throw new ErrorRest('Sin conexión', { red: true });
  } finally { if (t) clearTimeout(t); }
  if (res.status === 401 || res.status === 403) throw new ErrorRest('Permiso denegado', { permiso: true, estado: res.status });
  if (!res.ok) throw new ErrorRest('Error del servidor ' + res.status, { red: res.status >= 500, estado: res.status });
  try { const txt = await res.text(); return txt ? JSON.parse(txt) : null; }
  catch (e) { throw new ErrorRest('Sin conexión', { red: true }); }
}

export const leer = (ruta) => pedir('GET', ruta);
export const guardar = (ruta, valor) => pedir('PUT', ruta, valor);

// Reintenta solo los errores de red (no los de permiso): las reglas permiten
// repetir exactamente la misma escritura, asi que reintentar es seguro.
export async function conReintentos(fn, { intentos = 4, alReintentar } = {}) {
  let ultimo;
  for (let i = 0; i < intentos; i++) {
    try { return await fn(); }
    catch (e) {
      ultimo = e;
      if (!e.red) throw e;
      if (alReintentar) alReintentar(i + 1);
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw ultimo;
}

// Claves aleatorias (no se pueden adivinar)
export function aleatorio(n = 24) {
  const a = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const buf = new Uint32Array(n);
  (window.crypto || window.msCrypto).getRandomValues(buf);
  return Array.from(buf, (x) => a[x % a.length]).join('');
}

// Almacenamiento local tolerante (modo privado de algunos navegadores lo bloquea)
const memoria = {};
export const local = {
  get(k, def) { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return k in memoria ? memoria[k] : def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { memoria[k] = v; } },
  disponible() { try { localStorage.setItem('_p', '1'); localStorage.removeItem('_p'); return true; } catch (e) { return false; } },
};
