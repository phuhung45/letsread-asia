import { supabase } from '../lib/supabase'

export default function Home({ books }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">LetsReadAsia</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {books.map((book) => (
          <a href={`/books/${book.id}`} key={book.id} className="shadow p-4 rounded block hover:shadow-lg transition">
            <img src={book.cover_url} alt={book.title} className="mb-2 rounded" />
            <h2 className="font-semibold">{book.title}</h2>
            <p className="text-sm text-gray-500">{book.author}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  const { data: books, error } = await supabase.from('books').select('*')
  return { props: { books: books || [] } }
}
