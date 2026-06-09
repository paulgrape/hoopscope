'use client'

import {useTheme} from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import {useMemo} from 'react'

import SpotlightCard from '@/components/ui/spotlight-card/spotlight-card'
import {type TeamSummary} from '@/lib/teams-api'
import {getSpotlightColor} from '@/shared/lib/utils'

type TeamCardProps = {
  team: TeamSummary
}

export function TeamCard({team}: TeamCardProps) {
  const {resolvedTheme} = useTheme()
  const spotlightColor = useMemo(
    () => (team.color ? getSpotlightColor(team.color, team.alternateColor, resolvedTheme) : undefined),
    [team.color, team.alternateColor, resolvedTheme]
  )

  return (
    <SpotlightCard
      spotlightColor={spotlightColor ?? undefined}
      className='bg-card border-border hover:border-ring h-full w-full overflow-hidden rounded-xl border transition active:scale-[0.98] sm:hover:-translate-y-1'
    >
      <Link
        href={`/teams/${team.id}`}
        className='flex h-full w-full min-w-0 flex-col items-center justify-center gap-3 p-4 text-center sm:gap-4 sm:p-6'
      >
        {team.logo ? (
          <Image
            src={team.logo}
            alt={`${team.displayName} logo`}
            className='z-10 h-14 w-14 object-contain sm:h-16 sm:w-16'
            width={64}
            height={64}
          />
        ) : (
          <div className='bg-muted h-14 w-14 rounded-full sm:h-16 sm:w-16' />
        )}
        <h2 className='text-card-foreground z-10 w-full truncate text-base font-semibold sm:text-lg'>
          {team.displayName}
        </h2>
      </Link>
    </SpotlightCard>
  )
}
