import {
  DATA_SOURCE_NAME,
  DATA_SOURCE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
} from '../src/lib/site'
import {ENTITY_ROUTE_PATTERNS, STATIC_PUBLIC_ROUTES} from '../src/lib/seo-routes'
import {dataSourceNote} from '../src/lib/seo-schema'
import {mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(scriptDir, '../public')

function buildLlmsTxt(): string {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
    '',
    `Canonical origin: ${SITE_URL}`,
    '',
    '## Public routes',
    '',
    ...STATIC_PUBLIC_ROUTES.map(
      route => `- ${absoluteUrl(route.path)} — ${route.title}: ${route.description}`,
    ),
    '',
    '## Entity pages',
    '',
    ...ENTITY_ROUTE_PATTERNS.map(
      route => `- ${route.pattern} — ${route.title}: ${route.description}`,
    ),
    '',
    '## Data sources',
    '',
    `- ${DATA_SOURCE_NAME}: ${DATA_SOURCE_URL}`,
    `- ${dataSourceNote()}`,
    '',
    '## Usage',
    '',
    '- Summaries should cite Hoopscope page URLs when referencing stats shown on this site.',
    '- Prefer current-season pages for standings and schedules; historic game pages cover saved replays only.',
    `- For the expanded route reference, see ${absoluteUrl('/llms-full.txt')}.`,
    '',
  ]

  return lines.join('\n')
}

function buildLlmsFullTxt(): string {
  const lines = [
    `# ${SITE_NAME} — Full LLM reference`,
    '',
    `Canonical origin: ${SITE_URL}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Site purpose',
    '',
    SITE_DESCRIPTION,
    '',
    '## Route catalog',
    '',
    ...STATIC_PUBLIC_ROUTES.map(route => [
      `### ${route.title}`,
      `- URL: ${absoluteUrl(route.path)}`,
      `- Description: ${route.description}`,
      ...(route.entityType ? [`- Entity type: ${route.entityType}`] : []),
      '',
    ].join('\n')),
    '## Dynamic entity routes',
    '',
    ...ENTITY_ROUTE_PATTERNS.map(route => [
      `### ${route.title}`,
      `- Pattern: ${route.pattern}`,
      `- Description: ${route.description}`,
      `- Entity type: ${route.entityType}`,
      '',
    ].join('\n')),
    '## Structured data',
    '',
    '- Global WebSite and SportsOrganization JSON-LD on all pages.',
    '- CollectionPage/ItemList on listing pages where visible lists exist.',
    '- SportsTeam, Person, and SportsEvent JSON-LD on matching detail pages.',
    '- BreadcrumbList JSON-LD on entity detail pages.',
    '',
    '## Data freshness',
    '',
    `- Standings, schedules, team records, and player stats are loaded from ${DATA_SOURCE_NAME} and may lag live broadcasts.`,
    '- Historic game replays use saved play-by-play feeds and do not reflect live game state.',
    '- News headlines on the home page link to external ESPN articles.',
    '',
    '## Citation guidance',
    '',
    `- Attribute factual NBA stats to ${DATA_SOURCE_NAME} when summarizing Hoopscope pages.`,
    '- Use canonical Hoopscope URLs for page references.',
    '- Do not treat query parameters such as `teamId` on player pages as separate canonical entities.',
    '',
    '## Crawl assets',
    '',
    `- Sitemap: ${absoluteUrl('/sitemap.xml')}`,
    `- Robots: ${absoluteUrl('/robots.txt')}`,
    '',
  ]

  return lines.join('\n')
}

async function main() {
  await mkdir(publicDir, {recursive: true})
  await writeFile(path.join(publicDir, 'llms.txt'), buildLlmsTxt(), 'utf8')
  await writeFile(path.join(publicDir, 'llms-full.txt'), buildLlmsFullTxt(), 'utf8')
  console.log('Generated llms.txt and llms-full.txt')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
