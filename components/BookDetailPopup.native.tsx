import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";

interface Props {
  visible?: boolean;
  bookId: string | undefined;
  onClose: () => void;
}

export default function BookDetailPopup({ visible = false, bookId, onClose }: Props) {
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  console.log("BookDetailPopup render", { visible, bookId, book });

  useEffect(() => {
    if (!visible || !bookId) {
      console.log("BookDetailPopup: not visible or bookId null, skipping fetch");
      setBook(null); 
      return;
    }

    const fetchBook = async () => {
      try {
        setLoading(true);
        console.log("Fetching book data for bookId:", bookId);

        // 1. Fetch thông tin sách chính
        const { data: bookData, error: bookError } = await supabase
          .from("books")
          .select(`
            id,
            title,
            author,
            description,
            cover_image,
            book_uuid
          `)
          .eq("book_uuid", bookId)
          .single();

        if (bookError) throw bookError;

        // 2. SỬA LỖI PGRST201 DỨT ĐIỂM: Chỉ định tên Khóa Ngoại chính xác
        // Sử dụng tên khóa ngoại 'book_languages_language_id_fkey' để giải quyết xung đột quan hệ
        const FKEY_NAME = "book_languages_language_id_fkey"; 
        
        const { data: langData, error: langError } = await supabase
          .from("book_languages")
          .select(`
            languages!${FKEY_NAME}(name) 
          `) // ✅ ĐÃ SỬA: Dùng tên Khóa Ngoại để chỉ định JOIN
          .eq("book_uuid", bookId);

        if (langError) throw langError;

        // 3. Fetch thông tin thể loại
        const { data: categoryData, error: categoryError } = await supabase
          .from("book_categories")
          .select("categories(name)")
          .eq("book_id", bookId);

        if (categoryError) throw categoryError;

        setBook({
          ...bookData,
          languages: langData?.map((l) => l.languages?.name) ?? [],
          categories: categoryData?.map((c) => c.categories?.name) ?? [],
        });

        console.log("Book data fetched:", bookData);
      } catch (err: any) {
        // Thông báo lỗi cho người dùng khi fetch thất bại
        console.error("❌ Fetch book details error:", err);
        Alert.alert("Lỗi tải sách", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [visible, bookId]);

  if (!visible || !bookId) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            width: "100%",
            maxHeight: "90%",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#111827" />
              <Text style={{ marginTop: 12, color: "#555" }}>Đang tải dữ liệu...</Text>
            </View>
          ) : !book ? (
            <View style={{ padding: 30, alignItems: "center" }}>
              <Text>Không tìm thấy thông tin sách.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Image
                source={{ uri: book.cover_image }}
                style={{
                  width: 150,
                  height: 200,
                  alignSelf: "center",
                  borderRadius: 8,
                  marginBottom: 16,
                }}
                resizeMode="cover"
              />
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {book.title}
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: "gray",
                  marginBottom: 16,
                }}
              >
                {book.author}
              </Text>

              <Text style={{ fontWeight: "600", marginBottom: 6 }}>Ngôn ngữ:</Text>
              <Text style={{ marginBottom: 12, color: "#555" }}>
                {book.languages?.join(", ") || "Không rõ"}
              </Text>

              <Text style={{ fontWeight: "600", marginBottom: 6 }}>Thể loại:</Text>
              <Text style={{ marginBottom: 12, color: "#555" }}>
                {book.categories?.join(", ") || "Không có"}
              </Text>

              <Text style={{ fontWeight: "600", marginBottom: 6 }}>Mô tả:</Text>
              <Text style={{ fontSize: 14, color: "#333" }}>
                {book.description || "Không có mô tả."}
              </Text>
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "#111827",
              padding: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}