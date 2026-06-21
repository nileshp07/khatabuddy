/**
 * Money utilities — everything is an integer in the currency's minor unit.
 *
 * Floating-point money is the classic silent-bug source. We parse user input
 * into integer minor units once, do all arithmetic on integers, and format only
 * at the display boundary. Split allocation uses the **largest-remainder method**
 * so the parts always sum *exactly* back to the total (no lost or phantom paise).
 */

/** Currencies whose minor unit is not 1/100 of the major unit. */
const MINOR_UNIT_DIGITS: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  VND: 0,
  BHD: 3,
  KWD: 3,
  OMR: 3,
};

export function minorUnitDigits(currency: string): number {
  return MINOR_UNIT_DIGITS[currency.toUpperCase()] ?? 2;
}

export function minorUnitFactor(currency: string): number {
  return 10 ** minorUnitDigits(currency);
}

/**
 * Parse a human-typed major-unit string ("1,234.50") into integer minor units.
 * Returns null for invalid input so callers can show a validation message.
 */
export function parseAmountToMinor(input: string, currency: string): number | null {
  const cleaned = input.replace(/[,\s]/g, '').trim();
  if (cleaned === '' || cleaned === '.') return null;
  if (!/^\d*\.?\d*$/.test(cleaned)) return null;

  const digits = minorUnitDigits(currency);
  const [whole = '0', frac = ''] = cleaned.split('.');
  if (frac.length > digits) return null; // more precision than the currency allows

  const paddedFrac = frac.padEnd(digits, '0');
  const minor = Number(whole) * minorUnitFactor(currency) + Number(paddedFrac || '0');
  return Number.isFinite(minor) ? Math.round(minor) : null;
}

/** Convert integer minor units back to a major-unit number (for Intl formatting). */
export function minorToMajor(minor: number, currency: string): number {
  return minor / minorUnitFactor(currency);
}

/**
 * Format minor units as a localized currency string, e.g. 123456 + "INR" -> "₹1,234.56".
 * Hermes ships Intl, so this works on-device.
 */
export function formatMoney(
  minor: number,
  currency: string,
  opts: { signDisplay?: 'auto' | 'never' | 'exceptZero' | 'always' } = {},
): string {
  const digits = minorUnitDigits(currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      signDisplay: opts.signDisplay ?? 'auto',
    }).format(minorToMajor(minor, currency));
  } catch {
    // Unknown currency code — fall back to a plain number with the code suffix.
    return `${minorToMajor(minor, currency).toFixed(digits)} ${currency}`;
  }
}

/** Absolute-value formatting helper (UI usually shows the sign via color/label). */
export function formatMoneyAbs(minor: number, currency: string): string {
  return formatMoney(Math.abs(minor), currency, { signDisplay: 'never' });
}

/**
 * Allocate `total` minor units across `weights` so the result sums exactly to
 * `total`. Floor every share, then hand the leftover units one-by-one to the
 * shares with the largest fractional remainder. This is the engine behind every
 * split method:
 *   - equal:   weights = [1, 1, 1, ...]
 *   - percent: weights = [50, 30, 20]
 *   - shares:  weights = [2, 1, 1]  (e.g. a couple counts double)
 */
export function allocateByWeights(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum <= 0) {
    throw new Error('allocateByWeights: weights must sum to a positive number');
  }

  const exact = weights.map((w) => (total * w) / weightSum);
  const floors = exact.map(Math.floor);
  const used = floors.reduce((a, b) => a + b, 0);
  let remainder = total - used; // always an integer in [0, n)

  // Distribute the remaining units to the largest fractional parts first.
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < remainder && k < order.length; k++) {
    floors[order[k].index] += 1;
  }
  return floors;
}

/** Equal split with deterministic remainder handling. */
export function splitEqual(total: number, count: number): number[] {
  if (count <= 0) throw new Error('splitEqual: count must be positive');
  return allocateByWeights(total, new Array(count).fill(1));
}

/** Percentage split — percents may be fractional and need not be pre-normalized. */
export function splitByPercent(total: number, percents: number[]): number[] {
  return allocateByWeights(total, percents);
}

/** Validate an exact (custom-amount) split: parts must be non-negative and sum to total. */
export function isValidExactSplit(total: number, parts: number[]): boolean {
  if (parts.some((p) => p < 0 || !Number.isInteger(p))) return false;
  return parts.reduce((a, b) => a + b, 0) === total;
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
