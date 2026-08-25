import { NextResponse } from 'next/server';
import { getGrowwUserProfile } from '@/src/lib/groww/auth';
import { getTradingConfig } from '@/src/lib/trading/config';

export async function GET() {
  try {
    const profile = await getGrowwUserProfile();
    const config = getTradingConfig();

    if (profile) {
      return NextResponse.json({
        success: true,
        profile,
        tradingMode: config.mode,
      });
    }

    // Default safe fallback if credentials are not configured yet
    return NextResponse.json({
      success: true,
      profile: {
        name: 'Trader Account',
        email: 'trader@groww.in',
        active: false,
        availableMargin: config.capital,
        usedMargin: 0,
        totalBalance: config.capital,
      },
      tradingMode: config.mode,
      note: 'Groww API unconfigured or running in Paper Mode.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch Groww profile' },
      { status: 500 }
    );
  }
}

