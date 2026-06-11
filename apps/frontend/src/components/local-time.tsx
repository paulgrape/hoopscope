'use client'

import { useEffect, useState } from 'react'

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}

const EDITION_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}

/**
 * Formats on the server first (server timezone), then re-renders after
 * hydration so the visitor sees the date in their own timezone.
 */
function useLocalFormat(format: () => string) {
  const [value, setValue] = useState(format)

  useEffect(() => {
    setValue(format())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return value
}

export function LocalTime({ iso, className }: { iso: string; className?: string }) {
  const value = useLocalFormat(() => new Date(iso).toLocaleString('en-US', TIME_FORMAT))

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {value}
    </time>
  )
}

export function LocalEditionDate() {
  const value = useLocalFormat(() => new Date().toLocaleDateString('en-US', EDITION_DATE_FORMAT))

  return <span suppressHydrationWarning>{value}</span>
}
