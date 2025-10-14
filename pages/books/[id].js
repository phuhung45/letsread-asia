import { supabase } from '../../lib/supabase'

export default function BookDetail({ book }) {
  if (!book) return <p>Không tìm thấy sách</p>
  return (
    <div className="p-8">
      <img src={book.cover_url} alt={book.title} className="w-64 rounded mb-6" />
      <h1 className="text-3xl font-bold">{book.title}</h1>
      <p className="text-lg">{book.author}</p>
      <p className="mt-4">{book.description}</p>
      {book.file_url && (
        <a
          href={book.file_url}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-6 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Đọc sách
        </a>
      )}
    </div>
  )
}

export async function getServerSideProps({ params }) {
  const { data: book } = await supabase.from('books').select('*').eq('id', params.id).single()
  return { props: { book } }
}
