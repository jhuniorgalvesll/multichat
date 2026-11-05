'use strict';

const crypto = require('crypto');

// Nunca se guarda la contraseña ni la respuesta, solo un hash con sal (scrypt).
function hashSecret(secret, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(String(secret), salt, 64).toString('hex') };
}

function verifySecret(secret, stored) {
  if (!stored) return false;
  const actual = crypto.scryptSync(String(secret), stored.salt, 64);
  const expected = Buffer.from(stored.hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// "  Lima " y "lima" cuentan como la misma respuesta; también se ignoran las tildes.
function normalizeAnswer(answer) {
  return String(answer || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

module.exports = { hashSecret, verifySecret, normalizeAnswer };
