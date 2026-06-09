import {type ClassValue, clsx} from 'clsx'
import {twMerge} from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface RGB {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): RGB | null {
  let cleanHex = hex.replace(/^#/, '')

  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map(char => char + char)
      .join('')
  }

  if (cleanHex.length !== 6) {
    return null
  }

  const num = parseInt(cleanHex, 16)

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  }
}

type SpotlightColor = `rgba(${number}, ${number}, ${number}, ${number})`

function boostRgb({r, g, b}: RGB, amount: number): RGB {
  return {
    r: Math.round(r + (255 - r) * amount),
    g: Math.round(g + (255 - g) * amount),
    b: Math.round(b + (255 - b) * amount)
  }
}

export function getSpotlightColor(
  hex: string,
  alternateHex: string | null,
  theme: string | undefined
): SpotlightColor | null {
  let chosenHex = hex
  if (alternateHex) {
    const luminance = getLuminance(hex)
    const alternateLuminance = getLuminance(alternateHex)

    if (alternateLuminance > luminance) {
      if (theme === 'dark') {
        chosenHex = alternateHex
      }
    } else {
      if (theme === 'light') {
        chosenHex = alternateHex
      }
    }
  }

  const rgb = hexToRgb(chosenHex)
  if (!rgb) return null

  const isDark = theme === 'dark'
  const {r, g, b} = isDark ? rgb : boostRgb(rgb, 0.3)
  const alpha = isDark ? 0.25 : 0.35

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '')

  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  return 0.299 * r + 0.587 * g + 0.114 * b
}
