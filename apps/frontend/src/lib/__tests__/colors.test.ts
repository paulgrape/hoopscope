import {getSpotlightColor, hexToRgb} from '@/lib/colors'
import {describe, expect, it} from 'vitest'

describe('hexToRgb', () => {
  it('parses 6-digit hex with or without a hash', () => {
    expect(hexToRgb('#ff0000')).toEqual({r: 255, g: 0, b: 0})
    expect(hexToRgb('00ff00')).toEqual({r: 0, g: 255, b: 0})
  })

  it('expands 3-digit shorthand', () => {
    expect(hexToRgb('#0af')).toEqual({r: 0, g: 170, b: 255})
  })

  it('returns null for invalid input', () => {
    expect(hexToRgb('#12345')).toBeNull()
    expect(hexToRgb('nope')).toBeNull()
  })
})

describe('getSpotlightColor', () => {
  it('returns an rgba color for a valid hex', () => {
    expect(getSpotlightColor('#336699', null, 'dark')).toMatch(/^rgba\(\d+, \d+, \d+, 0\.25\)$/)
    expect(getSpotlightColor('#336699', null, 'light')).toMatch(/^rgba\(\d+, \d+, \d+, 0\.35\)$/)
  })

  it('prefers the brighter color in dark mode', () => {
    const dark = getSpotlightColor('#111111', '#eeeeee', 'dark')
    // #eeeeee = rgb(238, 238, 238) used as-is in dark mode.
    expect(dark).toBe('rgba(238, 238, 238, 0.25)')
  })

  it('returns null when the chosen hex is invalid', () => {
    expect(getSpotlightColor('not-a-hex', null, 'dark')).toBeNull()
  })
})
