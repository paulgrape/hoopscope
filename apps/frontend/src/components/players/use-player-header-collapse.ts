'use client'

import {
  SCORE_HEADER_COLLAPSE_DISTANCE_PX,
  SCORE_HEADER_STICKY_TOP_PX,
  collapseProgress,
  snappedCollapse
} from '@/components/match/score-header-collapse'
import {useLayoutEffect, useRef} from 'react'

const PHONE_QUERY = '(max-width: 639px)'

function readCssPx(value: string, fallback: number) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function setPx(el: HTMLElement, name: string, value: number) {
  const next = Math.round(value * 100) / 100
  const current = readCssPx(el.style.getPropertyValue(name), Number.NaN)
  if (Number.isFinite(current) && Math.abs(current - next) <= 0.5) return
  el.style.setProperty(name, `${next}px`)
}

function setGone(el: HTMLElement | null, gone: boolean) {
  if (!el) return
  el.setAttribute('aria-hidden', gone ? 'true' : 'false')
  el.inert = gone
}

export function usePlayerHeaderCollapse() {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  const detailsInnerRef = useRef<HTMLDivElement>(null)
  const metaInnerRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const abbrRef = useRef<HTMLAnchorElement>(null)

  useLayoutEffect(() => {
    const sentinel = sentinelRef.current
    const bar = barRef.current
    const row = rowRef.current
    const photo = photoRef.current
    const name = nameRef.current
    if (!sentinel || !bar || !row || !photo || !name) return

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
      bar.style.boxShadow = `0 1px 2px rgb(0 0 0 / ${progress * 0.12})`

      const phone = phoneQuery?.matches ?? false
      const gone = progress >= 0.45
      setGone(detailsRef.current, progress >= (phone ? 0.25 : 0.45))
      setGone(metaRef.current, gone)
      setGone(abbrRef.current, !gone)

      const detailsInner = detailsInnerRef.current
      const metaInner = metaInnerRef.current
      if (detailsInner && detailsInner.offsetHeight > 0) setPx(bar, '--details-h', detailsInner.offsetHeight)
      if (metaInner && metaInner.offsetHeight > 0) setPx(bar, '--meta-h', metaInner.offsetHeight)

      if (!phone) {
        row.style.height = ''
        row.style.overflow = ''
        setPx(bar, '--shift-x', 0)
        setPx(bar, '--shift-y', 0)
        bar.style.setProperty('--name-max', '100%')
        return
      }

      const rowStyle = getComputedStyle(row)
      const padRight = readCssPx(rowStyle.paddingRight, 0)
      const padBottom = readCssPx(rowStyle.paddingBottom, 0)
      const padTop = readCssPx(rowStyle.paddingTop, 0)
      const gap = readCssPx(rowStyle.rowGap, 0)
      const desired = photo.offsetLeft + photo.offsetWidth + gap
      const nameMax = Math.max(0, row.clientWidth - padRight - desired)
      bar.style.setProperty('--name-max', `${Math.round(nameMax)}px`)

      const maxLeft = Math.max(photo.offsetLeft, row.clientWidth - padRight - name.offsetWidth)
      const left = Math.min(desired, maxLeft)
      setPx(bar, '--shift-x', left - name.offsetLeft)
      setPx(bar, '--shift-y', photo.offsetTop + (photo.offsetHeight - name.offsetHeight) / 2 - name.offsetTop)

      const copy = name.parentElement
      const stackBottom = Math.max(
        photo.offsetTop + photo.offsetHeight,
        copy ? copy.offsetTop + copy.offsetHeight : 0,
        name.offsetTop + name.offsetHeight
      )
      setPx(bar, '--stack-h', stackBottom + padBottom)
      setPx(bar, '--row-h', Math.max(photo.offsetHeight, name.offsetHeight) + padTop + padBottom)
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

  return {
    sentinelRef,
    barRef,
    rowRef,
    photoRef,
    nameRef,
    detailsInnerRef,
    metaInnerRef,
    detailsRef,
    metaRef,
    abbrRef
  }
}
