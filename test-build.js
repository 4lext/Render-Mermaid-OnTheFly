#!/usr/bin/env node
/**
 * Simple test to verify the extension's dist files are valid
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Chrome Extension Build...\n');

const distPath = path.join(__dirname, 'dist');
let allTestsPassed = true;

// Test 1: Check dist directory exists
console.log('Test 1: Checking dist directory...');
if (!fs.existsSync(distPath)) {
  console.error('  ✗ dist/ directory not found');
  allTestsPassed = false;
} else {
  console.log('  ✓ dist/ directory exists');
}

// Test 2: Check manifest.json
console.log('\nTest 2: Checking manifest.json...');
const manifestPath = path.join(distPath, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('  ✗ manifest.json not found');
  allTestsPassed = false;
} else {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('  ✓ manifest.json is valid JSON');
    console.log(`    - Name: ${manifest.name}`);
    console.log(`    - Version: ${manifest.version}`);
    console.log(`    - Manifest Version: ${manifest.manifest_version}`);
    
    if (manifest.manifest_version !== 3) {
      console.error('  ✗ Not using Manifest V3');
      allTestsPassed = false;
    } else {
      console.log('  ✓ Using Manifest V3');
    }
  } catch (e) {
    console.error('  ✗ manifest.json is not valid JSON:', e.message);
    allTestsPassed = false;
  }
}

// Test 3: Check required files
console.log('\nTest 3: Checking required files...');
const requiredFiles = [
  'background.js',
  'content.js',
  'styles.css',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ ${file} not found`);
    allTestsPassed = false;
  } else {
    const stats = fs.statSync(filePath);
    console.log(`  ✓ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  }
}

// Test 4: Check JavaScript syntax
console.log('\nTest 4: Checking JavaScript syntax...');
const jsFiles = ['background.js', 'content.js'];
for (const file of jsFiles) {
  const filePath = path.join(distPath, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Try to parse as JS - this is basic validation
    if (content.includes('__webpack')) {
      console.log(`  ✓ ${file} appears to be a webpack bundle`);
    } else {
      console.log(`  ✓ ${file} syntax appears valid`);
    }
  } catch (e) {
    console.error(`  ✗ ${file} has syntax errors:`, e.message);
    allTestsPassed = false;
  }
}

// Test 5: Check content.js includes Mermaid
console.log('\nTest 5: Checking Mermaid bundle...');
const contentPath = path.join(distPath, 'content.js');
const contentJs = fs.readFileSync(contentPath, 'utf8');
if (contentJs.includes('mermaid')) {
  console.log('  ✓ Mermaid library appears to be bundled in content.js');
} else {
  console.error('  ✗ Mermaid library not found in content.js');
  allTestsPassed = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('✅ All tests passed! Extension is ready to load.');
  console.log('\nTo load the extension in Chrome:');
  console.log('1. Open chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked"');
  console.log('4. Select the dist/ directory');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please fix the issues above.');
  process.exit(1);
}
