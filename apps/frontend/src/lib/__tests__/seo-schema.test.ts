import {breadcrumbSchema, sportsEventSchema, webPageSchema} from '@/lib/seo-schema'
import {describe, expect, it} from 'vitest'

describe('sportsEventSchema', () => {
  const baseEvent = {
    id: 'game-1',
    name: 'Lakers at Celtics',
    date: '2026-01-01T00:00:00Z',
    homeTeam: 'Celtics',
    awayTeam: 'Lakers',
    homeScore: 110,
    awayScore: 102
  }

  it('marks finished games as EventCompleted', () => {
    const schema = sportsEventSchema({...baseEvent, status: 'final'})
    expect(schema.eventStatus).toBe('https://schema.org/EventCompleted')
  })

  it('marks other games as EventScheduled', () => {
    const schema = sportsEventSchema({...baseEvent, status: 'live'})
    expect(schema.eventStatus).toBe('https://schema.org/EventScheduled')
  })

  it('builds the event URL from the id by default', () => {
    const schema = sportsEventSchema({...baseEvent, status: 'final'})
    expect(schema.url).toContain('/historic-games/game-1')
  })
})

describe('webPageSchema', () => {
  it('produces an absolute page URL', () => {
    const schema = webPageSchema({
      path: '/standings',
      title: 'Standings',
      description: 'Conference standings'
    })

    expect(schema['@type']).toBe('WebPage')
    expect(String(schema.url)).toMatch(/^https?:\/\/.+\/standings$/)
  })
})

describe('breadcrumbSchema', () => {
  it('numbers breadcrumb positions from 1', () => {
    const schema = breadcrumbSchema([
      {name: 'Teams', path: '/teams'},
      {name: 'Celtics', path: '/teams/2'}
    ])

    const items = schema.itemListElement as Array<{position: number; name: string}>
    expect(items.map(item => item.position)).toEqual([1, 2])
    expect(items[1].name).toBe('Celtics')
  })
})
