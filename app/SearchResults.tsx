import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BookDetailPopup from "../components/BookDetailPopup";

const { width } = Dimensions.get("window");
const GAP = 8;
const CARD_WIDTH = (width - 16 * 2 - GAP * 4) / 5;

type Book = {
  id: string;
  book_uuid?: string;
  title: string;
  cover_image: string | null;
  reading_level: number | null;
  language_id: string | null;
  country_of_origin?: string | null;
};

export default function SearchResults() {
  const { q, lang, levels, cats } = useLocalSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("books")
        .select(
          "id, book_uuid, title, cover_image, reading_level, language_id, country_of_origin"
        );

      if (q && typeof q === "string" && q.trim()) {
        query = query.ilike("title", `%${q.trim()}%`);
      }

      if (lang && typeof lang === "string") {
        query = query.eq("language_id", lang);
      }

      if (levels && typeof levels === "string") {
        const levelArr = levels.split(",").map((lv) => parseInt(lv, 10));
        query = query.in("reading_level", levelArr);
      }

      if (cats && typeof cats === "string") {
        const catArr = cats.split(",").map((c) => parseInt(c, 10));
        const { data: bookCat, error: catError } = await supabase
          .from("book_categories")
          .select("book_id")
          .in("category_id", catArr);

        if (catError) throw catError;

        const bookIds = bookCat?.map((b) => b.book_id) || [];
        if (bookIds.length > 0) {
          query = query.in("id", bookIds);
        } else {
          setBooks([]);
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log("📚 Books fetched:", data?.length);
      setBooks(data || []);
    } catch (err) {
      console.error("❌ Error fetching books:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [q, lang, levels, cats]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header />
      <ScrollView style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#228B22" />
            <Text style={styles.loadingText}>Loading books...</Text>
          </View>
        ) : books.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No books found 😕</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {books.map((book) => (
              <TouchableOpacity
                key={book.id}
                onPress={() => setSelectedBook(book)}
                style={styles.card}
              >
                <Image
                  source={{
                    uri:
                      book.cover_image ||
                      "https://via.placeholder.com/150x200?text=No+Image",
                  }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.cardBody}>
                  <Text numberOfLines={2} style={styles.title}>
                    {book.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ✅ Popup hiển thị khi click vào book */}
      <BookDetailPopup
        visible={!!selectedBook}
        bookId={selectedBook?.book_uuid || selectedBook?.id}
        onClose={() => setSelectedBook(null)}
      />

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    color: "#228B22",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: GAP,
    paddingLeft: "10%",
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#f9fff9",
    borderRadius: 10,
    maxWidth: 210,
    marginTop: 30,
    marginBottom: GAP,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: CARD_WIDTH * 1.1,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "#eee",
  },
  cardBody: {
    padding: 6,
  },
  title: {
    fontWeight: "600",
    color: "#333",
    fontSize: 20,
    marginBottom: 2,
  },
});
