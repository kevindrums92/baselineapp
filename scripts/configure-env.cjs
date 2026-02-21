#!/usr/bin/env node

/**
 * Configure environment-specific settings before build
 *
 * This script modifies:
 * - Bundle ID (com.jhotech.smartspend vs com.jhotech.smartspend.dev)
 * - Display Name (SmartSpend vs SmartSpend Dev)
 * - URL Scheme (smartspend vs smartspend-dev) for OAuth deep linking
 * - Xcode project settings
 * - APNs environment (development vs production)
 * - Firebase configuration file (GoogleService-Info.plist)
 *
 * Usage:
 *   node scripts/configure-env.cjs development
 *   node scripts/configure-env.cjs production
 */

const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'development';

// Configuration per environment
const configs = {
  development: {
    appId: 'com.jhotech.smartspend.dev',
    appName: 'SmartSpend Dev',
    displayName: 'SmartSpend Dev',
    urlScheme: 'smartspend-dev',
    apnsEnvironment: 'development'
  },
  production: {
    appId: 'com.jhotech.smartspend',
    appName: 'SmartSpend',
    displayName: 'SmartSpend',
    urlScheme: 'smartspend',
    apnsEnvironment: 'production'
  }
};

const config = configs[env];

if (!config) {
  console.error(`❌ Invalid environment: ${env}`);
  console.error('   Valid options: development, production');
  process.exit(1);
}

console.log(`\n🔧 Configuring app for ${env.toUpperCase()} environment...\n`);

// 1. Update capacitor.config.ts
const capacitorConfigPath = path.join(__dirname, '../capacitor.config.ts');
let capacitorConfig = fs.readFileSync(capacitorConfigPath, 'utf8');

capacitorConfig = capacitorConfig.replace(
  /appId:\s*['"].*?['"]/,
  `appId: '${config.appId}'`
);
capacitorConfig = capacitorConfig.replace(
  /appName:\s*['"].*?['"]/,
  `appName: '${config.appName}'`
);

fs.writeFileSync(capacitorConfigPath, capacitorConfig);
console.log(`✅ Updated capacitor.config.ts`);
console.log(`   - appId: ${config.appId}`);
console.log(`   - appName: ${config.appName}`);

// 2. Update iOS Info.plist
const plistPath = path.join(__dirname, '../ios/App/App/Info.plist');
if (fs.existsSync(plistPath)) {
  let plist = fs.readFileSync(plistPath, 'utf8');

  // Update CFBundleDisplayName
  plist = plist.replace(
    /(<key>CFBundleDisplayName<\/key>\s*<string>).*?(<\/string>)/,
    `$1${config.displayName}$2`
  );

  // Update CFBundleURLName
  plist = plist.replace(
    /(<key>CFBundleURLName<\/key>\s*<string>).*?(<\/string>)/,
    `$1${config.appId}$2`
  );

  // Update CFBundleURLSchemes (critical for OAuth deep linking)
  plist = plist.replace(
    /(<key>CFBundleURLSchemes<\/key>\s*<array>\s*<string>).*?(<\/string>)/,
    `$1${config.urlScheme}$2`
  );

  fs.writeFileSync(plistPath, plist);
  console.log(`✅ Updated Info.plist`);
  console.log(`   - CFBundleDisplayName: ${config.displayName}`);
  console.log(`   - CFBundleURLName: ${config.appId}`);
  console.log(`   - CFBundleURLSchemes: ${config.urlScheme}`);
}

// 3. Update Xcode project.pbxproj
const pbxprojPath = path.join(__dirname, '../ios/App/App.xcodeproj/project.pbxproj');
if (fs.existsSync(pbxprojPath)) {
  let pbxproj = fs.readFileSync(pbxprojPath, 'utf8');

  // Update PRODUCT_BUNDLE_IDENTIFIER (both Debug and Release)
  pbxproj = pbxproj.replace(
    /PRODUCT_BUNDLE_IDENTIFIER = .*?;/g,
    `PRODUCT_BUNDLE_IDENTIFIER = ${config.appId};`
  );

  fs.writeFileSync(pbxprojPath, pbxproj);
  console.log(`✅ Updated project.pbxproj`);
  console.log(`   - PRODUCT_BUNDLE_IDENTIFIER: ${config.appId}`);
}

// 4. Update App.entitlements (APNs environment)
const entitlementsPath = path.join(__dirname, '../ios/App/App/App.entitlements');
if (fs.existsSync(entitlementsPath)) {
  let entitlements = fs.readFileSync(entitlementsPath, 'utf8');

  // Update aps-environment
  entitlements = entitlements.replace(
    /(<key>aps-environment<\/key>\s*<string>).*?(<\/string>)/,
    `$1${config.apnsEnvironment}$2`
  );

  fs.writeFileSync(entitlementsPath, entitlements);
  console.log(`✅ Updated App.entitlements`);
  console.log(`   - aps-environment: ${config.apnsEnvironment}`);
}

// 5. Copy Firebase configuration file
const firebaseSuffix = env === 'development' ? 'dev' : 'prod';
const firebaseSourcePath = path.join(__dirname, `../ios/App/App/GoogleService-Info.plist.${firebaseSuffix}`);
const firebaseDestPath = path.join(__dirname, '../ios/App/App/GoogleService-Info.plist');

if (fs.existsSync(firebaseSourcePath)) {
  fs.copyFileSync(firebaseSourcePath, firebaseDestPath);
  console.log(`✅ Copied Firebase configuration`);
  console.log(`   - From: GoogleService-Info.plist.${firebaseSuffix}`);
  console.log(`   - To: GoogleService-Info.plist`);
} else {
  console.warn(`⚠️  Warning: Firebase config not found at ${firebaseSourcePath}`);
}

// 6. Swap app icon (dev icon has "DEV" banner)
const iconDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');
const iconDev = path.join(iconDir, 'AppIcon-1024-dev.png');
if (fs.existsSync(iconDev)) {
  // Update Contents.json to point to the correct icon
  const contentsPath = path.join(iconDir, 'Contents.json');
  const contents = JSON.parse(fs.readFileSync(contentsPath, 'utf8'));
  const iconFilename = env === 'development' ? 'AppIcon-1024-dev.png' : 'AppIcon-1024.png';
  contents.images[0].filename = iconFilename;
  fs.writeFileSync(contentsPath, JSON.stringify(contents, null, 2) + '\n');

  console.log(`✅ Swapped app icon`);
  console.log(`   - Using: ${iconFilename}`);
} else {
  console.warn(`⚠️  Warning: Dev icon not found at ${iconDev}`);
  console.warn(`   Run the icon generator script to create it.`);
}

console.log(`\n✨ Configuration complete for ${env.toUpperCase()}\n`);
console.log(`📱 App will be installed as: "${config.displayName}"`);
console.log(`🆔 Bundle ID: ${config.appId}`);
console.log(`🔗 URL Scheme: ${config.urlScheme}://`);
console.log(`🔔 APNs Environment: ${config.apnsEnvironment}`);
console.log(`🔥 Firebase: GoogleService-Info.plist.${firebaseSuffix}`);
console.log(`🎨 Icon: ${env === 'development' ? 'AppIcon-1024-dev.png (with DEV banner)' : 'AppIcon-1024.png (production)'}\n`);
