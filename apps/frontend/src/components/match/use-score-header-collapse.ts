'use client'

import {useLayoutEffect, useRef} from 'react'

import {
  SCORE_HEADER_COLLAPSE_DISTANCE_PX,
  SCORE_HEADER_STICKY_TOP_PX,
  centerInset,
  collapseProgress,
  snappedCollapse
} from './score-header-collapse'

const PHONE_QUERY = '(max-width: 767px)'
const PHONE_PAD_PX = 12

function readCssPx(value: string, fallback: number) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function piece(root: HTMLElement, name: string) {
  return root.querySelector<HTMLElement>(`[data-piece="${name}"]`)
}

function marginEnd(el: HTMLElement) {
  return readCssPx(getComputedStyle(el).marginRight, 0)
}

/** Logo, abbreviation, and score, plus the gaps between them. Excludes the spread spacer. */
function packedWidth(root: HTMLElement) {
  const parts = ['logo', 'name', 'score'].map(name => piece(root, name)).filter((el): el is HTMLElement => el !== null)
  return parts.reduce((sum, el) => sum + el.offsetWidth + marginEnd(el), 0)
}

function setPx(el: HTMLElement, name: string, value: number) {
  const next = Math.round(value * 100) / 100
  const current = readCssPx(el.style.getPropertyValue(name), Number.NaN)
  if (Number.isFinite(current) && Math.abs(current - next) <= 0.5) return
  el.style.setProperty(name, `${next}px`)
}

