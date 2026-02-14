/**
 * Timezone Utilities
 * Handle timestamps in IST (India Standard Time) and other timezones
 */

export function formatDateIST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return istFormatter.format(dateObj);
}

export function formatDateShortIST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return istFormatter.format(dateObj);
}

export function formatTimeIST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return istFormatter.format(dateObj);
}

export function getISTTime(): Date {
  const now = new Date();
  const utcDate = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );

  // IST is UTC + 5:30
  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
  return istDate;
}

export function relativeTimeIST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = getISTTime();

  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + ' years ago';
  }

  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months ago';
  }

  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days ago';
  }

  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours ago';
  }

  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes ago';
  }

  return Math.floor(seconds) + ' seconds ago';
}

export function formatDateWithTimezone(date: Date | string, timezone: string = 'Asia/Kolkata'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return formatter.format(dateObj);
}

export function getTimezoneName(): string {
  return 'IST (India Standard Time)';
}

export function getTimezoneOffset(): string {
  return 'UTC +5:30';
}
