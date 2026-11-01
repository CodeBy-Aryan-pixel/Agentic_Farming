export function formatINR(value: number): string {
  const rounded = Math.round(value);

  try {
    return `₹${new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(rounded)}`;
  } catch {
    return `₹${rounded}`;
  }
}

export function formatNumber(
  value: number,
  maximumFractionDigits = 0
): string {
  const safe = Number.isFinite(value) ? value : 0;

  try {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits,
    }).format(safe);
  } catch {
    return safe.toFixed(maximumFractionDigits);
  }
}

export function formatGpsCoordinate(
  latitude: number,
  longitude: number
): string {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lonDirection = longitude >= 0 ? 'E' : 'W';

  return `Lat: ${Math.abs(latitude).toFixed(4)}° ${latDirection}, Lon: ${Math.abs(
    longitude
  ).toFixed(4)}° ${lonDirection}`;
}

export function formatPumpDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));

  if (safe === 0) return '0 mins';
  if (safe < 60) return `${safe} min${safe === 1 ? '' : 's'}`;

  const hours = Math.floor(safe / 60);
  const mins = safe % 60;

  if (mins === 0) return `${hours} hr${hours === 1 ? '' : 's'}`;

  return `${hours} hr ${mins} min${mins === 1 ? '' : 's'}`;
}

export function formatClockLabel(minutesSinceMidnight: number): string {
  const normalized =
    ((Math.round(minutesSinceMidnight) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${minutes
    .toString()
    .padStart(2, '0')} ${suffix}`;
}

export function formatRelativeUpdated(
  iso: string,
  now = Date.now()
): string {
  const timestamp = new Date(iso).getTime();

  if (!Number.isFinite(timestamp)) return 'just now';

  const seconds = Math.max(
    0,
    Math.floor((now - timestamp) / 1000)
  );

  if (seconds < 45) return 'just now';
  if (seconds < 90) return '1 min ago';

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  }

  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'earlier today';
  }
}

export function formatFetchedAt(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return 'unknown';

  try {
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return date.toISOString();
  }
}

export function formatAcres(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function formatRating(value: number): string {
  return value.toFixed(1);
}

export function formatReviewCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }

  return value.toString();
}
