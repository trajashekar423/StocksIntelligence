import fs from 'fs';
import path from 'path';

// Parse .env
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

import { placeGrowwOrder } from '../src/lib/groww/orders.ts';

async function checkNow() {
  const res = await placeGrowwOrder({
    trading_symbol: 'INFY',
    quantity: 1,
    exchange: 'NSE',
    segment: 'CASH',
    product: 'MIS',
    order_type: 'MARKET',
    transaction_type: 'BUY',
  });
  console.log('Groww gateway response:', JSON.stringify(res, null, 2));
}

checkNow();

