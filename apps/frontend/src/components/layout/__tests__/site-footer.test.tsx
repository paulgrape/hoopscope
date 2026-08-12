import {SiteFooter} from '@/components/layout/site-footer'
import {render, screen, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('next/image', () => ({
  default: ({alt, src}: {alt: string; src: string}) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
    />
  )
}))

describe('SiteFooter', () => {
  it('renders a contentinfo landmark with the brand link', () => {
    render(<SiteFooter />)

    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', {name: 'Hoopscope'})).toHaveAttribute('href', '/')
  })

  it('links to the product, site, and feed destinations', () => {
    render(<SiteFooter />)

    const footerNav = screen.getByRole('navigation', {name: 'Footer'})

    expect(within(footerNav).getByRole('link', {name: 'Match Center'})).toHaveAttribute('href', '/match-center')
    expect(within(footerNav).getByRole('link', {name: 'News'})).toHaveAttribute('href', '/news')
    expect(within(footerNav).getByRole('link', {name: 'Historic Games'})).toHaveAttribute('href', '/historic-games')
    expect(within(footerNav).getByRole('link', {name: 'Teams'})).toHaveAttribute('href', '/teams')
    expect(within(footerNav).getByRole('link', {name: 'Standings'})).toHaveAttribute('href', '/standings')
    expect(within(footerNav).getByRole('link', {name: 'About'})).toHaveAttribute('href', '/about')
    expect(within(footerNav).getByRole('link', {name: 'Privacy Policy'})).toHaveAttribute('href', '/privacy')
    expect(within(footerNav).getByRole('link', {name: 'GitHub'})).toHaveAttribute(
      'href',
      'https://github.com/paulgrape'
    )
    expect(within(footerNav).getByRole('link', {name: /RSS/i}).getAttribute('href')).toContain('/feed.xml')
  })

  it('credits the data source and states the fan-project disclaimer', () => {
    render(<SiteFooter />)

    const footer = screen.getByRole('contentinfo')

    expect(within(footer).getByText(/independent fan project/i)).toHaveTextContent(
      `© ${new Date().getFullYear()} Hoopscope`
    )
    expect(within(footer).getByRole('link', {name: 'ESPN'})).toHaveAttribute('href', 'https://www.espn.com/nba/')
  })
})
