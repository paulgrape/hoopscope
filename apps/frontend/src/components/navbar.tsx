'use client'

import {Moon, Sun} from 'lucide-react'
import {useTheme} from 'next-themes'
import Link from 'next/link'

import {Button} from '@/components/ui/button'

export const Navbar = () => {
  const {resolvedTheme, setTheme} = useTheme()

  return (
    <nav className='bg-card text-card-foreground sticky top-0 z-10 flex h-12 w-full items-center justify-center border-b'>
      <Link
        href='/'
        className='text-muted-foreground hover:text-foreground absolute left-4 transition-colors'
      >
        NBA Hub
      </Link>
      <div className='flex items-center gap-6'>
        <Link
          className='text-muted-foreground hover:text-foreground transition-colors'
          href='/'
        >
          Home
        </Link>
        <Link
          className='text-muted-foreground hover:text-foreground transition-colors'
          href='/match-center'
        >
          Match Center
        </Link>
        <Link
          className='text-muted-foreground hover:text-foreground transition-colors'
          href='/teams'
        >
          Teams
        </Link>
        <Link
          className='text-muted-foreground hover:text-foreground transition-colors'
          href='/standings'
        >
          Standings
        </Link>
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='absolute right-4 cursor-pointer'
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        aria-label='Toggle theme'
      >
        <Sun className='h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
        <Moon className='absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
      </Button>
    </nav>
  )
}
