import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import BookDetailPopup from "../../components/BookDetailPopup"; // Đảm bảo đường dẫn chính xác
import BookListByCategory from "../../components/BookListByCategory"; 
// import Header from "../../components/Header"; 

// === INTERFACES ===
interface BookListItem {
  id?: string;
  book_uuid: string;
  title: string;
  book_categories: { category_id: string }[];
  [key: string]: any; 
}
interface Category {
  id: string;
  name: string;
  books: BookListItem[];
}

// === KHỞI TẠO SUPABASE CLIENT ===
const supabaseUrl: string = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey); 

// === COMPONENT CHÍNH: HOME ===
export default function Home({ navigation }: any): JSX.Element {
const [categories, setCategories] = useState<Category[]>([]);
const [booksByCategory, setBooksByCategory] = useState<Record<string, BookListItem[]>>({});
const [allBooks, setAllBooks] = useState<BookListItem[]>([]);
const [loading, setLoading] = useState<boolean>(true);

// State quản lý Pop-up
const [selectedBookForPopup, setSelectedBookForPopup] = useState<BookListItem | null>(null);
const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);

const [languageId] = useState<string>("4846240843956224");

useEffect(() => {
 const fetchData = async () => {
 setLoading(true);
 console.log("🐛 DEBUG: Bắt đầu fetch dữ liệu sách và danh mục.");

 // 1. Lấy categories
 const { data: categoriesData } = await supabase.from("categories").select("*").order("created_at");
 setCategories((categoriesData as Category[]) || []);

 // 2. Lấy books: INNER JOIN để lọc sách đã dịch
 const { data: booksData, error: booksError } = await supabase
  .from("books")
  .select(`*, book_categories(*), book_content(*)`)
  .innerJoin("book_languages", (query) => 
  query.eq("language_id", languageId)
  )
  .order("created_at", { ascending: false });

 if (booksError) {
  console.error("❌ Lỗi Supabase khi lấy sách:", booksError);
 } 

 const rawBooks = booksData as BookListItem[] || [];
 const validBooks = rawBooks.filter(b => b.book_uuid);

    if (rawBooks.length > 0 && validBooks.length === 0) {
        console.error("⚠️ LỖI DỮ LIỆU BAN ĐẦU: Không có cuốn sách nào có thuộc tính 'book_uuid'.");
    } else {
        console.log(`✅ DEBUG: Đã load ${validBooks.length} cuốn sách hợp lệ.`);
    }

 setAllBooks(validBooks);

 // 3. Gom sách theo category
 const grouped: Record<string, BookListItem[]> = {};
 validBooks.forEach((book) => {
  book.book_categories?.forEach((bc) => { 
  if (!grouped[bc.category_id]) grouped[bc.category_id] = [];
  grouped[bc.category_id].push(book);
  });
 });

 setBooksByCategory(grouped);
 setLoading(false);
 };

 fetchData();
}, [languageId]);
 
// 🔥 FIX: Hàm xử lý khi click vào sách (Kiểm tra an toàn trước khi đặt state)
const handleBookClick = (book: BookListItem) => {
    const uuid = book.book_uuid || book.id;

    if (!book || !uuid) {
        console.error("❌ LỖI CLICK: Đối tượng sách được truyền là null hoặc thiếu book_uuid/id.", book);
        return; 
    }
    
    console.log("✅ DEBUG: Xử lý click cho sách UUID:", uuid);

   setSelectedBookForPopup(book);
   setIsPopupVisible(true);
};

// 🔥 FIX: Tách hàm đóng Pop-up để quản lý state an toàn
const handleClosePopup = () => {
    console.log("🐛 DEBUG: Đóng Pop-up và reset state.");
    setIsPopupVisible(false);
    setSelectedBookForPopup(null); 
};


if (loading) {
 return (
 <View style={styles.loadingContainer}>
  <Text>Đang tải danh sách sách...</Text>
 </View>
 );
}

// Lọc danh mục chỉ hiển thị những cái có sách
const categoryList: Category[] = categories
 .map((cat) => ({ 
    ...cat, 
    books: booksByCategory[cat.id] || [] 
  }))
 .filter((cat) => cat.books.length > 0);

return (
 <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
 {/* <Header navigation={navigation} /> */}

 <ScrollView contentContainerStyle={{ paddingTop: 0 }}>
  
  <BookListByCategory 
      categories={categoryList} 
      onBookClick={handleBookClick} 
    />

 </ScrollView>
 	 
 {/* RENDER POPUP */}
 {isPopupVisible && selectedBookForPopup && ( // Chỉ cần kiểm tra state có tồn tại
  <BookDetailPopup 
  book={selectedBookForPopup} 
  onClose={handleClosePopup} // 🔥 TRUYỀN HÀM ĐÓNG ĐÃ TÁCH
  />
 )}
 </View>
);
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});