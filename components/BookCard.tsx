import Link from 'next/link';
import { BookCardProps } from '@/types';
import Image from 'next/image';

function BookCard({ id, title, author, coverURL }: BookCardProps) {
  return (
    <Link href={`/books/${id}`}>
      <article className='book-card'>
        <figure className='book-card-figure'>
          <div className="book-card-cover-wrapper">
            <Image src={coverURL} alt={`${title} cover`} width={133} height={200} unoptimized className='book-card-cover' />
          </div>
        </figure>

        <figcaption className='book-card-meta'>
          <h3 className='book-card-title'>{title}</h3>
          <p className='book-card-author'>{author}</p>
        </figcaption>
      </article>
    </Link>
  )
}

export default BookCard