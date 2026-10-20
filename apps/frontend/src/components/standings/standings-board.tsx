'use client'

import {DivisionStandingsTables, StandingsTables} from '@/components/standings/standings-tables'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import type {ConferenceStandings} from '@/lib/standings-api'

export function StandingsBoard({conferences}: {conferences: ConferenceStandings[]}) {
  return (
    <Tabs
      defaultValue='conference'
      className='w-full min-w-0 gap-5 sm:gap-6'
    >
      <TabsList className='w-full sm:w-fit'>
        <TabsTrigger
          value='conference'
          className='flex-1 sm:flex-none'
        >
          Conference
        </TabsTrigger>
        <TabsTrigger
          value='division'
          className='flex-1 sm:flex-none'
        >
          Division
        </TabsTrigger>
      </TabsList>

      <TabsContent value='conference'>
        <StandingsTables conferences={conferences} />
      </TabsContent>
      <TabsContent value='division'>
        <DivisionStandingsTables conferences={conferences} />
      </TabsContent>
    </Tabs>
  )
}
