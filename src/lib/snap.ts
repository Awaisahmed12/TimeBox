export const SNAP_MIN = 15
export const PX_PER_MIN = 16 / 15

export function snapToQuarterHour(min: number): number {
  return Math.round(min / SNAP_MIN) * SNAP_MIN
}

export function pxFromMin(min: number): number {
  return min * PX_PER_MIN
}

export function minFromPx(px: number): number {
  return Math.round(px / PX_PER_MIN)
}

export function snappedMinFromPx(px: number): number {
  return snapToQuarterHour(minFromPx(px))
}
