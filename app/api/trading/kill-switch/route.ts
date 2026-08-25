import { NextResponse } from 'next/server';
import { updateConfig, addLog } from '@/src/lib/trading/store';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { enabled, mode } = body;

    const patch: any = {};
    if (typeof enabled === 'boolean') {
      patch.enabled = enabled;
      addLog(
        enabled ? 'INFO' : 'ALERT',
        'SYSTEM',
        enabled ? 'Emergency Kill Switch DEACTIVATED. New trades enabled.' : 'Emergency Kill Switch ACTIVATED. All new trades HALTED.'
      );
    }

    if (mode === 'PAPER' || mode === 'LIVE') {
      patch.mode = mode;
      addLog('ALERT', 'SYSTEM', `Trading mode switched to ${mode} TRADING.`);
    }

    const updated = updateConfig(patch);

    return NextResponse.json({
      success: true,
      enabled: updated.enabled,
      mode: updated.mode,
      config: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update kill switch' }, { status: 500 });
  }
}

