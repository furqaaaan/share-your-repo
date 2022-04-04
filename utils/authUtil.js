const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const AES_256_CBC = 'aes-256-cbc';
const password = config.encryption.key;
const key = crypto.scryptSync(password, 'salt', 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  let cipher = crypto.createCipheriv(AES_256_CBC, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function decrypt(text) {
  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text.encryptedData, 'hex');
  let decipher = crypto.createDecipheriv(AES_256_CBC, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function createJwtToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry,
  });
}

module.exports = { createJwtToken, encrypt, decrypt };
