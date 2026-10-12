import {ChangedValue} from '@/components/match/changed-value'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

describe('ChangedValue', () => {
  it('does not flash on the first render or when the same value is passed again', () => {
    const {rerender} = render(<ChangedValue value={10}>10</ChangedValue>)

    expect(screen.getByText('10')).not.toHaveClass('animate-score-flash')

    rerender(<ChangedValue value={10}>10</ChangedValue>)

    expect(screen.getByText('10')).not.toHaveClass('animate-score-flash')
  })

  it('flashes when the score changes', () => {
    const {rerender} = render(<ChangedValue value={10}>10</ChangedValue>)

    rerender(<ChangedValue value={12}>12</ChangedValue>)

    expect(screen.getByText('12')).toHaveClass('animate-score-flash')
    expect(screen.getByText('12')).not.toHaveClass('animate-text-arrive')
  })

  it('uses the text arrival animation for a text change', () => {
    const {rerender} = render(
      <ChangedValue
        value='Jump ball'
        variant='text'
      >
        Jump ball
      </ChangedValue>
    )

    rerender(
      <ChangedValue
        value='Layup good'
        variant='text'
      >
        Layup good
      </ChangedValue>
    )

    expect(screen.getByText('Layup good')).toHaveClass('animate-text-arrive')
    expect(screen.getByText('Layup good')).not.toHaveClass('animate-score-flash')
  })
})
