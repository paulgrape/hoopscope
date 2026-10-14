export const SCORE_HEADER_STICKY_TOP_PX = 56
export const SCORE_HEADER_COLLAPSE_DISTANCE_PX = SCORE_HEADER_STICKY_TOP_PX * 2

/** 0 while the sentinel is at or below the sticky line, 1 after `distance` pixels of scroll. */
export function collapseProgress(sentinelTop: number, stickyTop: number, distance: number) {
  if (!(distance > 0)) return sentinelTop <= stickyTop ? 1 : 0
  return Math.min(1, Math.max(0, (stickyTop - sentinelTop) / distance))
}

/** Reduced motion snaps at the midpoint instead of scrubbing intermediate frames. */
export function snappedCollapse(progress: number, reduceMotion: boolean) {
  if (!reduceMotion) return progress
  return progress > 0.5 ? 1 : 0
}

/** Padding that pulls edge-aligned clusters into the center as collapse reaches 1. */
export function centerInset(clientWidth: number, packedWidth: number) {
  return Math.max(0, (clientWidth - packedWidth) / 2)
}
