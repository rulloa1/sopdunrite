// Shared expiration-status logic for the qualification/certification tracking
// logs. Dates are stored as yyyy-mm-dd and compared in local time so a date
// never rolls a day off due to UTC.

export const EXPIRY_WARNING_DAYS = 60;

export type ExpiryStatus = "none" | "valid" | "expiring" | "expired";

/** Local (not UTC) yyyy-mm-dd, so an entry made late in the day keeps today. */
export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** Parse a yyyy-mm-dd date as local midnight (avoids UTC off-by-one). */
function parseLocal(date: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

/**
 * Classify an expiration date relative to today:
 * - "none"     no date on file (not tracked / does not expire)
 * - "expired"  the date is in the past
 * - "expiring" within EXPIRY_WARNING_DAYS from today (inclusive)
 * - "valid"    further out than the warning window
 */
export function expiryStatus(date: string | null | undefined): ExpiryStatus {
  if (!date) return "none";
  const when = parseLocal(date);
  if (when === null) return "none";
  const now = parseLocal(todayISO())!;
  if (when < now) return "expired";
  const days = Math.round((when - now) / 86400000);
  return days <= EXPIRY_WARNING_DAYS ? "expiring" : "valid";
}

/** Rank used to surface the most urgent status when a row has several dates. */
export function statusRank(s: ExpiryStatus): number {
  switch (s) {
    case "expired":
      return 3;
    case "expiring":
      return 2;
    case "valid":
      return 1;
    default:
      return 0;
  }
}

/** The most urgent status among several expiration dates. */
export function worstStatus(dates: (string | null | undefined)[]): ExpiryStatus {
  return dates
    .map(expiryStatus)
    .reduce<ExpiryStatus>((worst, s) => (statusRank(s) > statusRank(worst) ? s : worst), "none");
}
