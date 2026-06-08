import { NewsNewspaper } from '@/components/news-newspaper'
import { getNews } from '@/lib/news-api'

export default async function Home() {
  const articles = await getNews(12)

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8'>
      <header className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm uppercase tracking-wider'>Welcome</p>
        <h1 className='text-2xl font-semibold sm:text-3xl'>NBA Hub</h1>
        <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
          Your morning read on league headlines, pulled fresh from ESPN.
        </p>
      </header>

      <NewsNewspaper articles={articles} />
    </main>
  )
}
