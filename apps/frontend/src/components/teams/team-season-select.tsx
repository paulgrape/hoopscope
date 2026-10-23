'use client'

import {formatSeasonLabel, listTeamSeasonYears} from '@/lib/teams-api'
import {ChevronDownIcon} from 'lucide-react'
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {useTransition} from 'react'

type TeamSeasonSelectProps = {
  season: number
  currentSeason: number
}

export function TeamSeasonSelect({season, currentSeason}: TeamSeasonSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const seasonYears = listTeamSeasonYears(currentSeason)

  function selectSeason(nextSeason: string) {
    const year = Number(nextSeason)
    const params = new URLSearchParams(searchParams.toString())

    if (year === currentSeason) {
      params.delete('season')
    } else {
      params.set('season', String(year))
    }

    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {scroll: false})
    })
  }

  return (
    <div className='flex w-full min-w-0 flex-col gap-1.5 sm:w-44'>
      <label
        htmlFor='team-season'
        className='text-muted-foreground text-sm'
      >
        Season
      </label>
      <div className='relative'>
        <select
          id='team-season'
          value={String(season)}
          onChange={event => selectSeason(event.target.value)}
          className='bg-background border-border text-foreground focus-visible:ring-ring/50 w-full appearance-none rounded-lg border py-2 pr-9 pl-3 text-sm focus-visible:ring-3 focus-visible:outline-none'
        >
          {seasonYears.map(year => (
            <option
              key={year}
              value={year}
            >
              {formatSeasonLabel(year)}
            </option>
          ))}
        </select>
        <ChevronDownIcon className='text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2' />
      </div>
      <p
        aria-live='polite'
        className='sr-only'
      >
        {isPending ? 'Updating season.' : ''}
      </p>
    </div>
  )
}
