import { supabase } from "./supabase";

// ==============================
// 📚 Lấy chi tiết sách + ngôn ngữ
// ==============================
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
    return null;
  }

  if (!data) {
    console.warn(`⚠️ Không tìm thấy sách với UUID: ${book_uuid}`);
    return null;
  }

  console.log("✅ Book fetched successfully:", data);
  return data;
}

// ==============================
// 📄 Lấy link PDF hoặc EPUB
// ==============================
export async function getBookPdf(book_uuid: string, language_id?: number | string) {
  console.log("📄 Fetching book PDF for:", { book_uuid, language_id });

  try {
    const { data, error } = await supabase
      .from("book_content")
      .select("id, book_id, pdf_url, epub_url, language_id")
      .eq("book_id", book_uuid)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase getBookPdf error:", error);
      return null;
    }

    if (!data) {
      console.warn(`⚠️ Không có file PDF cho sách: ${book_uuid}`);
      return null;
    }

    console.log("✅ getBookPdf success:", data);

    // ✅ Ưu tiên PDF, fallback EPUB
    return data.pdf_url || data.epub_url || null;
  } catch (err) {
    console.error("💥 Exception in getBookPdf:", err);
    return null;
  }
}
