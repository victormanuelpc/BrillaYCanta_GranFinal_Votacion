// Texto y PDF de la cuenta de cobro de los premios (lo usan la pagina del ganador y el panel de administracion).
export const CORPORACION = 'CORPORACIÓN ARTÍSTICA Y CULTURAL BRILLA & CANTA';
export const NIT = '901.978.603-7';
export const CORREO = 'corpobrillacanta@gmail.com';
export const EVENTO_TXT = 'II FESTIVAL DE LA CANCIÓN BRILLA & CANTA 2026, GRAN FINAL CELEBRADA EL 20 DE NOVIEMBRE DE 2026 EN EL AUDITORIO DE LA ASOCIACIÓN DE INSTITUTORES DE NORTE DE SANTANDER (ASINORT), SAN JOSÉ DE CÚCUTA';
const CAT = { 'Pre-infantil': 'PRE-INFANTIL', Infantil: 'INFANTIL', Juvenil: 'JUVENIL', 'Sénior': 'SÉNIOR' };
const ORD = { 1: 'PRIMER', 2: 'SEGUNDO', 3: 'TERCER', 4: 'CUARTO', 5: 'QUINTO' };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const pesos = (n) => '$ ' + Number(n).toLocaleString('es-CO');
export const fechaLarga = (d = new Date()) => `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
export const numeroCuenta = (premio) => `GF26-${premio.id}`;

// Números en letras (español de Colombia), hasta 999.999.999
const U = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
function menorMil(n) {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100), r = n % 100;
  let t = c ? C[c] : '';
  if (r) t += (t ? ' ' : '') + (r < 30 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ' y ' + U[r % 10] : ''));
  return t;
}
export function enLetras(n) {
  n = Math.floor(Number(n));
  if (n === 0) return 'cero';
  const mill = Math.floor(n / 1e6), miles = Math.floor((n % 1e6) / 1000), resto = n % 1000;
  const p = [];
  const apocope = (t) => t.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
  if (mill) p.push(mill === 1 ? 'un millón' : apocope(menorMil(mill)) + ' millones');
  if (miles) p.push(miles === 1 ? 'mil' : apocope(menorMil(miles)) + ' mil');
  if (resto) p.push(menorMil(resto));
  return p.join(' ');
}
export function valorEnLetras(n) {
  const t = enLetras(n);
  const pesosTxt = /(millón|millones)$/.test(t) ? t + ' de pesos' : t + ' pesos';
  return pesosTxt.charAt(0).toUpperCase() + pesosTxt.slice(1) + ' M/Cte.';
}

export function concepto(premio, d) {
  const base = `PREMIO AL ${ORD[premio.puesto]} LUGAR EN LA CATEGORÍA ${CAT[premio.cat]} DEL ${EVENTO_TXT}`;
  if (d.parentesco === 'participante') return base + '.';
  return `${base}, OBTENIDO POR ${premio.nombre.toUpperCase()}, DE QUIEN SOY ${String(d.parentesco || '').toUpperCase()}.`;
}
export const identificacion = (d) => `${d.tipoDoc || 'C.C.'} N.º ${d.documento || ''}`;
export const direccion = (d) => [d.direccion, d.municipio].filter(Boolean).join(', ');
export const notaPago = (d) => `Favor consignar a la cuenta ${String(d.tipoCuenta || 'Ahorros') === 'Depósito de bajo monto' ? 'de depósito de bajo monto' : 'de ' + String(d.tipoCuenta || 'Ahorros').toLowerCase()} N.º ${d.cuenta || ''} de ${d.banco || ''}, a nombre de ${d.nombre || ''}, de la cual se adjunta certificación bancaria.${d.llave && !d.sinLlave ? ` Llave Bre-B (${String(d.tipoLlave || '').replace(/ \(.*\)/, '').toLowerCase()}): ${d.llave}.` : ''}`;

// Genera el PDF con jsPDF (window.jspdf). firma = dataURL PNG o null
export function crearPDF(premio, d, firma, fecha = new Date()) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const X = 72, W = 612 - 144, VX = 200, VW = 612 - 72 - VX;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  let y = 90;
  doc.text(`San José de Cúcuta, ${fechaLarga(fecha)}`, X, y);
  y += 45; doc.setFontSize(12); doc.text(`Cuenta de Cobro N.º ${numeroCuenta(premio)}`, 306, y, { align: 'center' });
  y += 40; doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(CORPORACION, 306, y, { align: 'center' }); y += 15; doc.text(`NIT: ${NIT}`, 306, y, { align: 'center' });
  y += 45; doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.text('DEBE A:', 306, y, { align: 'center' });
  y += 45; doc.setFontSize(11);
  const fila = (etq, valor, gap = 26) => {
    doc.setFont('helvetica', 'bold'); doc.text(etq, X, y);
    doc.setFont('helvetica', 'normal'); const l = doc.splitTextToSize(valor, VW); doc.text(l, VX, y);
    y += Math.max(gap, l.length * 14 + 12);
  };
  fila('NOMBRE:', d.nombre || '');
  fila('IDENTIFICACIÓN:', identificacion(d));
  fila('DIRECCIÓN:', direccion(d));
  fila('CONCEPTO:', concepto(premio, d));
  fila('LA SUMA DE:', `${pesos(premio.valor)} (${valorEnLetras(premio.valor)})`, 34);
  const nota = doc.splitTextToSize(notaPago(d), W); doc.text(nota, X, y); y += nota.length * 14 + 18;
  doc.text('Cordialmente,', X, y);
  y += 70;
  if (firma) { try { doc.addImage(firma, 'PNG', X, y - 62, 170, 68); } catch (e) {} }
  doc.setDrawColor(60); doc.line(X, y, X + 200, y);
  y += 15; doc.setFont('helvetica', 'bold'); doc.text(d.nombre || '', X, y);
  doc.setFont('helvetica', 'normal'); y += 15; doc.text(identificacion(d), X, y);
  y += 15; doc.text(`TELÉFONO CELULAR: ${d.celular || ''}`, X, y);
  if (d.correo) { y += 15; doc.text(`CORREO: ${d.correo}`, X, y); }
  if (firma) { doc.setFontSize(8); doc.setTextColor(110); doc.text(`Firmado electrónicamente en la plataforma del festival el ${fechaLarga(fecha)} a las ${fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} (Ley 527 de 1999).`, X, 740); }
  return doc;
}
