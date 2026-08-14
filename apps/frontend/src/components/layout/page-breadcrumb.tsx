import Link from 'next/link'

export type PageBreadcrumbItem = {
  name: string
  href?: string
}

type PageBreadcrumbProps = {
  items: PageBreadcrumbItem[]
}

export function PageBreadcrumb({items}: PageBreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label='Breadcrumb'>
      <ol className='text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm'>
        {items.flatMap((item, index) => {
          const isLast = index === items.length - 1
          const nodes = []

          if (index > 0) {
            nodes.push(
              <li
                key={`sep-${index}`}
                aria-hidden='true'
              >
                /
              </li>
            )
          }

          nodes.push(
            <li
              key={`${item.href ?? item.name}-${index}`}
              className={isLast ? 'text-foreground min-w-0 truncate' : undefined}
              aria-current={isLast ? 'page' : undefined}
            >
              {isLast || !item.href ? (
                item.name
              ) : (
                <Link
                  href={item.href}
                  className='hover:text-foreground underline-offset-4 hover:underline'
                >
                  {item.name}
                </Link>
              )}
            </li>
          )

          return nodes
        })}
      </ol>
    </nav>
  )
}
