'use strict';

// Registro de ventas. Se guarda solo en esta PC (ventas.json), aparte de la configuración.
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const PAYMENTS = ['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta', 'Link de pago', 'Otro'];
const CARRIERS = ['Shalom', 'Olva', 'Recojo en tienda', 'Otro'];
const SHIP_STATUS = ['Por enviar', 'Enviado', 'En agencia', 'Entregado'];

let file;
let sales = [];

function load() {
  file = path.join(app.getPath('userData'), 'ventas.json');
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    sales = Array.isArray(raw) ? raw : [];
  } catch {
    sales = [];
  }
}

function write() {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(sales, null, 2));
  fs.renameSync(tmp, file);
}

function list() {
  return [...sales].sort((a, b) => b.date.localeCompare(a.date));
}

const text = (value, max) => String(value ?? '').trim().slice(0, max);

function sanitize(input) {
  const date = new Date(input.date);
  const sale = {
    id: typeof input.id === 'string' && /^[a-z0-9]{6,24}$/.test(input.id) ? input.id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
    account: text(input.account, 40),
    customer: text(input.customer, 80),
    dni: text(input.dni, 20).replace(/\D/g, ''),
    phone: text(input.phone, 20).replace(/\D/g, ''),
    product: text(input.product, 120),
    quantity: Math.max(1, Math.floor(Number(input.quantity) || 1)),
    amount: Math.round(Math.max(0, Number(String(input.amount ?? '').replace(',', '.')) || 0) * 100) / 100,
    payment: PAYMENTS.includes(input.payment) ? input.payment : 'Otro',
    notes: text(input.notes, 500),
    // Envío (vacío si la venta no se envía)
    carrier: CARRIERS.includes(input.carrier) ? input.carrier : '',
    orderNumber: text(input.orderNumber, 40),
    destination: text(input.destination, 160),
    shipStatus: SHIP_STATUS.includes(input.shipStatus) ? input.shipStatus : 'Por enviar',
    shippingCost: Math.round(Math.max(0, Number(String(input.shippingCost ?? '').replace(',', '.')) || 0) * 100) / 100,
    receipt: typeof input.receipt === 'string' && /^[a-z0-9]{6,32}\.jpg$/.test(input.receipt) ? input.receipt : '',
  };
  if (!sale.carrier) Object.assign(sale, { orderNumber: '', destination: '', shipStatus: '', shippingCost: 0, receipt: '' });
  if (!sale.customer && !sale.dni && !sale.phone) {
    return { ok: false, error: 'Escribe al menos el nombre, DNI o celular del cliente.' };
  }
  if (sale.dni && (sale.dni.length < 8 || sale.dni.length > 12)) {
    return { ok: false, error: 'El DNI debe tener 8 dígitos (o hasta 12 si es carné de extranjería).' };
  }
  if (sale.phone && (sale.phone.length < 9 || sale.phone.length > 15)) {
    return { ok: false, error: 'El celular no parece válido.' };
  }
  if (!sale.product) return { ok: false, error: 'Escribe el producto o servicio vendido.' };
  return { ok: true, sale };
}

function save(input) {
  const result = sanitize(input || {});
  if (!result.ok) return result;
  const i = sales.findIndex((s) => s.id === result.sale.id);
  if (i >= 0) sales[i] = result.sale;
  else sales.push(result.sale);
  write();
  return result;
}

function remove(id) {
  sales = sales.filter((s) => s.id !== id);
  write();
}

function get(id) {
  return sales.find((s) => s.id === id) || null;
}

// Envíos que todavía no llegan al cliente, del más antiguo al más reciente.
function pendingShipments() {
  return sales
    .filter((s) => s.carrier && s.shipStatus !== 'Entregado')
    .sort((a, b) => a.date.localeCompare(b.date));
}

function updateShipment(id, changes) {
  const sale = get(id);
  if (!sale || !sale.carrier) return { ok: false, error: 'Venta no encontrada.' };
  if (changes.shipStatus !== undefined) {
    if (!SHIP_STATUS.includes(changes.shipStatus)) return { ok: false, error: 'Estado no válido.' };
    sale.shipStatus = changes.shipStatus;
  }
  if (changes.orderNumber !== undefined) sale.orderNumber = text(changes.orderNumber, 40);
  if (changes.receipt !== undefined) sale.receipt = /^[a-z0-9]{6,32}\.jpg$/.test(changes.receipt) ? changes.receipt : '';
  write();
  return { ok: true, sale };
}

