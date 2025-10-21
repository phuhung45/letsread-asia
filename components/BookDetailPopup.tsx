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
  StyleSheet,
  Linking,
  TouchableWithoutFeedback,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../lib/supabase";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext"; // ✅ Lấy session user

interface Props {
  visible?: boolean;
  bookId: string | undefined;
  onClose: () => void;
}

const SITE_URL = "http://localhost:8081";

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value ?? "-"}</Text>
  </View>
);

export default function BookDetailPopup({
  visible = false,
  bookId,
  onClose,
}: Props) {
  const { session } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [languagesList, setLanguagesList] = useState<
    { id: string; name: string }[]
  >([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // ============================
  // 🔍 Check if book is favorite
  // ============================
  const checkFavorite = async (bookInternalId: number) => {
    if (!session?.user?.id || !bookInternalId) return;

    const { data, error } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("book_id", bookInternalId)
      .maybeSingle();

    if (!error && data) setIsFavorite(true);
    else setIsFavorite(false);
  };

  // ============================
  // ❤️ Toggle favorite
  // ============================
  const handleToggleFavorite = async () => {
    if (!session?.user?.id || !book?.id) {
      Alert.alert("Vui lòng đăng nhập để thêm yêu thích");
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", session.user.id)
          .eq("book_id", book.id);
        if (error) throw error;

        setIsFavorite(false);
        Alert.alert("Đã xóa khỏi danh sách yêu thích");
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert([{ user_id: session.user.id, book_id: book.id }]);
        if (error) throw error;

        setIsFavorite(true);
        Alert.alert("Đã thêm vào danh sách yêu thích");
      }
    } catch (err) {
      console.error("handleToggleFavorite error:", err);
      Alert.alert("Lỗi", "Không thể cập nhật danh sách yêu thích.");
    }
  };

  // ============================
  // 🧭 Read Book
  // ============================
  const handleRead = () => {
    if (!book?.book_uuid || !selectedLanguage) {
      Alert.alert("Lỗi", "Không đủ thông tin để đọc sách.");
      return;
    }
    try {
      router.push(`/read/${book.book_uuid}?language=${selectedLanguage}`);
      onClose?.();
    } catch (err) {
      console.error("Router push error:", err);
      const url = `${SITE_URL}/read/${book.book_uuid}?bookLang=${selectedLanguage}`;
      Linking.openURL(url).catch(() =>
        Alert.alert("Lỗi", "Không thể mở trang đọc.")
      );
    }
  };

  // ============================
  // ⬇ Download EPUB
  // ============================
  const handleDownload = async () => {
    if (!book?.book_uuid || !selectedLanguage) {
      Alert.alert("Lỗi", "Thiếu thông tin sách hoặc ngôn ngữ.");
      return;
    }
    try {
      const langIdNum = Number(selectedLanguage);
      if (isNaN(langIdNum)) {
        Alert.alert("Lỗi", "ID ngôn ngữ không hợp lệ.");
        return;
      }

      const { data: content, error } = await supabase
        .from("book_content")
        .select("epub_url")
        .eq("book_id", book.book_uuid)
        .eq("language_id", langIdNum)
        .maybeSingle();

      if (error) throw error;

      if (content?.epub_url) {
        Linking.openURL(content.epub_url).catch(() =>
          Alert.alert("Lỗi", "Không thể mở liên kết EPUB.")
        );
      } else {
        Alert.alert("Không tìm thấy file EPUB");
      }
    } catch (err) {
      console.error("handleDownload error:", err);
      Alert.alert("Lỗi tải xuống", "Không thể lấy link EPUB.");
    }
  };

  // ============================
  // Fetch Book Data
  // ============================
  const fetchBookByLanguage = async (language_id: string) => {
    if (!bookId) return;
    setLoading(true);
    try {
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("book_uuid", bookId)
        .eq("language_id", language_id)
        .single();

      if (bookError) throw bookError;

      const { data: catData } = await supabase
        .from("book_categories")
        .select("categories(name)")
        .eq("book_id", bookData.id);

      const categories =
        catData?.map((c: any) => c.categories?.name).filter(Boolean) ?? [];

      setBook({ ...bookData, categories });

      await checkFavorite(bookData.id); // ✅ kiểm tra yêu thích
    } catch (err) {
      console.error("fetchBookByLanguage error:", err);
      Alert.alert("Lỗi tải dữ liệu", "Không thể tải chi tiết sách.");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Fetch Languages List
  // ============================
  useEffect(() => {
    if (!visible || !bookId) {
      setBook(null);
      setLanguagesList([]);
      setSelectedLanguage(null);
      return;
    }

    const fetchLanguages = async () => {
      setLoading(true);
      try {
        const { data: langRecords, error: langError } = await supabase
          .from("books")
          .select("language_id, languages(name)")
          .eq("book_uuid", bookId);

        if (langError) throw langError;

        const list =
          langRecords?.map((r: any) => ({
            id: r.language_id,
            name: r.languages?.name || "Unknown",
          })) ?? [];

        setLanguagesList(list);

        const defaultLang = list[0]?.id;
        if (defaultLang) {
          setSelectedLanguage(defaultLang);
          await fetchBookByLanguage(defaultLang);
        } else {
          setBook(null);
        }
      } catch (err) {
        console.error("fetchLanguages error:", err);
        Alert.alert("Lỗi tải dữ liệu", "Không thể tải chi tiết sách.");
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, [visible, bookId]);

  // ============================
  // Reload when change language
  // ============================
  useEffect(() => {
    if (selectedLanguage && bookId) {
      fetchBookByLanguage(selectedLanguage);
    }
  }, [selectedLanguage]);

  if (!visible || !bookId) return null;
  const displayBook = book || {};

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.popupContainer}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {loading ? (
              <View style={styles.loadingView}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
              </View>
            ) : !book ? (
              <View style={styles.errorView}>
                <View style={styles.placeholderImage} />
                <Text style={styles.errorText}>
                  Không tìm thấy thông tin sách cho ID: {bookId}.
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.errorCloseButton}>
                  <Text style={styles.errorCloseButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.coverWrap}>
                  <Image
                    source={{ uri: displayBook.cover_image }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                </View>

                <Text style={styles.title}>{displayBook.title}</Text>
                <Text style={styles.author}>{displayBook.author}</Text>

                <View style={styles.pickerRow}>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedLanguage}
                      onValueChange={(v) => setSelectedLanguage(v)}
                      style={styles.languagePicker}
                      dropdownIconColor="#333"
                    >
                      {languagesList.map((lang) => (
                        <Picker.Item key={lang.id} label={lang.name} value={lang.id} />
                      ))}
                    </Picker>
                  </View>

                  <TouchableOpacity
                    style={[styles.favoriteButton, isFavorite && styles.favoriteActive]}
                    onPress={handleToggleFavorite}
                  >
                    <Text style={styles.favoriteText}>
                      {isFavorite ? "♥ Favorited" : "♡ Favorite"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.readDownloadRow}>
                  <TouchableOpacity style={styles.readButton} onPress={handleRead}>
                    <Text style={styles.readButtonText}>📖 Read</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                    <Text style={styles.downloadButtonText}>⬇</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.bookDescription}>
                  {displayBook.description || "Không có mô tả."}
                </Text>

                <View style={styles.detailsContainer}>
                  <View style={styles.hr} />
                  <InfoItem label="Publisher" value={displayBook.publisher} />
                  <View style={styles.hr} />
                  <InfoItem label="Illustrator" value={displayBook.illustrator} />
                  <View style={styles.hr} />
                  <InfoItem
                    label="Categories"
                    value={displayBook.categories?.join(", ")}
                  />
                  <View style={styles.hr} />
                  <InfoItem label="Source Language" value={displayBook.source_language} />
                  <View style={styles.hr} />
                  <InfoItem label="Country" value={displayBook.country_of_origin} />
                  <View style={styles.hr} />
                  <InfoItem label="Original URL" value={displayBook.original_url} />
                  <View style={styles.hr} />
                  <InfoItem label="License" value={displayBook.license} />
                  <View style={styles.hr} />
                  <InfoItem label="Notes" value={displayBook.notes} />
                  <View style={styles.hr} />
                  <InfoItem label="Status" value={displayBook.status ?? "Complete"} />
                </View>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

// ==========================
// 💅 CSS giữ nguyên
// ==========================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popupContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "100%",
    maxWidth: 900,
    maxHeight: "100%",
    overflow: "hidden",
    zIndex: 10,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 12,
    zIndex: 20,
    padding: 6,
  },
  closeButtonText: { fontSize: 20, color: "#333" },

  loadingView: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, color: "#555" },

  errorView: { padding: 30, alignItems: "center", width: "100%" },
  placeholderImage: { width: 150, height: 220, backgroundColor: "#e0e0e0", marginBottom: 20 },
  errorText: { textAlign: "center", marginBottom: 20, fontSize: 16, color: "#d32f2f" },
  errorCloseButton: { backgroundColor: "#f0f0f0", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  errorCloseButtonText: { fontWeight: "bold", color: "#333" },

  scrollViewContent: {
    paddingHorizontal: "10%",
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: "center",
  },

  coverWrap: { width: 160, height: 220, borderRadius: 8, overflow: "hidden", elevation: 6, backgroundColor: "#f7f7f7", marginBottom: 12 },
  coverImage: { width: "100%", height: "100%" },

  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginTop: 6 },
  author: { textAlign: "center", color: "#1e88e5", marginBottom: 12 },

  pickerRow: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 14 },
  pickerWrapper: { width: "90%", borderWidth: 1, borderColor: "#eee", borderRadius: 8, overflow: "hidden", height: 48, justifyContent: "center", backgroundColor: "#fafafa" },
  languagePicker: { height: 48 },
  favoriteButton: { width: "10%", justifyContent: "center", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee", borderRadius: 8, height: 48, marginLeft: 6 },
  favoriteActive: { backgroundColor: "#fdecea", borderColor: "#f5b4b4" },
  favoriteText: { color: "#333", fontWeight: "600", fontSize: 18, textAlign: "center" },

  readDownloadRow: { flexDirection: "row", width: "100%", alignItems: "center", marginBottom: 16 },
  readButton: { width: "90%", backgroundColor: "#11813a", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  readButtonText: { color: "#fff", fontWeight: "700" },
  downloadButton: { width: "10%", justifyContent: "center", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, height: 48, marginLeft: 6 },
  downloadButtonText: { color: "#333", fontSize: 18 },

  bookDescription: { fontSize: 14, textAlign: "center", color: "#666", marginBottom: 18, width: "100%" },

  detailsContainer: { width: "100%", paddingVertical: 8 },
  hr: { height: 1, backgroundColor: "#eee", marginVertical: 12 },

  infoRow: { width: "100%", flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  infoLabel: { fontSize: 12, color: "#777" },
  infoValue: { fontSize: 14, color: "#333", fontWeight: "600" },
});
