import { createClient } from "@supabase/supabase-js";

// ✅ Khởi tạo Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Lấy danh sách sách (dùng trên HomeScreen)
export async function getBooks() {
  const { data, error } = await supabase
    .from("books")
    .select("book_uuid, title, author, cover_image, description, reading_level, pages")
    .order("title", { ascending: true });

  if (error) {
    console.error("❌ Lỗi khi lấy danh sách sách:", error);
    throw error;
  }

  return data;
}

// ✅ Lấy chi tiết sách + ngôn ngữ (BookDetailPopup)
export async function getBookWithLanguages(book_uuid: string) {
  console.log("📘 Fetching book detail for:", book_uuid);

  const { data, error } = await supabase
    // ⚠️ Tên function phải trùng chính xác với SQL trong Supabase
    .rpc("get_book_detail", { input_book_uuid: book_uuid })
    .single();

  if (error) {
    console.error("❌ Lỗi Supabase:", error);
    console.error("Chi tiết lỗi:", error);
    throw error;
  }

  console.log("✅ Book detail fetched:", data);
  return data;
}

// ✅ Lấy danh sách ngôn ngữ có sẵn (dropdown chọn language)
export async function getLanguages() {
  const { data, error } = await supabase
    .from("languages")
    .select("id, name, code")
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ Lỗi khi lấy danh sách ngôn ngữ:", error);
    throw error;
  }

  return data;
}

// ✅ Lấy danh sách categories (nếu cần lọc)
export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ Lỗi khi lấy categories:", error);
    throw error;
  }

  return data;
}
