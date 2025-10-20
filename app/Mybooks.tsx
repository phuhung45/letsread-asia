import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

export default function MyBookScreen() {
  const { session } = useAuth();
  const [readBooks, setReadBooks] = useState<any[]>([]);
  const [favBooks, setFavBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.replace("/Profile");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Lấy sách đã đọc cùng progress
        const { data: reads, error: readError } = await supabase
          .from("user_reads")
          .select(`
            progress,
            books(
              id,
              book_uuid,
              title,
              author,
              cover_image
            )
          `)
          .eq("user_id", session.user.id);

        if (readError) console.error("Error loading readBooks:", readError);

        // 2️⃣ Lấy sách yêu thích (không cần progress)
        const { data: favs, error: favError } = await supabase
          .from("user_favorites")
          .select(`
            books(
              id,
              book_uuid,
              title,
              author,
              cover_image
            )
          `)
          .eq("user_id", session.user.id);

        if (favError) console.error("Error loading favBooks:", favError);

        // 3️⃣ Map progress từ user_reads vào favBooks
        const favsWithProgress = (favs || []).map((fav) => {
          const read = (reads || []).find(
            (r) => r.books.id === fav.books.id
          );
          return { ...fav, progress: read?.progress ?? 0 };
        });

        setReadBooks(reads || []);
        setFavBooks(favsWithProgress);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="My Books" />
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 120 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Books" />

      <View style={{ marginTop: 100, paddingHorizontal: 16 }}>
        <Text style={styles.sectionTitle}>📖 Books You’ve Read</Text>
        {readBooks.length === 0 ? (
          <Text style={styles.emptyText}>No books read yet.</Text>
        ) : (
          <FlatList
            data={readBooks}
            keyExtractor={(item) => String(item.books.id)}
            renderItem={({ item }) => (
              <BookItem book={item.books} progress={item.progress ?? 0} />
            )}
          />
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>❤️ Favorite Books</Text>
        {favBooks.length === 0 ? (
          <Text style={styles.emptyText}>No favorite books yet.</Text>
        ) : (
          <FlatList
            data={favBooks}
            keyExtractor={(item) => String(item.books.id)}
            renderItem={({ item }) => (
              <BookItem book={item.books} progress={item.progress ?? 0} />
            )}
          />
        )}
      </View>
    </View>
  );
}

function BookItem({ book, progress }) {
  const renderProgress = () => {
    if (progress === 0) return <Text style={styles.newText}>New</Text>;
    if (progress === 100) return <Text style={styles.tick}>✔️</Text>;

    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => router.push(`/book/${book.book_uuid}`)}
    >
      <Image source={{ uri: book.cover_image }} style={styles.cover} />
      <View style={{ flex: 1 }}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        {book.author && <Text style={styles.author}>{book.author}</Text>}
        {renderProgress()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  bookItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 10,
  },
  cover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#ddd",
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  author: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
  progressBarContainer: {
    height: 20,
    backgroundColor: "#eee",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 6,
    position: "relative",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  progressText: {
    position: "absolute",
    alignSelf: "center",
    color: "#fff",
    fontWeight: "700",
  },
  newText: {
    marginTop: 6,
    color: "#FF9800",
    fontWeight: "700",
  },
  tick: {
    marginTop: 6,
    color: "#4CAF50",
    fontWeight: "700",
    fontSize: 16,
  },
});
