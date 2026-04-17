/**
 * CAGR aligned with the Excel model: ((V_2033 / V_2026)^(1/7)) - 1, i.e. 7 compounding
 * periods from end-2026 to end-2033. Uses 2025–2033 series but ignores 2025 for CAGR.
 */

export const CAGR_VALUE_YEAR = 2026
export const CAGR_END_YEAR = 2033

/** Number of years in the CAGR window (2033 − 2026 = 7). */
export const CAGR_YEAR_SPAN = CAGR_END_YEAR - CAGR_VALUE_YEAR

export function timeSeriesGet(
  ts: Record<number, number> | undefined,
  year: number
): number {
  if (!ts) return 0
  const v = (ts as Record<string | number, number>)[year] ?? (ts as Record<string | number, number>)[String(year)]
  return typeof v === 'number' && !Number.isNaN(v) ? v : 0
}

/**
 * CAGR % from 2026 to 2033. Returns 0 if start value ≤ 0 or data missing.
 */
export function cagrPercent2026To2033(ts: Record<number, number> | undefined): number {
  const v0 = timeSeriesGet(ts, CAGR_VALUE_YEAR)
  const v1 = timeSeriesGet(ts, CAGR_END_YEAR)
  if (v0 <= 0 || CAGR_YEAR_SPAN <= 0) return 0
  return (Math.pow(v1 / v0, 1 / CAGR_YEAR_SPAN) - 1) * 100
}
