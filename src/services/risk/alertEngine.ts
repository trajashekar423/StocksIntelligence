import type { AlertSeverity, TradeTimelineEvent } from '../../types/risk.ts';

// Cooldown map: positionId + severity -> lastTriggeredMs
const alertCooldownMap = new Map<string, number>();
const COOLDOWN_MS = 45000; // 45s cooldown per position per severity level

/**
 * Web Audio API synthesizer for audio alerts.
 * Uses browser-native OscillatorNode to generate clean, pleasant warning & critical chime sounds.
 * 100% self-contained with no external mp3 or network dependencies.
 */
export function playSynthesizedAlertSound(severity: AlertSeverity): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (severity === 'CRITICAL' || severity === 'EXIT_WARNING') {
      // 2-tone urgent warning chime (880Hz -> 587Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(587, now + 0.25);

      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);

      // Repeat second pulse for critical
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(987, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(659, now + 0.4);

      gain2.gain.setValueAtTime(0.12, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.15);
      osc2.stop(now + 0.45);
    } else if (severity === 'WARNING') {
      // Single warning chime (660Hz -> 440Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Audio context may be blocked before first user gesture
  }
}

/**
 * Triggers Browser Notification if permission granted.
 */
export function sendBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      });
    }
  } catch {
    // Notification error
  }
}

/**
 * Dispatches alert with cooldown & debounce protection.
 */
export function triggerPositionAlert(
  positionId: string,
  symbol: string,
  severity: AlertSeverity,
  title: string,
  description: string
): boolean {
  const key = `${positionId}_${severity}`;
  const now = Date.now();
  const last = alertCooldownMap.get(key) || 0;

  if (now - last < COOLDOWN_MS) {
    return false; // Skip duplicate alert in cooldown window
  }

  alertCooldownMap.set(key, now);

  // Play audio alert
  playSynthesizedAlertSound(severity);

  // Send desktop notification if EXIT_WARNING or CRITICAL
  if (severity === 'CRITICAL' || severity === 'EXIT_WARNING') {
    sendBrowserNotification(`🚨 ${symbol}: ${title}`, description);
  }

  return true;
}

/**
 * Creates a formatted timeline event.
 */
export function createTimelineEvent(
  type: TradeTimelineEvent['type'],
  title: string,
  description: string,
  severity: AlertSeverity = 'INFO',
  price?: number,
  pnl?: number,
  riskScore?: number
): TradeTimelineEvent {
  const now = new Date();
  return {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
    timeMs: now.getTime(),
    type,
    title,
    description,
    price,
    pnl,
    riskScore,
    severity,
  };
}
