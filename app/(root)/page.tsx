import BookCard from '@/components/BookCard'
import BookSearch from '@/components/BookSearch'
import HeroSection from '@/components/HeroSection'
import { getAllBooks } from '@/lib/actions/book.actions'

interface PageProps {
  searchParams: Promise<{ q?: string | string[] }>
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  const query = (typeof params.q === 'string' ? params.q : '').trim()
  const booksResult = await getAllBooks(query)
  const books = booksResult.success ? booksResult.data ?? [] : []

  return (
    <main className="wrapper container">
      <HeroSection />

      <div className="library-filter-bar">
        <h2 className="text-2xl font-semibold text-(--text-primary)">Recent Books</h2>
        <BookSearch initialQuery={query} />
      </div>

      {books.length > 0 ? (
        <div className="library-books-grid">
          {books.map((book) => (
            <BookCard
              key={book._id}
              id={book._id}
              title={book.title}
              author={book.author}
              coverURL={book.coverURL}
            />
          ))}
        </div>
      ) : (
        <p className="library-empty-card text-center text-(--text-secondary)">
          {query ? 'No books found for "' + query + '".' : 'No books in your library yet.'}
        </p>
      )}
    </main>
  )
}