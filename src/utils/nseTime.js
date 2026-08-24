const TIME_ZONE = 'Asia/Kolkata';

function parts(date = new Date()) {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  return Object.fromEntries(values.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
}

export function getNSEDateTime(date = new Date()) {
  const p = parts(date);
  return {
    year: Number(p.year), month: Number(p.month), day: Number(p.day),
    hour: Number(p.hour), minute: Number(p.minute), second: Number(p.second),
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}:${p.second}`,
    shortTime: `${p.hour}:${p.minute}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
    dayOfWeek: new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, weekday: 'short' }).format(date),
    timeZone: TIME_ZONE,
  };
}

export function formatNSEDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIME_ZONE,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
}

export function getNSETradingDate(date = new Date()) { return getNSEDateTime(date).date; }
export function getNSEMinutes(date = new Date()) { return getNSEDateTime(date).minutes; }
export function getNSETime(date = new Date()) { return getNSEDateTime(date).shortTime; }
export function isNSEWeekday(date = new Date()) {
  const d = getNSEDateTime(date).dayOfWeek;
  return d !== 'Sat' && d !== 'Sun';
}

export function getNSEParts(date = new Date()) { return getNSEDateTime(date); }
export const NSE_TIME_ZONE = TIME_ZONE;
