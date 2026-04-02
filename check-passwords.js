#!/usr/bin/env node

// Load environment variables from .env.local
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf-8');
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^\$/, '');
    }
  }
});

const mysql = require('mysql2/promise');
const crypto = require('crypto');

const algorithm = 'aes-256-gcm';

function deriveKey() {
  const seed = process.env.SYNC_ENCRYPTION_KEY ?? 'auditforge-dev-key';
  return crypto.createHash('sha256').update(seed).digest();
}

function decryptSecret(value) {
  try {
    const payload = Buffer.from(value, 'base64');
    const iv = payload.subarray(0, 12);
    const authTag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = crypto.createDecipheriv(algorithm, deriveKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch (e) {
    return value; // Fallback to the value itself if decryption fails
  }
}

async function checkPasswords() {
  try {
    console.log('🔍 Checking stored passwords...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'HappyServer$1',
      database: 'auditforge',
    });

    const [rows] = await connection.execute('SELECT system_type, username, encrypted_password FROM configurations');

    rows.forEach(config => {
      console.log(`📋 ${config.system_type}:`);
      console.log(`   Username: ${config.username}`);
      console.log(`   Encrypted: ${config.encrypted_password.substring(0, 50)}...`);
      try {
        const decrypted = decryptSecret(config.encrypted_password);
        console.log(`   Decrypted: ${decrypted}\n`);
      } catch (e) {
        console.log(`   Decryption failed: ${e.message}\n`);
      }
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPasswords();
