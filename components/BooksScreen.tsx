import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import SearchBar from "./SearchBar";
import BookListByCategory from "./BookListByCategory";

// Nếu bạn load dữ liệu từ Supabase hoặc API, có thể import client tại đây
import { supabase } from "../lib/supabase";

type Props = {
  allCategories?: any[];
};

export default function BooksScreen({ allCategories = [] }: Props) {
  const [categories, setCategories] = useState<any[]>(allCategories);
  const [filteredCategories, setFilteredCategories] = useState<any[]>(allCategories);
  const [loading, setLoading] = useState(false);

  // ⚙️ Nếu bạn muốn fetch từ Supabase — bật đoạn này:

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("categories").select("*, books(*)");
      if (!error && data) {
        setCategories(data);
        setFilteredCategories(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);


  // 🧠 Gom tất cả sách từ các category (để search/filter)
  const allBooks = categories.flatMap((cat: any) => cat.books || []);

  // 🔍 Khi SearchBar lọc xong, cập nhật danh sách category hiển thị
  const handleResults = (results: any[]) => {
    if (!results || results.length === 0) {
      setFilteredCategories([]); // không có kết quả
      return;
    }

    const newCategories = categories
      .map((cat: any) => {
        const filteredBooks = (cat.books || []).filter((b: any) =>
          results.some((r: any) => r.id === b.id)
        );
        return filteredBooks.length > 0 ? { ...cat, books: filteredBooks } : null;
      })
      .filter(Boolean);

    setFilteredCategories(newCategories);
  };

  // 📖 Khi chọn sách → mở popup hoặc xử lý riêng
  const handleSelectBook = (book: any) => {
    console.log("📖 Selected book:", book.title);
    // 👉 Bạn có thể mở BookDetailPopup ở đây nếu muốn
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 🔍 Thanh tìm kiếm + lọc */}
      <SearchBar books={allBooks} onResults={handleResults} />

      {/* 📚 Danh sách theo danh mục (hiển thị kết quả lọc nếu có) */}
      <BookListByCategory
        categories={filteredCategories.length > 0 ? filteredCategories : categories}
        onSelectBook={handleSelectBook}
      />
    </View>
  );
}
