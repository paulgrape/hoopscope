'use client'

import {PlayerCareerStats} from '@/components/players/player-career-stats'
import {PlayerNewsSection} from '@/components/players/player-news-section'
import {PlayerSeasonStats} from '@/components/players/player-season-stats'
import {ShotHeatmapCourt} from '@/components/players/shot-heatmap-court'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import type {PlayerCareerSeasonStats, PlayerNewsArticle, PlayerSeasonStatsResponse} from '@/lib/players-api'
import type {ShotHeatmapResponse} from '@/lib/shots-api'

type PlayerProfileTabsProps = {
  regularStats: PlayerSeasonStatsResponse
  playoffStats: PlayerSeasonStatsResponse
  careerSeasons: PlayerCareerSeasonStats[]
  news: PlayerNewsArticle[]
  espnNewsHref: string
  heatmap?: ShotHeatmapResponse | null
}

export function PlayerProfileTabs({
  regularStats,
  playoffStats,
  careerSeasons,
  news,
  espnNewsHref,
  heatmap = null
}: PlayerProfileTabsProps) {
  return (
    <Tabs
      defaultValue='stats'
      className='w-full min-w-0 gap-5 sm:gap-6'
    >
      <TabsList className='w-full sm:w-fit'>
        <TabsTrigger
          value='stats'
          className='flex-1 sm:flex-none'
        >
          Stats
        </TabsTrigger>
        {heatmap ? (
          <TabsTrigger
            value='heatmap'
            className='flex-1 sm:flex-none'
          >
            Heatmap
          </TabsTrigger>
        ) : null}
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

      {heatmap ? (
        <TabsContent
          value='heatmap'
          keepMounted={false}
          className='flex min-w-0 flex-col gap-3 overflow-x-auto'
        >
          <p className='text-muted-foreground text-sm'>
            {heatmap.season} {heatmap.seasonType} — shrink-adjusted FG% vs zone league average (blue below / red above);
            brightness is volume.
          </p>
          <ShotHeatmapCourt
            shots={heatmap.shots}
            leagueZones={heatmap.leagueZones}
          />
        </TabsContent>
      ) : null}

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