function usedReceipts() {
  return sales.map((s) => s.receipt).filter(Boolean);
}

// Saca datos del texto que el usuario seleccionó en el chat (no lee nada por su cuenta).
function parseSelection(raw) {
  const t = String(raw || '').slice(0, 3000);
  const found = {};

  const phoneRe = /(?<!\d)(?:\+?51[\s.-]?)?(9\d{2})[\s.-]?(\d{3})[\s.-]?(\d{3})(?!\d)/g;
  const phone = phoneRe.exec(t);
  if (phone) found.phone = phone[1] + phone[2] + phone[3];
  const rest = t.replace(phoneRe, ' ');

  const dni = rest.match(/\b(?:dni|d\.n\.i\.?|documento)\D{0,6}(\d{8})(?!\d)/i) || rest.match(/(?<!\d)(\d{8})(?!\d)/);
  if (dni) found.dni = dni[1];

  const labeled = t.match(/(?:nombres?(?: y apellidos)?(?: completos?)?|cliente)\s*[:-]\s*([^\n\r,;]{3,80})/i);
  if (labeled) {
    found.customer = labeled[1].trim();
  } else {
    // Una línea que solo tiene nombres (2 a 5 palabras), p. ej. "Juan Pérez Quispe".
    // Cada palabra empieza con mayúscula y la línea no habla de envíos.
    const word = '[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+';
    const nameLine = new RegExp(`^${word}(?: ${word}){1,4}$`);
    const line = t.split(/\r?\n/).map((l) => l.trim())
      .find((l) => nameLine.test(l) && !/agencia|shalom|olva|direcci|destino|env[ií]o/i.test(l));
    if (line) found.customer = line;
  }

  const amount = t.match(/s\/\.?\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (amount) found.amount = Number(amount[1].replace(',', '.'));

  const destination = t.match(/(?:direcci[oó]n|agencia|destino|env[ií]o a)\s*(?:de\s+)?(?:shalom|olva)?\s*[:-]?\s*([^\n\r;]{3,160})/i);
  if (destination) found.destination = destination[1].trim();
  if (/shalom/i.test(t)) found.carrier = 'Shalom';
  else if (/olva/i.test(t)) found.carrier = 'Olva';
  return found;
}

const COLUMNS = [
  ['Fecha', 'date'], ['Cuenta', 'account'], ['Cliente', 'customer'], ['DNI', 'dni'],
  ['Celular', 'phone'], ['Producto', 'product'], ['Cantidad', 'quantity'],
  ['Monto (S/)', 'amount'], ['Pago', 'payment'], ['Envío', 'carrier'], ['N° de orden', 'orderNumber'],
  ['Destino', 'destination'], ['Estado del envío', 'shipStatus'], ['Costo de envío (S/)', 'shippingCost'],
  ['Notas', 'notes'],
];

function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // evita que Excel lo trate como fórmula
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// CSV que Excel abre directo. DNI y celular van como texto para no perder ceros a la izquierda.
function toCsv(rows = list()) {
  const lines = [COLUMNS.map(([label]) => label).join(',')];
  for (const sale of rows) {
    lines.push(COLUMNS.map(([, key]) => {
      if (key === 'date') return formatDate(sale.date);
      if ((key === 'dni' || key === 'phone') && sale[key]) return `="${sale[key]}"`;
      if (key === 'amount') return sale.amount.toFixed(2);
      if (key === 'shippingCost') return sale.carrier ? (sale.shippingCost || 0).toFixed(2) : '';
      return csvCell(sale[key]);
    }).join(','));
  }
  return `﻿${lines.join('\r\n')}\r\n`;
}

module.exports = {
  PAYMENTS, CARRIERS, SHIP_STATUS,
  load, list, get, save, remove, pendingShipments, updateShipment, usedReceipts, parseSelection, toCsv,
};
