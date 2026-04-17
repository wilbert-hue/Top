/**
 * Display labels for segment type keys stored in JSON.
 * Internal keys avoid collisions with legacy "By Region" geography logic.
 */
const SEGMENT_TYPE_DISPLAY_LABELS: Record<string, string> = {
  'By US Region': 'By Region',
}

export function segmentTypeDisplayLabel(segmentType: string): string {
  return SEGMENT_TYPE_DISPLAY_LABELS[segmentType] ?? segmentType
}
