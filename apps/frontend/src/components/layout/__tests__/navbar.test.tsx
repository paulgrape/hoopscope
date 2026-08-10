import {Navbar} from '@/components/layout/navbar'
import {render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const setTheme = vi.fn()
let pathname = '/match-center'
let resolvedTheme = 'light'

vi.mock('next/navigation', () => ({
  usePathname: () => pathname
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({resolvedTheme, setTheme})
}))

vi.mock('next/image', () => ({
  default: ({alt, src}: {alt: string; src: string}) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
    />
  )
}))

describe('Navbar', () => {
  beforeEach(() => {
    pathname = '/match-center'
    resolvedTheme = 'light'
    setTheme.mockReset()
  })

  it('renders the brand and primary product links', () => {
    render(<Navbar />)

    expect(screen.getByRole('link', {name: /Hoopscope/i})).toHaveAttribute('href', '/')
    expect(screen.getAllByRole('link', {name: 'Match Center'})[0]).toHaveAttribute('href', '/match-center')
    expect(screen.getAllByRole('link', {name: 'Historic Games'})[0]).toHaveAttribute('href', '/historic-games')
    expect(screen.getAllByRole('link', {name: 'Teams'})[0]).toHaveAttribute('href', '/teams')
    expect(screen.getAllByRole('link', {name: 'Standings'})[0]).toHaveAttribute('href', '/standings')
  })

  it('marks the active route in the desktop nav', () => {
    render(<Navbar />)

    const desktopNav = screen.getByRole('navigation').querySelector('.hidden.md\\:flex')
    expect(desktopNav).not.toBeNull()

    const activeLink = within(desktopNav as HTMLElement).getByRole('link', {name: 'Match Center'})
    expect(activeLink.className).toMatch(/text-foreground/)
  })

  it('toggles the theme', async () => {
    render(<Navbar />)

    await userEvent.click(screen.getByRole('button', {name: 'Toggle theme'}))

    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('opens and closes the mobile navigation menu', async () => {
    render(<Navbar />)

    const menuButton = screen.getByRole('button', {name: 'Open navigation menu'})
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(menuButton)

    expect(screen.getByRole('button', {name: 'Close navigation menu'})).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation').querySelector('#mobile-navigation')).toHaveAttribute('aria-hidden', 'false')

    await userEvent.click(screen.getByRole('button', {name: 'Close navigation menu'}))

    expect(screen.getByRole('button', {name: 'Open navigation menu'})).toHaveAttribute('aria-expanded', 'false')
  })
})
