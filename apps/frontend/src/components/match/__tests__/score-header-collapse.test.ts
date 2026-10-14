import {
  SCORE_HEADER_COLLAPSE_DISTANCE_PX,
  SCORE_HEADER_STICKY_TOP_PX,
  centerInset,
  collapseProgress,
  snappedCollapse
} from '@/components/match/score-header-collapse'
import {describe, expect, it} from 'vitest'

const stickyTop = SCORE_HEADER_STICKY_TOP_PX
const distance = SCORE_HEADER_COLLAPSE_DISTANCE_PX

describe('collapseProgress', () => {
  it('is 0 when the sentinel is below the pin', () => {
    expect(collapseProgress(200, stickyTop, distance)).toBe(0)
  })

  it('is 0 when the sentinel meets the pin', () => {
    expect(collapseProgress(stickyTop, stickyTop, distance)).toBe(0)
  })

  it('is halfway through the collapse distance', () => {
    expect(collapseProgress(stickyTop - distance / 2, stickyTop, distance)).toBe(0.5)
  })

  it('is fully collapsed at the end of the distance', () => {
    expect(collapseProgress(stickyTop - distance, stickyTop, distance)).toBe(1)
  })

  it('clamps past either end of the distance', () => {
    expect(collapseProgress(stickyTop - distance - 80, stickyTop, distance)).toBe(1)
    expect(collapseProgress(stickyTop + 80, stickyTop, distance)).toBe(0)
  })
})

describe('snappedCollapse', () => {
  it('keeps the scrubbed value when motion is allowed', () => {
    expect(snappedCollapse(0.25, false)).toBe(0.25)
  })

  it('snaps to the nearest end when motion is reduced', () => {
    expect(snappedCollapse(0.5, true)).toBe(0)
    expect(snappedCollapse(0.51, true)).toBe(1)
  })
})

describe('centerInset', () => {
  it('returns the padding that packs the row in the center', () => {
    expect(centerInset(400, 200)).toBe(100)
  })

  it('stays at 0 when the clusters already fill the row', () => {
    expect(centerInset(200, 240)).toBe(0)
  })
})
