import {PageBreadcrumb} from '@/components/layout/page-breadcrumb'
import {render, screen, within} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

describe('PageBreadcrumb', () => {
  it('exposes a breadcrumb landmark with the parent link and current page', () => {
    render(
      <PageBreadcrumb
        items={[
          {name: 'Teams', href: '/teams'},
          {name: 'Boston Celtics'}
        ]}
      />
    )

    const nav = screen.getByRole('navigation', {name: 'Breadcrumb'})
    expect(within(nav).getByRole('link', {name: 'Teams'})).toHaveAttribute('href', '/teams')
    expect(within(nav).queryByRole('link', {name: 'Boston Celtics'})).not.toBeInTheDocument()
    expect(within(nav).getByText('Boston Celtics')).toHaveAttribute('aria-current', 'page')
  })

  it('renders a three-item trail without linking the current page', () => {
    render(
      <PageBreadcrumb
        items={[
          {name: 'Teams', href: '/teams'},
          {name: 'Boston Celtics', href: '/teams/2'},
          {name: 'Jayson Tatum'}
        ]}
      />
    )

    const nav = screen.getByRole('navigation', {name: 'Breadcrumb'})
    expect(within(nav).getByRole('link', {name: 'Teams'})).toHaveAttribute('href', '/teams')
    expect(within(nav).getByRole('link', {name: 'Boston Celtics'})).toHaveAttribute('href', '/teams/2')
    expect(within(nav).queryByRole('link', {name: 'Jayson Tatum'})).not.toBeInTheDocument()
  })
})
