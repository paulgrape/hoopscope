import {PlayerPageHeader} from '@/components/players/player-page-header'
import type {PlayerProfile} from '@/lib/players-api'
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('next/image', () => ({
  default: ({alt, src}: {alt: string; src: string}) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
    />
  )
}))

function makePlayer(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    id: '3112335',
    fullName: 'Nikola Jokic',
    jersey: '15',
    position: 'C',
    headshot: 'https://headshot/jokic.png',
    age: 31,
    height: '6\' 11"',
    weight: '284 lbs',
    birthPlace: 'Sombor, Serbia',
    experience: 10,
    college: null,
    active: true,
    status: 'Active',
    latestTeam: {id: '9', abbreviation: 'DEN', displayName: 'Denver Nuggets'},
    injury: null,
    ...overrides
  }
}

describe('PlayerPageHeader', () => {
  it('shows the player name, photo, and team abbreviation link', () => {
    render(<PlayerPageHeader player={makePlayer()} />)

    expect(screen.getByRole('heading', {level: 1, name: 'Nikola Jokic'})).toBeInTheDocument()
    expect(screen.getByRole('img', {name: 'Nikola Jokic'})).toHaveAttribute('src', 'https://headshot/jokic.png')
    expect(screen.getByRole('link', {name: 'DEN', hidden: true})).toHaveAttribute('href', '/teams/9')
  })

  it('omits the abbreviation when the player has no team', () => {
    render(<PlayerPageHeader player={makePlayer({latestTeam: null})} />)

    expect(screen.queryByRole('link', {name: 'DEN', hidden: true})).not.toBeInTheDocument()
  })

  it('shows the injury badge, comment, and expected return', () => {
    render(
      <PlayerPageHeader
        player={makePlayer({
          injury: {
            status: 'Out',
            type: 'Foot',
            detail: 'James (foot) will be re-evaluated in four weeks.',
            returnDate: '2026-12-12'
          }
        })}
      />
    )

    expect(screen.getByText('Out · Foot')).toBeInTheDocument()
    expect(screen.getByText('James (foot) will be re-evaluated in four weeks.')).toBeInTheDocument()
    expect(screen.getByText('Expected return:')).toBeInTheDocument()
    expect(screen.getByText('Dec 12, 2026')).toBeInTheDocument()
  })
})
