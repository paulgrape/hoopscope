import {getNews} from '@/lib/news-api'
import type {ConferenceStandings, StandingTeam} from '@/lib/standings-api'
import {getStandings} from '@/lib/standings-api'
import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import Home from '../page'

vi.mock('@/lib/standings-api', () => ({
  getStandings: vi.fn()
}))

vi.mock('@/lib/news-api', () => ({
  getNews: vi.fn()
}))

vi.mock('@/components/match/todays-scores', () => ({
  TodaysScores: () => <div data-testid='todays-scores' />
}))

vi.mock('@/components/seo/json-ld', () => ({
  JsonLd: () => null
}))

vi.mock('next/image', () => ({
  default: ({alt, src}: {alt: string; src: string}) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
    />
  )
}))

function makeTeam(overrides: Partial<StandingTeam> = {}): StandingTeam {
  return {
    id: '2',
    displayName: 'Boston Celtics',
    shortName: 'Celtics',
    abbreviation: 'BOS',
    logo: 'https://logo/bos.png',
    color: '007A33',
    seed: 1,
    wins: 40,
    losses: 12,
    winPct: '.769',
    gamesBehind: '-',
    streak: 'W3',
    home: '22-4',
    road: '18-8',
    vsDiv: '8-2',
    vsConf: '25-7',
    lastTen: '8-2',
    clincher: null,
    playoffStatus: 'playoff',
    ...overrides
  }
}

function makeConference(overrides: Partial<ConferenceStandings> = {}): ConferenceStandings {
  return {
    id: 'east',
    name: 'Eastern Conference',
    abbreviation: 'EAST',
    teams: [makeTeam()],
    ...overrides
  }
}

describe('Home', () => {
  beforeEach(() => {
    vi.mocked(getStandings).mockReset()
    vi.mocked(getNews).mockReset()
  })

  it('renders scores, a standings snapshot, and headlines with links to the full pages', async () => {
    vi.mocked(getStandings).mockResolvedValue({season: '2025-26', conferences: [makeConference()]})
    vi.mocked(getNews).mockResolvedValue({
      total: 30,
      articles: [
        {
          id: 1,
          type: 'Story',
          headline: 'Celtics clinch the top seed',
          description: 'Boston wraps up home court.',
          published: '2026-04-01T12:00:00Z',
          imageUrl: null,
          imageCaption: null,
          url: 'https://espn.com/story',
          byline: 'ESPN',
          teams: ['BOS']
        }
      ]
    })

    render(await Home())

    expect(getNews).toHaveBeenCalledWith(4, 0)
    expect(screen.getByTestId('todays-scores')).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: 'Scoreboard'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: 'Standings'})).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: 'Latest headlines'})).toBeInTheDocument()
    expect(screen.getByText('2025-26')).toBeInTheDocument()

    expect(screen.getByRole('link', {name: /Full schedule/})).toHaveAttribute('href', '/match-center')
    expect(screen.getByRole('link', {name: /Full standings/})).toHaveAttribute('href', '/standings')
    expect(screen.getByRole('link', {name: /All news/})).toHaveAttribute('href', '/news')

    expect(screen.getByRole('link', {name: 'Celtics'})).toHaveAttribute('href', '/teams/2')
    expect(screen.getByRole('heading', {level: 3, name: 'Celtics clinch the top seed'})).toBeInTheDocument()
  })

  it('keeps the dashboard usable when standings and news fail', async () => {
    vi.mocked(getStandings).mockRejectedValue(new Error('standings down'))
    vi.mocked(getNews).mockRejectedValue(new Error('news down'))

    render(await Home())

    expect(screen.getByTestId('todays-scores')).toBeInTheDocument()
    expect(screen.getByText('Standings are unavailable right now.')).toBeInTheDocument()
    expect(screen.getByText('No NBA headlines available right now.')).toBeInTheDocument()
  })
})
