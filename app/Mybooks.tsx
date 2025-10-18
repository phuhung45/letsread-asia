import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function MyBookScreen() {
  const { session } = useAuth();
  const [readBooks, setReadBooks] = useState([]);
  const [favBooks, setFavBooks] = useState([]);

  useEffect(() => {
    if (!session) {
      router.replace("/Profile");
      return;
    }

    const fetchData = async () => {
      // Ví dụ giả định 2 bảng: user_reads, user_favorites
      const { data: reads } = await supabase
        .from("user_reads")
        .select("*, books(*)")
        .eq("user_id", session.user.id);

      const { data: favs } = await supabase
        .from("user_favorites")
        .select("*, books(*)")
        .eq("user_id", session.user.id);

      setReadBooks(reads || []);
      setFavBooks(favs || []);
    };

    fetchData();
  }, [session]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>📖 Books You’ve Read</Text>
      <FlatList
        data={readBooks}
        keyExtractor={(item) => item.books.id}
        renderItem={({ item }) => (
          <BookItem book={item.books} />
        )}
      />

      <Text style={styles.sectionTitle}>❤️ Favorite Books</Text>
      <FlatList
        data={favBooks}
        keyExtractor={(item) => item.books.id}
        renderItem={({ item }) => (
          <BookItem book={item.books} />
        )}
      />
    </View>
  );
}

function BookItem({ book }) {
  return (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => router.push(`/book/${book.book_uuid}`)}
    >
      <Image source={{ uri: book.cover_url }} style={styles.cover} />
      <Text style={styles.bookTitle}>{book.title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
  },
  bookItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  cover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  bookTitle: {
    fontSize: 16,
  },
});
