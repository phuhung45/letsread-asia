import { supabase } from "../lib/supabase";

// ✅ Lấy tất cả categories
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return data || [];
}

// ✅ Lấy tất cả sách + categories
export async function getAllBooks() {
  const { data, error } = await supabase
    .from("books")
    .select(`*, book_categories(*)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// ✅ Lấy sách theo category
export async function getBooksByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from("books")
    .select(`*, book_categories!inner(category_id)`)
    .eq("book_categories.category_id", categoryId);
  if (error) throw error;
  return data || [];
}

// ✅ Lấy chi tiết 1 sách + danh sách ngôn ngữ
export async function getBookWithLanguages(bookId: string) {
  const { data, error } = await supabase
    .from("books")
    .select(`
      id,
      title,
      author,
      description,
      cover_url,
      publisher,
      illustrator,
      editor,
      reading_level,
      pages,
      source_language,
      country_of_origin,
      original_url,
      license,
      complete,
      categories,
      book_languages (language_code)
    `)
    .eq("id", bookId)
    .single();

  if (error) throw error;

  return {
    ...data,
    available_languages: data.book_languages?.map((l: any) => l.language_code) || [],
  };
}
