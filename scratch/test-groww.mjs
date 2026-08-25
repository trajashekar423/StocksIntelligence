import { verifyGrowwConnection, getGrowwUserProfile } from '../src/lib/groww/auth.ts';
import { fetchGrowwQuote } from '../src/lib/groww/marketData.ts';

async function testGroww() {
  console.log('Testing Groww Connection...');
  console.log('GROWW_API_KEY set:', Boolean(process.env.GROWW_API_KEY));
  console.log('GROWW_API_SECRET set:', Boolean(process.env.GROWW_API_SECRET));

  const auth = await verifyGrowwConnection(true);
  console.log('Auth result:', JSON.stringify(auth, null, 2));

  const profile = await getGrowwUserProfile();
  console.log('Profile result:', JSON.stringify(profile, null, 2));
}

testGroww().catch(console.error);

