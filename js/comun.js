// Conexion en vivo con Firebase (SDK). La usan SOLO produccion, jurados y pantalla
// (unos pocos equipos). El publico NO usa este archivo: ver rest.js.
import { CONFIG_FIREBASE } from './config.js';
import * as fb from './fb.js';
export * from './util.js';

export { fb };
export const app = fb.initializeApp(CONFIG_FIREBASE);
export const db = fb.getDatabase(app);
export const auth = fb.getAuth(app);
// ref(db, '') lanza error en el SDK real: la raiz se pide sin ruta
export const r = (p) => (p ? fb.ref(db, p) : fb.ref(db));
export const ahora = () => fb.serverTimestamp();

// ---------- sesion anonima (cada celular/navegador = un usuario) ----------
let _sesion = null;
export function sesion() {
  if (!_sesion) {
    _sesion = new Promise((resolve, reject) => {
      let hecho = false;
      fb.onAuthStateChanged(auth, async (u) => {
        if (hecho) return;
        if (u) { hecho = true; resolve(u); return; }
        try { const c = await fb.signInAnonymously(auth); hecho = true; resolve(c.user); }
        catch (e) { reject(e); }
      });
    });
  }
  return _sesion;
}

// Indicador de conexion en vivo
export function vigilarConexion(el) {
  const inicio = Date.now();
  fb.onValue(r('.info/connected'), (s) => {
    const ok = s.val() === true;
    if (!ok && Date.now() - inicio < 4000) { setTimeout(() => { if (!document.body.dataset.conectado) { document.body.classList.add('sin-conexion'); if (el) el.classList.add('desconectado'); } }, 4000); return; }
    document.body.dataset.conectado = ok ? '1' : '';
    if (el) { el.classList.toggle('desconectado', !ok); el.title = ok ? 'Conectado' : 'Sin conexión: reintentando…'; }
    document.body.classList.toggle('sin-conexion', !ok);
  });
}

