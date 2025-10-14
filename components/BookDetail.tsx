import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";

// ✅ Chuẩn hóa ảnh
function normalizeCover(url?: string | null): string {
  if (!url) return "https://via.placeholder.com/400x600.png?text=No+Cover";
  let coverUrl = url.replace(/^http:\/\//, "https://");
  if (coverUrl.includes("/smart/")) {
    const lastHttp = coverUrl.lastIndexOf("http");
    if (lastHttp !== -1) {
      coverUrl = coverUrl.substring(lastHttp).replace(/^http:\/\//, "https://");
    }
  }
  return coverUrl;
}

export default function BookDetail() {
  const route = useRoute<any>();
  const { id, title, cover_url, author, description } = route.params || {};

  return (
    <ScrollView style={styles.container}>
      {/* Ảnh bìa */}
      <Image
        source={{ uri: normalizeCover(cover_url) }}
        style={styles.cover}
        resizeMode="cover"
      />

      {/* Thông tin sách */}
      <Text style={styles.title}>{title}</Text>
      {author && <Text style={styles.author}>Tác giả: {author}</Text>}

      <View style={styles.divider} />

      <Text style={styles.heading}>Giới thiệu</Text>
      <Text style={styles.description}>
        {description || "Chưa có mô tả cho quyển sách này."}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  cover: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#374151",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#d1d5db",
    marginVertical: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
  },
});
