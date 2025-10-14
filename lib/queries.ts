import { supabase } from "./supabase";

export async function getBookWithLanguages(book_uuid: string) {
  console.log("📘 Fetching book with UUID:", book_uuid);

  const { data, error } = await supabase
    .from("books")
    .select(`
      *,
      book_languages (
        id,
        language_code,
        book_translations (*)
      )
    `)
    .eq("book_uuid", book_uuid)
    .eq("language_id", 4846240843956224) // 🔥 chỉ lấy đúng 1 ngôn ngữ
    .maybeSingle(); // tránh lỗi "multiple rows returned"

  if (error) {
    console.error("❌ Supabase fetch error:", error);
    return { error };
  }

  if (!data) {
    console.warn(`⚠️ Không tìm thấy sách với UUID: ${book_uuid}`);
    return { error: { message: "Không tìm thấy thông tin sách." } };
  }

  console.log("✅ Book fetched successfully:", data);
  return { data };
}
