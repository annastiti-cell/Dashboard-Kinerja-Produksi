const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTHS_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function getTodayLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthKey(): string {
  return getTodayLocalDate().slice(0, 7);
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yStr, mStr] = monthKey.split('-');
  const date = new Date(Number(yStr), Number(mStr) - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const monthIdx = Number(mStr) - 1;
  if (monthIdx < 0 || monthIdx > 11) return monthKey;
  return `${MONTHS_ID[monthIdx]} ${yStr}`;
}

export function formatIndonesianDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const monthIdx = Number(m) - 1;
  if (monthIdx < 0 || monthIdx > 11) return dateStr;
  return `${Number(d)} ${MONTHS_SHORT_ID[monthIdx]} ${y}`;
}

export function getDaysInMonth(monthKey: string): string[] {
  const [yStr, mStr] = monthKey.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const totalDays = new Date(year, month, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= totalDays; d++) {
    days.push(`${yStr}-${mStr}-${String(d).padStart(2, '0')}`);
  }
  return days;
}

export function isWeekday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

export function formatTimestampTime(ts: { toDate: () => Date } | null | undefined): string {
  if (!ts) return '—';
  const date = ts.toDate();
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
