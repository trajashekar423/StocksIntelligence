import fs from 'fs';
import path from 'path';

// Parse .env manually for standalone script
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

import { verifyGrowwConnection, getGrowwUserProfile } from '../src/lib/groww/auth.ts';

async function testGrowwAuth() {
  console.log('API KEY length:', process.env.GROWW_API_KEY?.length);
  console.log('Testing Groww Connection with new credentials...');
  const status = await verifyGrowwConnection(true);
  console.log('Groww Auth Status:', JSON.stringify(status, null, 2));

  if (status.authenticated) {
    const profile = await getGrowwUserProfile();
    console.log('Groww User Profile:', JSON.stringify(profile, null, 2));
  }
}

testGrowwAuth();

