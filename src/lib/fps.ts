export interface FpsPreset {
  label: string;
  source: number;
  target: number;
}

/** Common frame rates people actually hit. */
export const FPS_VALUES = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60] as const;

/** The frame-rate conversions that cause the great majority of subtitle drift. */
export const FPS_PRESETS: FpsPreset[] = [
  { label: '23.976 → 25 (PAL speed-up)', source: 23.976, target: 25 },
  { label: '25 → 23.976 (PAL slow-down)', source: 25, target: 23.976 },
  { label: '23.976 → 24', source: 23.976, target: 24 },
  { label: '24 → 23.976', source: 24, target: 23.976 },
  { label: '24 → 25', source: 24, target: 25 },
  { label: '25 → 24', source: 25, target: 24 },
  { label: '25 → 29.97', source: 25, target: 29.97 },
  { label: '29.97 → 25', source: 29.97, target: 25 },
  { label: '23.976 → 29.97', source: 23.976, target: 29.97 },
  { label: '29.97 → 23.976', source: 29.97, target: 23.976 },
];
