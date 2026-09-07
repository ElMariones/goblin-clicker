const SHORT_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg'] as const;

function decimal(value: number, digits: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number, precision = 2, locale = 'en-US'): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '0';
  const abs = Math.abs(value);
  if (abs < 1_000) {
    if (abs >= 100) return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.floor(value));
    if (abs >= 10) return decimal(value, 1, locale);
    if (abs >= 1) return decimal(value, 2, locale);
    if (abs === 0) return '0';
    return new Intl.NumberFormat(locale, { maximumSignificantDigits: Math.max(1, precision) }).format(value);
  }

  const tier = Math.floor(Math.log10(abs) / 3);
  if (tier < SHORT_SUFFIXES.length) {
    const scaled = value / 1_000 ** tier;
    const digits = Math.max(0, precision - Math.floor(Math.log10(Math.abs(scaled))));
    return `${decimal(scaled, digits, locale)}${SHORT_SUFFIXES[tier]}`;
  }
  return value.toExponential(2).replace('+', '');
}

export function formatInteger(value: number, locale = 'en-US'): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '0';
  if (Math.abs(value) >= 1_000_000) return formatNumber(value, 2, locale);
  return Math.floor(value).toLocaleString(locale);
}

const UNITS: Record<string, { d: string; h: string; m: string; s: string }> = {
  en: { d: 'd', h: 'h', m: 'm', s: 's' }, es: { d: 'd', h: 'h', m: 'min', s: 's' }, zh: { d: '天', h: '小时', m: '分', s: '秒' },
  fr: { d: 'j', h: 'h', m: 'min', s: 's' }, de: { d: 'T', h: 'Std', m: 'Min', s: 'Sek' }, ar: { d: 'ي', h: 'س', m: 'د', s: 'ث' }, tr: { d: 'g', h: 'sa', m: 'dk', s: 'sn' },
};

export function formatDuration(ms: number, locale = 'en-US'): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const secs = seconds % 60;
  const unit = UNITS[locale.toLowerCase().split('-')[0]] ?? UNITS.en;
  const n = (value: number) => new Intl.NumberFormat(locale).format(value);
  if (days > 0) return `${n(days)}${unit.d} ${n(hours)}${unit.h}`;
  if (hours > 0) return `${n(hours)}${unit.h} ${n(minutes)}${unit.m}`;
  if (minutes > 0) return `${n(minutes)}${unit.m} ${n(secs)}${unit.s}`;
  return `${n(secs)}${unit.s}`;
}

export function formatDateTime(timestamp: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
}
