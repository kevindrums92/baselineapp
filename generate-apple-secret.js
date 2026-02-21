/**
 * Script para generar el Secret Key (JWT) de Sign in with Apple
 *
 * Requisitos:
 * - npm install jsonwebtoken
 *
 * Uso:
 * 1. Completa las variables TEAM_ID, KEY_ID, SERVICE_ID
 * 2. Asegúrate de que la ruta al archivo .p8 sea correcta
 * 3. Ejecuta: node generate-apple-secret.js
 */

import fs from 'fs';
import jwt from 'jsonwebtoken';

// ===== CONFIGURACIÓN =====
// Completa estos valores desde Apple Developer Console y ejecuta: node generate-apple-secret.js

const TEAM_ID = 'MUAC9DX7AH'; // Tu Team ID de Apple Developer (ej: 'A1B2C3D4E5')
const KEY_ID = '7AG7TQ29R3'; // El Key ID de tu clave de autenticación (viene en el nombre del archivo .p8)
const SERVICE_ID = 'com.jhotech.smartspend.dev.auth'; // Tu Service ID (Client ID) - ya configurado en Supabase
const P8_FILE_PATH = '/Users/mac/Downloads/AuthKey_7AG7TQ29R3.p8'; // Ruta a tu archivo .p8

// ===== VALIDACIÓN =====
if (TEAM_ID === 'TU_TEAM_ID_AQUI') {
  console.error('\n❌ ERROR: Debes completar el TEAM_ID en el script antes de ejecutarlo.\n');
  console.log('👉 Abre generate-apple-secret.js y reemplaza "TU_TEAM_ID_AQUI" con tu Team ID real.\n');
  process.exit(1);
}

// ===== GENERACIÓN DEL JWT =====

try {
  // Leer la clave privada
  const privateKey = fs.readFileSync(P8_FILE_PATH, 'utf8');

  // Crear el JWT
  const token = jwt.sign(
    {
      // Payload
      iss: TEAM_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (86400 * 180), // 180 días (6 meses)
      aud: 'https://appleid.apple.com',
      sub: SERVICE_ID,
    },
    privateKey,
    {
      // Header
      algorithm: 'ES256',
      keyid: KEY_ID,
    }
  );

  console.log('\n✅ Secret Key (JWT) generado exitosamente:\n');
  console.log('━'.repeat(80));
  console.log(token);
  console.log('━'.repeat(80));
  console.log('\n📋 PASOS SIGUIENTES:');
  console.log('   1. Copia el token de arriba (toda la línea)');
  console.log('   2. Ve a Supabase Dashboard > Authentication > Providers > Apple');
  console.log('   3. Pégalo en el campo "Secret Key (for OAuth)"');
  console.log('   4. Guarda los cambios');
  console.log('\n⚠️  IMPORTANTE: Este token expira en 6 meses (180 días).');
  console.log('   Deberás generar uno nuevo antes de que expire.\n');
  console.log('📅 Fecha de expiración:', new Date(Date.now() + (86400 * 180 * 1000)).toLocaleDateString('es-CO'));
  console.log();

} catch (error) {
  console.error('❌ Error al generar el JWT:', error.message);
  process.exit(1);
}
