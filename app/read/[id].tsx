import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { getBookPdf } from "../../lib/queries";

export default function ReadBook() {
  const { id, lang } = useLocalSearchParams(); // /read/123?lang=en
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    getBookPdf(id, lang || "en")
      .then((url) => setPdfUrl(url))
      .catch((err) => console.error("❌ Lỗi load PDF:", err))
      .finally(() => setLoading(false));
  }, [id, lang]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!pdfUrl) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>❌ Không có PDF cho sách này</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* 👉 Ở đây bạn có thể dùng react-native-pdf để hiển thị */}
      <Text className="p-4">PDF URL: {pdfUrl}</Text>
    </View>
  );
}
