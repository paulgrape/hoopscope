import type {LucideIcon} from 'lucide-react'
import type {ReactNode} from 'react'

type StatusPageProps = {
  code: string
  title: string
  description: string
  icon: LucideIcon
  actions: ReactNode
  details?: string
}

export function StatusPage({code, title, description, icon: Icon, actions, details}: StatusPageProps) {
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <div className='bg-card border-border flex flex-col items-center rounded-xl border p-6 text-center sm:p-8'>
        <div className='border-border bg-muted/50 mb-4 flex size-12 items-center justify-center rounded-full border'>
          <Icon
            className='text-muted-foreground size-6'
            aria-hidden
          />
        </div>
        <p className='text-muted-foreground text-sm font-medium tracking-wider uppercase'>{code}</p>
        <h1 className='mt-2 text-2xl font-semibold sm:text-3xl'>{title}</h1>
        <p className='text-muted-foreground mt-2 max-w-md text-sm sm:text-base'>{description}</p>
        {details ? (
          <p className='text-muted-foreground mt-3 max-w-lg font-mono text-xs wrap-break-word'>{details}</p>
        ) : null}
        <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>{actions}</div>
      </div>
    </main>
  )
}
