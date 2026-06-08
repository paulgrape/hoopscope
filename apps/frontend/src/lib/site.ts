import type {Metadata} from 'next'

export const SITE_NAME = 'Hoopscope'

export const SITE_TAGLINE = 'The whole league, at a glance'

export const SITE_DESCRIPTION =
  'Scores, standings, teams, headlines, and historic games — wide pro basketball coverage in one light, easy read.'

export const SITE_DAILY_TITLE = `${SITE_NAME} Daily`

export const SITE_DAILY_EDITION = 'The Hardwood Edition'

export const API_TITLE = `${SITE_NAME} API`

export function pageTitle(page?: string): string {
  return page ? `${page} | ${SITE_NAME}` : SITE_NAME
}

export const rootMetadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
}

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
}: {
  title: string
  description?: string
}): Metadata {
  return {
    title,
    description,
  }
}
