/**
 * Renders an ISO date/timestamp as "01 Apr 2021". Formats in UTC deliberately:
 * a date-only ISO string (`joinDate`) parses as UTC midnight per spec, and a
 * revision's `createdAt` should read as the same calendar day for every HR
 * user regardless of their local timezone — a ledger date shouldn't drift by a
 * day depending on where you're viewing it from.
 */
export function formatDate(isoDateOrTimestamp: string): string {
  const date = new Date(isoDateOrTimestamp);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
