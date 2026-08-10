'use client'

import type {TeamSummary} from '@/lib/teams-api'
import {SearchIcon} from 'lucide-react'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {useEffect, useState, useTransition} from 'react'

const SEARCH_DEBOUNCE_MS = 300

type PlayerSearchControlsProps = {
  teams: TeamSummary[]
  query: string
  teamId: string
}

export function PlayerSearchControls({teams, query, teamId}: PlayerSearchControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [draftQuery, setDraftQuery] = useState(query)

  // Follow back/forward navigation: adopt the committed query during render
  // instead of through a cascading effect.
  const [committedQuery, setCommittedQuery] = useState(query)
  if (query !== committedQuery) {
    setCommittedQuery(query)
    setDraftQuery(query)
  }

  function replaceFilters(params: URLSearchParams) {
    const nextQuery = params.toString()
    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {scroll: false})
    })
  }

  useEffect(() => {
    const trimmed = draftQuery.trim()
    if (trimmed === query) return

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (trimmed) {
        params.set('q', trimmed)
      } else {
        params.delete('q')
      }

      const nextQuery = params.toString()
      startTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {scroll: false})
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [draftQuery, pathname, query, router, searchParams])

  function selectTeam(nextTeamId: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (nextTeamId) {
      params.set('teamId', nextTeamId)
    } else {
      params.delete('teamId')
    }

    replaceFilters(params)
  }

  return (
    <form
      role='search'
      className='flex flex-col gap-3 sm:flex-row sm:items-end'
      onSubmit={event => event.preventDefault()}
    >
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <label
          htmlFor='player-search'
          className='text-muted-foreground text-sm'
        >
          Search by name
        </label>
        <div className='relative'>
          <SearchIcon
            aria-hidden='true'
            className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
          />
          <input
            id='player-search'
            type='search'
            value={draftQuery}
            onChange={event => setDraftQuery(event.target.value)}
            placeholder='e.g. Jokic'
            autoComplete='off'
            className='bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-lg border py-2 pr-3 pl-9 text-sm focus-visible:ring-3 focus-visible:outline-none'
          />
        </div>
      </div>

      <div className='flex flex-col gap-1.5 sm:w-64'>
        <label
          htmlFor='player-team'
          className='text-muted-foreground text-sm'
        >
          Team
        </label>
        <select
          id='player-team'
          value={teamId}
          onChange={event => selectTeam(event.target.value)}
          className='bg-background border-border text-foreground focus-visible:ring-ring/50 rounded-lg border px-3 py-2 text-sm focus-visible:ring-3 focus-visible:outline-none'
        >
          <option value=''>All teams</option>
          {teams.map(team => (
            <option
              key={team.id}
              value={team.id}
            >
              {team.displayName}
            </option>
          ))}
        </select>
      </div>

      <p
        aria-live='polite'
        className='sr-only'
      >
        {isPending ? 'Updating player results.' : ''}
      </p>
    </form>
  )
}
