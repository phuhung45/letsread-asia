import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { supabase } from "../lib/supabase";
import BookDetailPopup from "../components/BookDetailPopup";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header"; // ✅ import header
import Footer from "../components/Footer"; // ✅ import footer

export default function MyBooks() {
  const { session } = useAuth();
  const [favBooks, setFavBooks] = useState<any[]>([]);
  const [readBooks, setReadBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchMyBooks = async () => {
      setLoading(true);
      try {
        // ✅ Favorite books
        const { data: favData, error: favErr } = await supabase
          .from("user_favorites")
          .select("books(*)")
          .eq("user_id", session.user.id);

        if (favErr) throw favErr;
        const favorites = favData.map((b: any) => b.books).filter(Boolean);
        setFavBooks(favorites);

        // ✅ Read books
        const { data: readData, error: readErr } = await supabase
          .from("user_reads")
          .select("books(*)")
          .eq("user_id", session.user.id);

        if (readErr) throw readErr;
        const reads = readData.map((b: any) => b.books).filter(Boolean);
        setReadBooks(reads);
      } catch (err) {
        console.error("fetchMyBooks error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBooks();
  }, [session]);

  const handleBookPress = (bookUuid: string) => {
    console.log("📖 Open popup for:", bookUuid);
    setSelectedBookId(bookUuid);
    setPopupVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      {/* ✅ Header */}
      <Header title="My Library" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={styles.sectionTitle}>❤️ Favorite Books</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 40 }} />
        ) : favBooks.length === 0 ? (
          <Text style={styles.emptyText}>Bạn chưa thêm sách nào vào yêu thích.</Text>
        ) : (
          <View style={styles.booksContainer}>
            {favBooks.map((book) => (
              <TouchableOpacity
                key={book.book_uuid}
                style={styles.bookCard}
                onPress={() => handleBookPress(book.book_uuid)}
              >
                <Image
                  source={{ uri: book.cover_image }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                <Text numberOfLines={2} style={styles.bookTitle}>
                  {book.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>📖 Read Books</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 40 }} />
        ) : readBooks.length === 0 ? (
          <Text style={styles.emptyText}>Bạn chưa đọc sách nào.</Text>
        ) : (
          <View style={styles.booksContainer}>
            {readBooks.map((book) => (
              <TouchableOpacity
                key={book.book_uuid}
                style={styles.bookCard}
                onPress={() => handleBookPress(book.book_uuid)}
              >
                <Image
                  source={{ uri: book.cover_image }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                <Text numberOfLines={2} style={styles.bookTitle}>
                  {book.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ✅ Footer */}
      <Footer activeTab="mybooks" />

      {/* ✅ Popup hiển thị khi click */}
      {selectedBookId && (
        <BookDetailPopup
          visible={popupVisible}
          bookId={selectedBookId}
          onClose={() => setPopupVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
  },
  booksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 40,
  },
  bookCard: {
    width: 140,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 4,
    paddingBottom: 8,
  },
  coverImage: {
    width: "100%",
    height: 200,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 6,
  },
});
