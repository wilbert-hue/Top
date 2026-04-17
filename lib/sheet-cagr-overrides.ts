/**
 * CAGR (%), 2026→2033, copied from the Excel "Value" and "Volume" pivot sheets.
 * Used when time series are proportionally scaled so computed CAGR would be identical for every line.
 */

const VALUE_SPECIALTY: Record<string, number> = {
  'Fine Art & Antiques Moving': 7.5,
  'Pet Relocation & Animal Transport': 7.5,
  'Laboratory & Biotech Equipment Moves': 5.3,
  'Medical & Hospital Equipment Relocation': 5.2,
  'Industrial & Manufacturing Equipment Moves': 5.4,
  'Trade Show & Exhibition Logistics': 5.4,
  'Museum & Cultural Institution Relocation': 3.8,
  'Film, TV & Entertainment Production Moves': 5.1,
  'Renewable Energy Equipment & Battery Transport': 8.8,
  'Luxury Retail Store Fixtures & Visual Merchandising Moves': 4.1,
}

const VALUE_REGION: Record<string, number> = {
  Northeast: 4.8,
  Southeast: 5.6,
  Midwest: 5.2,
  West: 8.4,
  Southwest: 10.3,
}

const VOLUME_SPECIALTY: Record<string, number> = {
  'Fine Art & Antiques Moving': 4.3,
  'Pet Relocation & Animal Transport': 6.1,
  'Laboratory & Biotech Equipment Moves': 4.6,
  'Medical & Hospital Equipment Relocation': 3.5,
  'Industrial & Manufacturing Equipment Moves': 4.0,
  'Trade Show & Exhibition Logistics': 4.6,
  'Museum & Cultural Institution Relocation': 2.3,
  'Film, TV & Entertainment Production Moves': 4.0,
  'Renewable Energy Equipment & Battery Transport': 6.6,
  'Luxury Retail Store Fixtures & Visual Merchandising Moves': 3.6,
}

const VOLUME_REGION: Record<string, number> = {
  Northeast: 3.9,
  Southeast: 4.9,
  Midwest: 4.0,
  West: 6.1,
  Southwest: 9.1,
}

/**
 * Returns sheet CAGR % if this segment has an authoritative override; otherwise null.
 */
export function getSheetCagrPercent(
  segmentType: string,
  segment: string,
  dataType: 'value' | 'volume'
): number | null {
  if (segmentType === 'By Specialty Move Types') {
    const map = dataType === 'value' ? VALUE_SPECIALTY : VOLUME_SPECIALTY
    return map[segment] ?? null
  }
  if (segmentType === 'By US Region') {
    const map = dataType === 'value' ? VALUE_REGION : VOLUME_REGION
    return map[segment] ?? null
  }
  return null
}
