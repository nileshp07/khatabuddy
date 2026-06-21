/** Tiny className joiner. Later classes win for the same property in NativeWind,
 *  so callers can override component defaults by passing className last. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
