// Utilidades compartidas (sin Firebase): las usan tanto la pagina del publico
// como las de produccion, jurados y pantalla.
import { URL_BASE, EVENTO } from './config.js';
export { URL_BASE, EVENTO };

// ---------- utilidades ----------
export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function num(n, dec = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
export const pct = (x) => (x === null || x === undefined ? '—' : Math.round(x * 100) + '%');
export const esPermiso = (e) => /PERMISSION_DENIED|permission/i.test(String(e && (e.code || e.message || e)));
export const foto = (p, mini = false) => (p && p.id ? `fotos/${mini ? 'min/' : ''}${p.id}.webp` : 'img/logo.webp');
// Agrega el campo id (la clave) a cada participante leido de la base de datos
export function conIds(obj) { const o = {}; for (const [k, v] of Object.entries(obj || {})) o[k] = { ...v, id: k }; return o; }
export const pad3 = (n) => String(n).replace(/\D/g, '').slice(0, 3).padStart(3, '0');
export const CATEGORIAS = ['Pre-infantil', 'Infantil', 'Juvenil', 'Sénior'];

export function ordenarParticipantes(obj) {
  return Object.entries(obj || {}).map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (a.catOrden - b.catOrden) || (a.orden - b.orden) || a.nombre.localeCompare(b.nombre, 'es'));
}

// Aviso flotante breve
export function aviso(texto, tipo = 'ok', ms = 3200) {
  let caja = $('#avisos');
  if (!caja) { caja = document.createElement('div'); caja.id = 'avisos'; document.body.appendChild(caja); }
  const el = document.createElement('div');
  el.className = 'aviso aviso-' + tipo; el.textContent = texto;
  caja.appendChild(el);
  setTimeout(() => el.classList.add('fuera'), ms);
  setTimeout(() => el.remove(), ms + 400);
}

// =====================================================================
//  CALCULO DE RESULTADOS (una sola fuente de verdad para control y pantalla)
//
//  Publico = promedio simple de los votos emitidos (1 voto por boleta registrada)
//  Jurado  = promedio de las notas de jurado recibidas
//  Final   = peso% x Publico + (100 - peso)% x Jurado
//            Si falta una de las dos partes, el final es la parte que existe.
// =====================================================================
// agregado = { votos: cantidad, suma: suma de notas } — sale del cierre o de los votos en vivo
export function agregarVotos(votos) {
  // d = decimas (85 = 8,5); n = formato anterior en enteros
  const lista = Object.values(votos || {}).map((v) => (v && typeof v.d === 'number' ? v.d / 10 : Number(v && v.n))).filter((n) => !Number.isNaN(n));
  return { votos: lista.length, suma: lista.reduce((a, b) => a + b, 0) };
}
export function calcularResultado({ agregado, notas, cierre, config, jurados }) {
  const agg = agregado || (cierre ? { votos: cierre.votos || 0, suma: cierre.suma || 0 } : { votos: 0, suma: 0 });
  const nVotos = agg.votos;
  const promedio = nVotos ? agg.suma / nVotos : null;

  const idsJ = Object.keys(jurados || {}).sort();
  const notasJ = {};
  idsJ.forEach((j) => { const n = notas ? notas[j] : null; notasJ[j] = n && typeof n.d === 'number' ? n.d / 10 : null; });
  const recibidas = Object.values(notasJ).filter((x) => x !== null);
  const promJurado = recibidas.length ? recibidas.reduce((a, b) => a + b, 0) / recibidas.length : null;

  const peso = Math.min(100, Math.max(0, Number(config && config.pesoPublico != null ? config.pesoPublico : 30))) / 100;
  let final = null;
  if (promedio !== null && promJurado !== null) final = peso * promedio + (1 - peso) * promJurado;
  else if (promedio !== null) final = promedio;
  else if (promJurado !== null) final = promJurado;
  return {
    nVotos, promedio, notaPublico: promedio,
    notasJ, promJurado, nJurados: idsJ.length, juradosRecibidos: recibidas.length,
    pesoPublico: Math.round(peso * 100), final: final === null ? null : Math.round(final * 100) / 100,
    completo: recibidas.length === idsJ.length && !!cierre,
  };
}

// Premiacion: 5 puestos por categoria. Pre-infantil premia a sus 7 participantes
// presenciales: 2 en primer lugar, 2 en segundo y 3 en tercero (segun la nota final).
const PUESTOS_PRE = [1, 1, 2, 2, 3, 3, 3];
export function puestoDe(cat, i) {
  if (i === null || i === undefined || i < 0) return null;
  if (cat === 'Pre-infantil') return i < PUESTOS_PRE.length ? PUESTOS_PRE[i] : null;
  return i < 5 ? i + 1 : null;
}
export const premiadosDe = (cat) => (cat === 'Pre-infantil' ? PUESTOS_PRE.length : 5);

// Orden de la clasificacion: nota final; desempata el promedio de jurado y luego el del publico
const v = (x) => (x == null ? -1 : x);
export function compararResultados(a, b) {
  return (v(b.final) - v(a.final)) || (v(b.promJurado) - v(a.promJurado)) || (v(b.promedio) - v(a.promedio));
}

// inicio = true agrega el boton «Inicio» (paginas de produccion y jurados; el publico no lo ve)
export function htmlEncabezado({ inicio = false } = {}) {
  return `<header class="cabecera">
    <img src="img/logo.webp" alt="Brilla & Canta" class="cabecera-logo">
    <div style="flex:1"><div class="cabecera-titulo">${esc(EVENTO.titulo)}</div><div class="cabecera-sub">${esc(EVENTO.subtitulo)}</div></div>
    ${inicio ? '<a class="boton secundario chico" href="index.html" title="Volver al panel inicial">⌂ Inicio</a>' : ''}
    <span id="conexion" class="punto-conexion" title="Conectando…"></span>
  </header>`;
}
