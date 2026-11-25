const { randomBytes, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const bcrypt = require('bcryptjs');
const derive = promisify(scrypt);
const parameters = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, parameters);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

async function verifyPassword(password, encoded) {
  if (typeof encoded === 'string' && /^\$2[aby]\$/.test(encoded)) return bcrypt.compare(password, encoded);
  const [, salt = '00000000000000000000000000000000', expected = '0'.repeat(128)] = (encoded || '').split('$');
  const actual = await derive(password, salt, 64, parameters);
  const wanted = Buffer.from(expected, 'hex');
  return wanted.length === actual.length && timingSafeEqual(actual, wanted);
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sameSecret(first, second) {
  return timingSafeEqual(Buffer.from(digest(first), 'hex'), Buffer.from(digest(second), 'hex'));
}

module.exports = { hashPassword, verifyPassword, digest, sameSecret };
