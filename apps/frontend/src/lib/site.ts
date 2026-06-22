import type {Metadata} from 'next'

export const SITE_NAME = 'Hoopscope'

export const SITE_TAGLINE = 'The whole league, at a glance'

export const SITE_DESCRIPTION =
  'Scores, standings, teams, headlines, and historic games — wide pro basketball coverage in one light, easy read.'

export const SITE_DAILY_TITLE = `${SITE_NAME} Daily`

export const SITE_DAILY_EDITION = 'The Hardwood Edition'

export const API_TITLE = `${SITE_NAME} API`

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'

export const DEFAULT_OG_IMAGE_PATH = '/web-app-manifest-512x512.png'

export const DATA_SOURCE_NAME = 'ESPN'

export const DATA_SOURCE_URL = 'https://www.espn.com/nba/'

export function pageTitle(page?: string): string {
  return page ? `${page} | ${SITE_NAME}` : SITE_NAME
}

export function absoluteUrl(path: string = '/'): string {
  const base = SITE_URL.replace(/\/$/, '')
  if (!path || path === '/') return `${base}/`
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

function resolveImageUrl(image?: string | null): string {
  if (!image) return absoluteUrl(DEFAULT_OG_IMAGE_PATH)
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  return absoluteUrl(image)
}

type PageMetadataOptions = {
  title: string
  description?: string
  path: string
  image?: string | null
  type?: 'website' | 'article' | 'profile'
  noIndex?: boolean
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{name: SITE_NAME}],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE_PATH],
  },
  icons: {
    icon: [{url: '/favicon.ico'}],
    apple: [{url: '/apple-icon.png'}],
  },
}

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  image,
  type = 'website',
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const resolvedImage = resolveImageUrl(image)

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type,
      images: [
        {
          url: resolvedImage,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [resolvedImage],
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
  }
}
