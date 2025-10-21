import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { supabase } from "../lib/supabase";
import BookListByCategory from "../components/BookListByCategory";
import CategoryMenu from "../components/CategoryMenu";
import ImageSlider from "../components/ImageSlider";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import AppIntro from "../components/AppIntro";
import Footer from "../components/Footer";
import BookDetailPopup from "../components/BookDetailPopup";

export default function Index() {
  const [categories, setCategories] = useState<any[]>([]);
  const [booksByCategory, setBooksByCategory] = useState<Record<string, any[]>>({});
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState<string>("⏳ Đang tải dữ liệu...");

  const [popupState, setPopupState] = useState<{ book: any | null; visible: boolean }>({
    book: null,
    visible: false,
  });

  const [pageIndex, setPageIndex] = useState<Record<string, number>>({});
  const [languageId] = useState("4846240843956224");
  const BOOKS_PER_PAGE = 6;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let debugLog = `🚀 Load data cho language_id = ${languageId}\n`;

      try {
        const { data: categoriesData, error: catErr } = await supabase
          .from("categories")
          .select("id, name")
          .order("name");
        if (catErr) throw catErr;
        setCategories(categoriesData || []);
        debugLog += `📚 Categories: ${categoriesData?.length}\n`;

        const { data: booksData, error: bookErr } = await supabase
          .from("books")
          .select("book_uuid, title, author, cover_image, language_id")
          .eq("language_id", languageId);
        if (bookErr) throw bookErr;
        setAllBooks(booksData || []);
        debugLog += `📘 Books: ${booksData?.length}\n`;

        const { data: bcData, error: bcErr } = await supabase
          .from("book_categories")
          .select("book_id, category_id");
        if (bcErr) throw bcErr;
        debugLog += `🔗 book_categories: ${bcData?.length}\n`;

        const grouped: Record<string, any[]> = {};
        for (const bc of bcData || []) {
          const book = booksData.find(
            (b) => String(b.book_uuid).trim() === String(bc.book_id).trim()
          );
          if (!book) continue;
          if (!grouped[bc.category_id]) grouped[bc.category_id] = [];
          grouped[bc.category_id].push(book);
        }

        const pageMap: Record<string, number> = {};
        Object.keys(grouped).forEach((id) => (pageMap[id] = 0));
        setPageIndex(pageMap);

        setBooksByCategory(grouped);
        debugLog += `📖 Categories có sách: ${Object.keys(grouped).length}\n`;
        setDebug(debugLog);
      } catch (err: any) {
        console.error("❌ Fetch error:", err);
        setDebug(debugLog + `\n❌ Lỗi: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [languageId]);

  const categoryList = categories
    .map((cat) => ({ ...cat, books: booksByCategory[cat.id] || [] }))
    .filter((cat) => cat.books.length > 0)
    .slice(0, 8);

  const handlePrev = (id: string) =>
    setPageIndex((prev) => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }));

  const handleNext = (id: string, total: number) =>
    setPageIndex((prev) => {
      const cur = prev[id] || 0;
      const maxPage = Math.ceil(total / BOOKS_PER_PAGE) - 1;
      return { ...prev, [id]: Math.min(cur + 1, maxPage) };
    });

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <Header />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text>Đang tải dữ liệu...</Text>
          <Text
            style={{ marginTop: 8, fontSize: 12, color: "gray", textAlign: "center" }}
          >
            {debug}
          </Text>
        </View>
      ) : categoryList.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
            ❌ Không có sách nào hiển thị
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: "#666",
              textAlign: "left",
              fontFamily: "monospace",
            }}
          >
            {debug}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: 0 }}>
          <ImageSlider />
          <SearchBar onResults={(books) => setAllBooks(books)} />

          {categoryList.map((cat) => {
            const page = pageIndex[cat.id] || 0;
            const total = cat.books.length;
            const start = page * BOOKS_PER_PAGE;
            const end = start + BOOKS_PER_PAGE;
            const visibleBooks = cat.books.slice(start, end);
            const maxPage = Math.ceil(total / BOOKS_PER_PAGE);

            return (
              <View key={cat.id} style={{ marginBottom: 24 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginHorizontal: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: "bold" }}>{cat.name}</Text>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handlePrev(cat.id)}
                      disabled={page === 0}
                      style={{
                        opacity: page === 0 ? 0.4 : 1,
                        padding: 6,
                        backgroundColor: "#e5e7eb",
                        borderRadius: 8,
                      }}
                    >
                      <Text>⬅ Prev</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleNext(cat.id, total)}
                      disabled={page >= maxPage - 1}
                      style={{
                        opacity: page >= maxPage - 1 ? 0.4 : 1,
                        padding: 6,
                        backgroundColor: "#e5e7eb",
                        borderRadius: 8,
                      }}
                    >
                      <Text>Next ➡</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <BookListByCategory
                    categories={[{ ...cat, books: visibleBooks }]} // ✅ Giữ nguyên
                    onSelectBook={(book) => {
                      console.log("🔹 Clicked book:", book?.book_uuid);
                      setPopupState({ book, visible: true });
                    }}
                    responsive
                    key={`cat-${cat.id}-${pageIndex[cat.id]}`} // ✅ THÊM KEY UNIQUE ĐỂ FORCERE-RENDER
                  />


                {maxPage > 1 && (
                  <Text
                    style={{
                      fontSize: 12,
                      textAlign: "center",
                      color: "#888",
                      marginTop: 4,
                    }}
                  >
                  </Text>
                )}
              </View>
            );
          })}

          <CategoryMenu totalBooks={allBooks.length} totalCategories={categories.length} />
          <AppIntro />
          <Footer />
        </ScrollView>
      )}

      <BookDetailPopup
        // ✅ DÒNG ĐÃ SỬA: Dùng trực tiếp popupState.visible để điều khiển Modal
        visible={popupState.visible} 
        bookId={popupState.book?.book_uuid}
        onClose={() => {
          console.log("Closing popup");
          // Khi đóng, đặt cả book và visible về trạng thái ban đầu
          setPopupState({ book: null, visible: false });
        }}
      />

    </View>
  );
}