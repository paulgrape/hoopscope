import {type BoxScoreLine, BoxScoreTable} from '@/components/match/box-score-table'
import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

function makeLine(overrides: Partial<BoxScoreLine> & {id: string; name: string}): BoxScoreLine {
  return {
    href: null,
    meta: null,
    starter: false,
    minutes: '20',
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
    fieldGoals: '0-0',
    threePointers: '0-0',
    freeThrows: '0-0',
    ...overrides
  }
}

const LINES: BoxScoreLine[] = [
  makeLine({id: '1', name: 'Anthony Davis', starter: true, minutes: '36', points: 20, rebounds: 4, assists: 2}),
  makeLine({
    id: '2',
    name: 'LeBron James',
    starter: true,
    minutes: '34',
    points: 24,
    rebounds: 12,
    assists: 9,
    turnovers: 3,
    fieldGoals: '9-18',
    threePointers: '2-6'
  }),
  makeLine({id: '3', name: 'Austin Reaves', minutes: '18', points: 8, rebounds: 9, assists: 1})
]

function playerOrder() {
  return screen.getAllByRole('rowheader').map(cell => cell.textContent?.trim())
}

describe('BoxScoreTable', () => {
  it('keeps the given order and splits players into starters and bench', () => {
    render(
      <BoxScoreTable
        lines={LINES}
        emptyMessage='No box score yet.'
        showLineupGroups
      />
    )

    expect(screen.getByText('Starters')).toBeInTheDocument()
    expect(screen.getByText('Bench')).toBeInTheDocument()
    expect(playerOrder()).toEqual(['Anthony Davis', 'LeBron James', 'Austin Reaves'])
  })

  it('omits the lineup groups when the caller has no starter information', () => {
    render(
      <BoxScoreTable
        lines={LINES.map(line => ({...line, starter: false}))}
        emptyMessage='No box score yet.'
      />
    )

    expect(screen.queryByText('Starters')).not.toBeInTheDocument()
    expect(screen.queryByText('Bench')).not.toBeInTheDocument()
  })

  it('leaves the columns unsortable', () => {
    render(
      <BoxScoreTable
        lines={LINES}
        emptyMessage='No box score yet.'
        showLineupGroups
      />
    )

    for (const header of screen.getAllByRole('columnheader')) {
      expect(within(header).queryByRole('button')).not.toBeInTheDocument()
    }
  })

  it('expands a row to reveal the stats hidden on small screens', async () => {
    render(
      <BoxScoreTable
        lines={LINES}
        emptyMessage='No box score yet.'
      />
    )

    const toggle = screen.getByRole('button', {name: /more stats for LeBron James/i})
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const detail = document.getElementById('box-score-detail-2')
    expect(detail).not.toBeNull()
    expect(within(detail as HTMLElement).getByText('9-18')).toBeInTheDocument()
    expect(within(detail as HTMLElement).getByText('2-6')).toBeInTheDocument()

    await userEvent.click(toggle)
    expect(document.getElementById('box-score-detail-2')).toBeNull()
  })

  it('hides the minutes column when minutes are unavailable', () => {
    render(
      <BoxScoreTable
        lines={LINES}
        emptyMessage='No box score yet.'
        showMinutes={false}
      />
    )

    expect(screen.queryByRole('columnheader', {name: 'MIN'})).not.toBeInTheDocument()
  })

  it('renders the empty message instead of a table', () => {
    render(
      <BoxScoreTable
        lines={[]}
        emptyMessage='No box score yet.'
      />
    )

    expect(screen.getByText('No box score yet.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
