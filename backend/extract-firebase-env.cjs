#!/usr/bin/env node

/**
 * Extract Firebase Credentials for Render Deployment
 *
 * This script reads your Firebase service account JSON file and outputs
 * the environment variables needed for Render deployment.
 *
 * Usage:
 *   node extract-firebase-env.js
 *   node extract-firebase-env.js path/to/serviceAccount.json
 */

const fs = require('fs');
const path = require('path');

function findServiceAccountFile() {
  const possiblePaths = [
    path.join(__dirname, 'verolabz-dbc48-firebase-adminsdk-fbsvc-2bafd3a4a9.json'),
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(__dirname, 'firebase-adminsdk.json'),
    path.join(process.cwd(), 'serviceAccountKey.json'),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

function extractCredentials(filePath) {
  try {
    console.log('\n🔍 Reading Firebase service account file...\n');
    console.log(`📂 File: ${filePath}\n`);

    const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    console.log('✅ Successfully parsed Firebase credentials!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 COPY THESE ENVIRONMENT VARIABLES TO RENDER DASHBOARD');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('FIREBASE_PROJECT_ID');
    console.log(serviceAccount.project_id);
    console.log('');

    console.log('FIREBASE_CLIENT_EMAIL');
    console.log(serviceAccount.client_email);
    console.log('');

    console.log('FIREBASE_PRIVATE_KEY');
    console.log('⚠️  IMPORTANT: Copy the ENTIRE key including the header and footer');
    console.log('⚠️  Keep the \\n characters - Render will handle them automatically');
    console.log(serviceAccount.private_key);
    console.log('');

    console.log('FIREBASE_STORAGE_BUCKET');
    console.log(serviceAccount.project_id + '.appspot.com');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📝 HOW TO ADD TO RENDER:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('1. Go to your Render service dashboard');
    console.log('2. Click "Environment" tab');
    console.log('3. Click "Add Environment Variable"');
    console.log('4. Copy each key-value pair above');
    console.log('5. For FIREBASE_PRIVATE_KEY: paste the ENTIRE key (including -----BEGIN/END-----)');
    console.log('6. Click "Save Changes"\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💡 ADDITIONAL REQUIRED VARIABLES:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('GROQ_API_KEY=your_groq_api_key_from_console.groq.com');
    console.log('GEMINI_API_KEY=your_gemini_api_key_from_aistudio.google.com');
    console.log('ALLOWED_ORIGINS=https://your-frontend-url.com');
    console.log('\n');

    // Also create a .env snippet
    const envSnippet = `
# Firebase Configuration (for local development)
FIREBASE_PROJECT_ID=${serviceAccount.project_id}
FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}
FIREBASE_PRIVATE_KEY="${serviceAccount.private_key.replace(/\n/g, '\\n')}"
FIREBASE_STORAGE_BUCKET=${serviceAccount.project_id}.appspot.com

# AI API Keys
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-url.com
`;

    const envFilePath = path.join(__dirname, '.env.firebase');
    fs.writeFileSync(envFilePath, envSnippet.trim());

    console.log('✅ Also created .env.firebase file for local development');
    console.log(`📁 Location: ${envFilePath}`);
    console.log('💡 You can copy values from this file to your .env\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Make sure the file is a valid JSON file\n');
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
let filePath = args[0];

if (!filePath) {
  console.log('🔍 Searching for Firebase service account file...\n');
  filePath = findServiceAccountFile();
}

if (!filePath) {
  console.error('❌ Error: Could not find Firebase service account file\n');
  console.error('Please provide the path as an argument:');
  console.error('  node extract-firebase-env.js path/to/serviceAccount.json\n');
  console.error('Or place one of these files in the backend directory:');
  console.error('  - serviceAccountKey.json');
  console.error('  - firebase-adminsdk.json');
  console.error('  - *-firebase-adminsdk-*.json\n');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ Error: File not found: ${filePath}\n`);
  process.exit(1);
}

extractCredentials(filePath);
