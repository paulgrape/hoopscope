'use client'

import {PlayerCareerStats} from '@/components/player-career-stats'
import {PlayerNewsSection} from '@/components/player-news-section'
import {PlayerSeasonStats} from '@/components/player-season-stats'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import type {
  PlayerCareerSeasonStats,
  PlayerNewsArticle,
  PlayerSeasonStatsResponse,
} from '@/lib/players-api'

type PlayerProfileTabsProps = {
  regularStats: PlayerSeasonStatsResponse
  playoffStats: PlayerSeasonStatsResponse
  careerSeasons: PlayerCareerSeasonStats[]
  news: PlayerNewsArticle[]
  espnNewsHref: string
}

export function PlayerProfileTabs({
  regularStats,
  playoffStats,
  careerSeasons,
  news,
  espnNewsHref,
}: PlayerProfileTabsProps) {
  return (
    <Tabs
      defaultValue='stats'
      className='gap-5 sm:gap-6'
    >
      <TabsList className='w-full sm:w-fit'>
        <TabsTrigger
          value='stats'
          className='flex-1 sm:flex-none'
        >
          Stats
        </TabsTrigger>
        <TabsTrigger
          value='news'
          className='flex-1 sm:flex-none'
        >
          News
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value='stats'
        className='flex flex-col gap-5 sm:gap-6'
      >
        <PlayerSeasonStats
          regularStats={regularStats}
          playoffStats={playoffStats}
        />
        <PlayerCareerStats seasons={careerSeasons} />
      </TabsContent>

      <TabsContent
        value='news'
        keepMounted={false}
      >
        <PlayerNewsSection
          articles={news}
          moreHref={espnNewsHref}
        />
      </TabsContent>
    </Tabs>
  )
}
