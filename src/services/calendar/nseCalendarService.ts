/**
 * NSE Trading Calendar & Session Engine
 * Handles official NSE trading day determinations, weekend exclusions,
 * Indian market holiday schedules, and exact trading session calculations.
 */

// Official NSE Equity Market Holidays for 2026 & 2027 (YYYY-MM-DD)
export const NSE_HOLIDAYS_MAP: Record<string, string> = {
  // 2026 Holidays
  '2026-01-26': 'Republic Day',
  '2026-02-16': 'Mahashivratri',
  '2026-03-03': 'Holi',
  '2026-03-20': 'Id-Ul-Fitr (Ramzan Id)',
  '2026-03-27': 'Ram Navami',
  '2026-03-31': 'Mahavir Jayanti',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2026-05-01': 'Maharashtra Day',
  '2026-05-28': 'Bakri Id (Id-Ul-Adha)',
  '2026-06-26': 'Muharram',
  '2026-08-15': 'Independence Day',
  '2026-09-14': 'Ganesh Chaturthi',
  '2026-10-02': 'Mahatma Gandhi Jayanti',
  '2026-10-20': 'Dussehra',
  '2026-11-09': 'Diwali Laxmi Pujan (Muhurat Trading only)',
  '2026-11-10': 'Diwali Balipratipada',
  '2026-11-24': 'Gurunanak Jayanti',
  '2026-12-25': 'Christmas',

  // 2027 Holidays
  '2027-01-26': 'Republic Day',
  '2027-03-08': 'Mahashivratri',
  '2027-03-22': 'Holi',
  '2027-03-26': 'Good Friday',
  '2027-04-14': 'Dr. Ambedkar Jayanti',
  '2027-05-01': 'Maharashtra Day',
  '2027-08-15': 'Independence Day',
  '2027-10-02': 'Mahatma Gandhi Jayanti',
  '2027-11-01': 'Diwali',
  '2027-12-25': 'Christmas',
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Converts any Date, ISO string, or formatted date string to a normalized Date object (midnight local/IST).
 */
export function normalizeDate(input: Date | string): Date {
  if (input instanceof Date) {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }

  if (typeof input === 'string') {
    // If format like "31-August-2026" or "31-Aug-2026"
    const customMatch = input.match(/^(\d{1,2})[-/ ]([A-Za-z]+)[-/ ](\d{4})$/);
    if (customMatch) {
      const day = parseInt(customMatch[1], 10);
      const monthStr = customMatch[2].toLowerCase();
      const year = parseInt(customMatch[3], 10);

      const monthIndex = MONTH_NAMES.findIndex((m) =>
        m.toLowerCase().startsWith(monthStr.slice(0, 3))
      );
      if (monthIndex >= 0) {
        return new Date(year, monthIndex, day);
      }
    }

    // Standard ISO parse YYYY-MM-DD
    const isoMatch = input.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    }

    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Returns ISO date string YYYY-MM-DD
 */
export function toIsoDateString(date: Date | string): string {
  const d = normalizeDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date into standard readable NSE date format, e.g. "31-August-2026"
 */
export function formatNseDate(date: Date | string): string {
  const d = normalizeDate(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Returns today's date normalized in Indian Standard Time (Asia/Kolkata).
 */
export function getTodayNseDate(): Date {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return normalizeDate(formatter.format(new Date()));
  } catch {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}

/**
 * Checks whether a given date is an active NSE Trading Day.
 * Returns false on Saturdays, Sundays, and official NSE holidays.
 */
export function isNseTradingDay(date: Date | string): boolean {
  const d = normalizeDate(date);
  const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday

  // Exclude Weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Exclude NSE Holidays
  const isoStr = toIsoDateString(d);
  if (NSE_HOLIDAYS_MAP[isoStr]) {
    return false;
  }

  return true;
}

/**
 * Returns the holiday reason if the date is a holiday, or null if it is a trading day / regular weekend.
 */
export function getNseHolidayName(date: Date | string): string | null {
  const isoStr = toIsoDateString(date);
  return NSE_HOLIDAYS_MAP[isoStr] || null;
}

/**
 * Returns the next valid NSE trading day starting strictly after the given date (or on date if includeToday is true).
 */
export function getNextNseTradingDay(date: Date | string, includeToday: boolean = false): Date {
  const cur = normalizeDate(date);
  if (!includeToday) {
    cur.setDate(cur.getDate() + 1);
  }

  while (!isNseTradingDay(cur)) {
    cur.setDate(cur.getDate() + 1);
  }

  return cur;
}

/**
 * Returns the nearest preceding valid NSE trading day.
 */
export function getPreviousNseTradingDay(date: Date | string, includeToday: boolean = false): Date {
  const cur = normalizeDate(date);
  if (!includeToday) {
    cur.setDate(cur.getDate() - 1);
  }

  while (!isNseTradingDay(cur)) {
    cur.setDate(cur.getDate() - 1);
  }

  return cur;
}

export interface TradingSessionCalculation {
  buyDate: Date;
  buyDateFormatted: string;
  targetSellDate: Date;
  targetSellDateFormatted: string;
  isTargetSellDateValid: boolean;
  adjustedTargetSellDate: Date;
  adjustedTargetSellDateFormatted: string;
  tradingSessions: number;
  calendarDays: number;
  weekendDaysExcluded: number;
  holidaysEncountered: Array<{ date: string; name: string }>;
  explanation: string;
}

/**
 * Calculates the exact number of NSE trading sessions between Buy Date and Target Sell Date.
 * Properly skips weekends and official holidays.
 */
export function calculateTradingSessions(
  buyDateInput: Date | string,
  targetSellDateInput: Date | string
): TradingSessionCalculation {
  const buyDate = normalizeDate(buyDateInput);
  const targetDate = normalizeDate(targetSellDateInput);

  const buyDateFormatted = formatNseDate(buyDate);
  const targetSellDateFormatted = formatNseDate(targetDate);

  const isTargetSellDateValid = isNseTradingDay(targetDate);
  const adjustedTargetSellDate = isTargetSellDateValid
    ? targetDate
    : getNextNseTradingDay(targetDate, false);
  const adjustedTargetSellDateFormatted = formatNseDate(adjustedTargetSellDate);

  let tradingSessions = 0;
  let weekendDaysExcluded = 0;
  const holidaysEncountered: Array<{ date: string; name: string }> = [];

  const cur = new Date(buyDate.getFullYear(), buyDate.getMonth(), buyDate.getDate() + 1);
  const end = new Date(
    adjustedTargetSellDate.getFullYear(),
    adjustedTargetSellDate.getMonth(),
    adjustedTargetSellDate.getDate()
  );

  const totalCalendarMs = end.getTime() - buyDate.getTime();
  const calendarDays = Math.max(Math.round(totalCalendarMs / (1000 * 60 * 60 * 24)), 0);

  while (cur.getTime() <= end.getTime()) {
    const dayOfWeek = cur.getDay();
    const isoStr = toIsoDateString(cur);

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDaysExcluded++;
    } else if (NSE_HOLIDAYS_MAP[isoStr]) {
      holidaysEncountered.push({
        date: formatNseDate(cur),
        name: NSE_HOLIDAYS_MAP[isoStr],
      });
    } else {
      tradingSessions++;
    }

    cur.setDate(cur.getDate() + 1);
  }

  // Generate explanation
  let explanation = `${tradingSessions} NSE trading session${tradingSessions === 1 ? '' : 's'}`;
  const notes = [];
  if (weekendDaysExcluded > 0) {
    notes.push(`${weekendDaysExcluded} weekend day${weekendDaysExcluded === 1 ? '' : 's'} excluded`);
  }
  if (holidaysEncountered.length > 0) {
    notes.push(
      `Holidays: ${holidaysEncountered.map((h) => `${h.name} (${h.date})`).join(', ')}`
    );
  }
  if (!isTargetSellDateValid) {
    const holidayName = getNseHolidayName(targetDate);
    notes.push(
      `${targetSellDateFormatted} is not an NSE trading day (${
        holidayName || 'Weekend'
      }), adjusted to ${adjustedTargetSellDateFormatted}`
    );
  }
  if (notes.length > 0) {
    explanation += ` (${notes.join('; ')})`;
  }

  return {
    buyDate,
    buyDateFormatted,
    targetSellDate: targetDate,
    targetSellDateFormatted,
    isTargetSellDateValid,
    adjustedTargetSellDate,
    adjustedTargetSellDateFormatted,
    tradingSessions: Math.max(tradingSessions, 1),
    calendarDays,
    weekendDaysExcluded,
    holidaysEncountered,
    explanation,
  };
}

export interface SuggestedTargetDatePreset {
  label: string; // e.g. "31-Aug-2026 (+1 Session BTST)"
  targetDate: Date;
  targetDateFormatted: string;
  isoDate: string;
  sessions: number;
  holdingType: 'BTST / 1-DAY' | 'SHORT SWING' | 'WEEKLY SWING';
}

/**
 * Returns a list of quick suggested upcoming target dates (+1, +2, +3, +4, +5 trading sessions).
 */
export function getSuggestedTargetDates(buyDateInput: Date | string = new Date()): SuggestedTargetDatePreset[] {
  const buyDate = normalizeDate(buyDateInput);
  const presets: SuggestedTargetDatePreset[] = [];

  let cur = new Date(buyDate.getFullYear(), buyDate.getMonth(), buyDate.getDate());

  for (let session = 1; session <= 5; session++) {
    cur = getNextNseTradingDay(cur, false);
    const formatted = formatNseDate(cur);
    const isoDate = toIsoDateString(cur);

    let holdingType: 'BTST / 1-DAY' | 'SHORT SWING' | 'WEEKLY SWING' = 'SHORT SWING';
    if (session === 1) holdingType = 'BTST / 1-DAY';
    else if (session >= 4) holdingType = 'WEEKLY SWING';

    presets.push({
      label: `${formatted} (${session === 1 ? '+1 Session BTST' : `+${session} Sessions`})`,
      targetDate: new Date(cur.getTime()),
      targetDateFormatted: formatted,
      isoDate,
      sessions: session,
      holdingType,
    });
  }

  return presets;
}

