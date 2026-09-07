const SHORT_SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg',
] as const;

export function formatNumber(value: number, precision = 2): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '0';
  const abs = Math.abs(value);
  if (abs < 1_000) {
    if (abs >= 100) return Math.floor(value).toLocaleString('en-US');
    if (abs >= 10) return value.toFixed(1).replace(/\.0$/, '');
    if (abs >= 1) return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    if (abs === 0) return '0';
    return value.toPrecision(Math.max(1, precision));
  }

  const tier = Math.floor(Math.log10(abs) / 3);
  if (tier < SHORT_SUFFIXES.length) {
    const scaled = value / 1_000 ** tier;
    const digits = Math.max(0, precision - Math.floor(Math.log10(Math.abs(scaled))));
    return `${scaled.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')}${SHORT_SUFFIXES[tier]}`;
  }

  return value.toExponential(2).replace('+', '');
}

export function formatInteger(value: number): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '0';
  if (Math.abs(value) >= 1_000_000) return formatNumber(value);
  return Math.floor(value).toLocaleString('en-US');
}

export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}
