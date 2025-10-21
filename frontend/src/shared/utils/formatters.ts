const DEFAULT_CURRENCIES: Record<string, string> = {
  es: 'COP',
  'es-CO': 'COP',
  en: 'USD',
};

export function formatCurrency(value: number, locale: string) {
  const currency = DEFAULT_CURRENCIES[locale] ?? 'USD';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value ?? 0);
}

export function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatMonthLabel(monthKey: string, locale: string) {
  if (!monthKey) return '—';
  const [year, month] = monthKey.split('-');
  if (!year || !month) return monthKey;
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return monthKey;
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
}