export function useScoreHeaderCollapse() {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const awayRef = useRef<HTMLDivElement>(null)
  const homeRef = useRef<HTMLDivElement>(null)
  const sepRef = useRef<HTMLDivElement>(null)
  const awaySpacerRef = useRef<HTMLSpanElement>(null)
  const homeSpacerRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const sentinel = sentinelRef.current
    const bar = barRef.current
    const row = rowRef.current
    if (!sentinel || !bar || !row) return

    let frame = 0
    const phoneQuery = typeof window.matchMedia === 'function' ? window.matchMedia(PHONE_QUERY) : null

    const write = () => {
      const stickyTop = readCssPx(getComputedStyle(bar).top, SCORE_HEADER_STICKY_TOP_PX)
      const distance = stickyTop > 0 ? stickyTop * 2 : SCORE_HEADER_COLLAPSE_DISTANCE_PX
      const progress = snappedCollapse(
        collapseProgress(sentinel.getBoundingClientRect().top, stickyTop, distance),
        prefersReducedMotion()
      )
      bar.style.setProperty('--collapse', String(progress))
      bar.style.backgroundColor = `color-mix(in oklab, var(--background) calc(${progress} * 100%), var(--card))`
      bar.style.borderBottomColor = `color-mix(in oklab, var(--border) calc(${progress} * 100%), transparent)`
      bar.style.boxShadow = `0 1px 2px rgb(0 0 0 / ${progress * 0.12})`

      const away = awayRef.current
      const home = homeRef.current
      const sep = sepRef.current
      if (!away || !home || !sep) return

      const phone = phoneQuery?.matches ?? false
      const awayPacked = packedWidth(away)
      const homePacked = packedWidth(home)
      const rowGap = readCssPx(getComputedStyle(row).columnGap, 0) || readCssPx(getComputedStyle(row).rowGap, 0)

      if (!phone) {
        row.style.height = ''
        row.style.overflow = ''
        const spread = centerInset(row.clientWidth, awayPacked + homePacked + sep.offsetWidth + rowGap * 2)
        setPx(bar, '--spread', spread)
        setPx(bar, '--phone-spread', 0)
        setPx(bar, '--away-shift-x', 0)
        setPx(bar, '--away-shift-y', 0)
        setPx(bar, '--home-shift-x', 0)
        setPx(bar, '--home-shift-y', 0)
        setPx(bar, '--sep-shift-x', 0)
        setPx(bar, '--sep-shift-y', 0)

        const homeLogo = piece(home, 'logo')
        const homeName = piece(home, 'name')
        const logoW = homeLogo?.offsetWidth ?? 0
        const nameW = homeName?.offsetWidth ?? 0
        const gap = homeLogo ? marginEnd(homeLogo) : 12
        // Rest shows name then logo; collapse 1 leaves the DOM order (logo then name).
        setPx(bar, '--home-logo-slide', nameW + gap)
        setPx(bar, '--home-name-slide', -(logoW + gap))
        setPx(bar, '--home-score-slide', 0)
        return
      }

      setPx(bar, '--away-packed', awayPacked)
      setPx(bar, '--home-packed', homePacked)
      const phoneSpread = Math.max(0, row.clientWidth - PHONE_PAD_PX * 2 - awayPacked)
      setPx(bar, '--spread', phoneSpread)
      setPx(bar, '--phone-spread', phoneSpread)

      const homeScore = piece(home, 'score')
      const scoreW = homeScore?.offsetWidth ?? 0
      const scoreGap = homeScore ? marginEnd(homeScore) : 0
      // DOM order is the compact row. These offsets park the pieces in the stacked chip at rest.
      setPx(bar, '--home-score-slide', homeScore ? row.clientWidth - scoreW - PHONE_PAD_PX * 2 : 0)
      setPx(bar, '--home-logo-slide', homeScore ? -(scoreW + scoreGap) : 0)
      setPx(bar, '--home-name-slide', homeScore ? -(scoreW + scoreGap) : 0)

      const total = awayPacked + homePacked + sep.offsetWidth + rowGap * 2
      const start = Math.max(0, (row.clientWidth - total) / 2)
      const homeLeft = start + awayPacked + rowGap + sep.offsetWidth + rowGap
      const maxHomeLeft = Math.max(0, row.clientWidth - homePacked)
      const clampedHomeLeft = Math.min(homeLeft, maxHomeLeft)
      const sepLeft = start + awayPacked + rowGap
      const maxSepLeft = Math.max(0, clampedHomeLeft - rowGap - sep.offsetWidth)
      setPx(bar, '--away-shift-x', start - away.offsetLeft)
      setPx(bar, '--away-shift-y', 0)
      setPx(bar, '--home-shift-x', clampedHomeLeft - home.offsetLeft)
      setPx(bar, '--home-shift-y', away.offsetTop + (away.offsetHeight - home.offsetHeight) / 2 - home.offsetTop)
      setPx(bar, '--sep-shift-x', Math.min(sepLeft, maxSepLeft) - sep.offsetLeft)
      setPx(bar, '--sep-shift-y', away.offsetTop + (away.offsetHeight - sep.offsetHeight) / 2 - sep.offsetTop)

      const padTop = readCssPx(getComputedStyle(row).paddingTop, 0)
      const padBottom = readCssPx(getComputedStyle(row).paddingBottom, 0)
      setPx(bar, '--stack-h', home.offsetTop + home.offsetHeight + padBottom)
      setPx(bar, '--row-h', Math.max(away.offsetHeight, home.offsetHeight, sep.offsetHeight) + padTop + padBottom)
      row.style.overflow = 'hidden'
      row.style.height = 'calc((1 - var(--collapse)) * var(--stack-h) + var(--collapse) * var(--row-h))'
    }

    const requestWrite = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        write()
      })
    }

    write()

    window.addEventListener('scroll', requestWrite, {passive: true})
    window.addEventListener('resize', requestWrite)
    if (phoneQuery && typeof phoneQuery.addEventListener === 'function') {
      phoneQuery.addEventListener('change', requestWrite)
    }

    const motion =
      typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    if (motion && typeof motion.addEventListener === 'function') {
      motion.addEventListener('change', requestWrite)
    }

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(requestWrite)
      observer.observe(row)
    }

    return () => {
      window.removeEventListener('scroll', requestWrite)
      window.removeEventListener('resize', requestWrite)
      if (phoneQuery && typeof phoneQuery.removeEventListener === 'function') {
        phoneQuery.removeEventListener('change', requestWrite)
      }
      if (motion && typeof motion.removeEventListener === 'function') {
        motion.removeEventListener('change', requestWrite)
      }
      observer?.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return {sentinelRef, barRef, rowRef, awayRef, homeRef, sepRef, awaySpacerRef, homeSpacerRef}
}
