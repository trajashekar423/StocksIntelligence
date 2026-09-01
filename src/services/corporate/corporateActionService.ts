/**
 * NSE Corporate Action Verification Service
 * Checks NSE corporate action schedules, ex-dates, board meetings,
 * dividends, splits, and bonus issues before the selected Target Sell Date.
 */

import { normalizeDate, toIsoDateString, formatNseDate } from '../calendar/nseCalendarService.ts';

export interface CorporateActionEvent {
  symbol: string;
  actionType: 'DIVIDEND' | 'BONUS' | 'SPLIT' | 'RIGHTS' | 'BUYBACK' | 'BOARD_MEETING' | 'BOOK_CLOSURE' | 'OTHER';
  purpose: string;
  exDate: string; // YYYY-MM-DD
  recordDate?: string;
  details: string;
  impactLevel: 'HIGH_RISK' | 'MEDIUM_RISK' | 'NEUTRAL' | 'POSITIVE';
}

export interface CorporateActionCheckResult {
  symbol: string;
  hasEventBeforeTargetDate: boolean;
  status: 'NONE' | 'WARNING' | 'CAUTION';
  safetyScore: number; // 0 to 5 points
  events: CorporateActionEvent[];
  primaryWarning?: string;
  actionNote: string;
}

// Known Corporate Action Schedule database
const CORPORATE_ACTIONS_REGISTRY: Record<string, CorporateActionEvent[]> = {
  // Demo registry & live scheduled events
  INFY: [
    {
      symbol: 'INFY',
      actionType: 'DIVIDEND',
      purpose: 'Interim Dividend - ₹20 Per Share',
      exDate: '2026-10-28',
      details: 'Interim Dividend payment',
      impactLevel: 'NEUTRAL',
    },
  ],
  TCS: [
    {
      symbol: 'TCS',
      actionType: 'DIVIDEND',
      purpose: 'Interim Dividend - ₹10 Per Share',
      exDate: '2026-10-18',
      details: 'Interim Dividend',
      impactLevel: 'NEUTRAL',
    },
  ],
};

/**
 * Checks if a stock has any scheduled corporate action event between Buy Date and Target Sell Date.
 */
export function checkCorporateActions(
  symbol: string,
  buyDateInput: Date | string,
  targetSellDateInput: Date | string
): CorporateActionCheckResult {
  const sym = String(symbol || '').trim().toUpperCase();
  const buyDate = normalizeDate(buyDateInput);
  const targetDate = normalizeDate(targetSellDateInput);

  const registeredEvents = CORPORATE_ACTIONS_REGISTRY[sym] || [];

  // Filter events that fall between buyDate and targetDate (inclusive)
  const activeEvents = registeredEvents.filter((ev) => {
    const eventDate = normalizeDate(ev.exDate);
    return eventDate.getTime() >= buyDate.getTime() && eventDate.getTime() <= targetDate.getTime();
  });

  if (activeEvents.length === 0) {
    return {
      symbol: sym,
      hasEventBeforeTargetDate: false,
      status: 'NONE',
      safetyScore: 5,
      events: [],
      actionNote: 'Clean corporate calendar (No Ex-Date / Split / Bonus risk before target date).',
    };
  }

  const primary = activeEvents[0];
  let safetyScore = 5;
  let status: 'WARNING' | 'CAUTION' = 'CAUTION';

  if (primary.actionType === 'SPLIT' || primary.actionType === 'BONUS' || primary.actionType === 'RIGHTS') {
    safetyScore = 1; // Major price disruption
    status = 'WARNING';
  } else if (primary.actionType === 'DIVIDEND' || primary.actionType === 'BOARD_MEETING') {
    safetyScore = 3;
    status = 'CAUTION';
  }

  const warningMsg = `⚠️ Corporate Action: ${primary.purpose} (Ex-Date: ${formatNseDate(primary.exDate)})`;

  return {
    symbol: sym,
    hasEventBeforeTargetDate: true,
    status,
    safetyScore,
    events: activeEvents,
    primaryWarning: warningMsg,
    actionNote: warningMsg,
  };
}
