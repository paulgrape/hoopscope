'use client'

import {cn} from '@/lib/utils'
import {type ReactNode, useState} from 'react'

type ChangedValueProps = {
  value: string | number | null
  variant?: 'score' | 'text'
  className?: string
  children: ReactNode
}

type ChangeState = {
  value: string | number | null
  generation: number
  playing: boolean
}

export function ChangedValue({value, variant = 'score', className, children}: ChangedValueProps) {
  const [change, setChange] = useState<ChangeState>({value, generation: 0, playing: false})

  if (!Object.is(change.value, value)) {
    setChange({value, generation: change.generation + 1, playing: true})
  }

  return (
    <span
      key={change.generation}
      className={cn(
        variant === 'score' ? '-mx-0.5 inline-block rounded-sm px-0.5 tabular-nums' : 'inline-block',
        className,
        change.playing && (variant === 'score' ? 'animate-score-flash' : 'animate-text-arrive')
      )}
      onAnimationEnd={event => {
        if (event.target !== event.currentTarget) return
        setChange(current => (current.playing ? {...current, playing: false} : current))
      }}
    >
      {children}
    </span>
  )
}
