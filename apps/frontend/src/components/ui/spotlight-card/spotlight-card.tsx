import React, {useRef} from 'react'

import {cn} from '@/shared/lib/utils'
import './spotlight-card.css'

interface SpotlightCardProps extends React.ComponentPropsWithoutRef<'div'> {
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.25)',
  onMouseMove,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null)

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = e => {
    if (!divRef.current) return

    const rect = divRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    divRef.current.style.setProperty('--mouse-x', `${x}px`)
    divRef.current.style.setProperty('--mouse-y', `${y}px`)
    divRef.current.style.setProperty('--spotlight-color', spotlightColor)
    onMouseMove?.(e)
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={cn('card-spotlight', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export default SpotlightCard
