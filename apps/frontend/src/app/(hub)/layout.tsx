import {Navbar} from '@/components/navbar'

export default function HubLayout({children}: {children: React.ReactNode}) {
  return (
    <div className='flex flex-col items-center justify-center'>
      <Navbar />
      {children}
    </div>
  )
}
