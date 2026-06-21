/** Human-friendly relative date for ledger rows. */
export function formatRelativeDate(ms: number | undefined | null): string {
  if (!ms) return '';
  const date = new Date(ms);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86_400_000;

  if (ms >= startOfToday) return 'Today';
  if (ms >= startOfToday - dayMs) return 'Yesterday';

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
