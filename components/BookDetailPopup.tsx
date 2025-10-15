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
import { router } from "expo-router"; // ✅ dùng expo-router để điều hướng nội bộ

interface Props {
  visible?: boolean;
  bookId: string | undefined;
  onClose: () => void;
}

const SITE_URL = "http://localhost:8081"; // ✅ base URL cho fallback khi cần

const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoValue}>{value}</Text>
    <Text style={styles.infoLabel}>{label}</Text>
  </View>
);

export default function BookDetailPopup({ visible = false, bookId, onClose }: Props) {
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [languagesList, setLanguagesList] = useState<{ id: string; name: string }[]>([]);

  // ✅ 1. Nút READ — điều hướng nội bộ (vẫn ở tab hiện tại)
  const handleRead = () => {
    if (!book || !book.book_uuid || !selectedLanguage) {
      Alert.alert("Lỗi", "Không đủ thông tin để đọc sách.");
      return;
    }

    const routePath = `/read/${book.book_uuid}?bookLang=${selectedLanguage}`;
    try {
      router.push(routePath);
    } catch (err) {
      console.error("Router push error:", err);
      const url = `${SITE_URL}/read/${book.book_uuid}?bookLang=${selectedLanguage}`;
      Linking.openURL(url).catch(() =>
        Alert.alert("Lỗi", "Không thể mở trang đọc.")
      );
    }
  };

  // ✅ 2. Nút DOWNLOAD — lấy đúng epub_url theo book_id + language_id (ép kiểu number)
  const handleDownload = async () => {
    if (!book?.id || !selectedLanguage) {
      Alert.alert("Lỗi", "Thiếu thông tin sách hoặc ngôn ngữ.");
      return;
    }

    try {
      const langIdNum = Number(selectedLanguage); // ✅ ép kiểu number
      if (isNaN(langIdNum)) {
        Alert.alert("Lỗi", "ID ngôn ngữ không hợp lệ.");
        return;
      }
      console.log("🧩 Trying to download:", {
        bookId: book.id,
        selectedLanguage,
        langIdNum,
      });

      const { data: content, error } = await supabase
        .from("book_content")
        .select("id, book_id, language_id, epub_url")
        .eq("book_id", book.book_uuid)
        .eq("language_id", langIdNum)
        .maybeSingle();

      console.log("🔍 Download query result:", content);

      if (error) throw error;

      if (content?.epub_url) {
        Linking.openURL(content.epub_url).catch(() =>
          Alert.alert("Lỗi", "Không thể mở liên kết tải xuống EPUB.")
        );
      } else {
        Alert.alert(
          "Không tìm thấy file EPUB",
          `Không có EPUB cho book_id=${book.id}, language_id=${selectedLanguage}`
        );
      }
    } catch (err) {
      console.error("❌ Lỗi handleDownload:", err);
      Alert.alert("Lỗi tải xuống", "Không thể lấy link EPUB.");
    }
  };

  // ✅ Lấy thông tin sách theo ngôn ngữ
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

      setBook({
        ...bookData,
        categories,
      });
    } catch (err: any) {
      console.error("❌ Lỗi fetchBookByLanguage:", err);
      Alert.alert("Lỗi tải dữ liệu", "Không thể tải chi tiết sách.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Lấy danh sách ngôn ngữ
  useEffect(() => {
    if (!visible || !bookId) {
      setBook(null);
      setLanguagesList([]);
      setSelectedLanguage(null);
      return;
    }

    const fetchBook = async () => {
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
      } catch (err: any) {
        console.error("❌ Lỗi fetchBook:", err);
        Alert.alert("Lỗi tải dữ liệu", "Không thể tải chi tiết sách.");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [visible, bookId]);

  // ✅ Khi đổi ngôn ngữ thì load lại sách
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
                <Image
                  source={{ uri: displayBook.cover_image }}
                  style={styles.coverImage}
                  resizeMode="contain"
                />
                <Text style={styles.title}>{displayBook.title}</Text>
                <Text style={styles.author}>{displayBook.author}</Text>

                <View style={styles.actionRow}>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedLanguage}
                      onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
                      style={styles.languagePicker}
                      dropdownIconColor="#333"
                      enabled={languagesList.length > 0}
                    >
                      {languagesList.length === 0 ? (
                        <Picker.Item label="English" value="en" />
                      ) : (
                        languagesList.map((lang) => (
                          <Picker.Item key={lang.id} label={lang.name} value={lang.id} />
                        ))
                      )}
                    </Picker>
                  </View>
                </View>

                <View style={styles.readDownloadRow}>
                  <TouchableOpacity
                    style={[styles.readButton, !displayBook.book_uuid && { opacity: 0.5 }]}
                    onPress={handleRead}
                    disabled={!displayBook.book_uuid}
                  >
                    <Text style={styles.readButtonText}>📖 Read</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={handleDownload}
                  >
                    <Text style={styles.downloadButtonText}>⬇</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.bookDescription}>
                  {displayBook.description || "Không có mô tả."}
                </Text>

                <View style={styles.infoGrid}>
                  <InfoItem label="Reading Level" value={displayBook.reading_level} />
                  <InfoItem label="Pages" value={displayBook.pages} />
                  <InfoItem label="Available Languages" value={languagesList.length} />
                </View>
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

// ✅ giữ nguyên style
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  popupContainer: { backgroundColor: "white", borderRadius: 30, width: "100%", maxWidth: 900, maxHeight: "100%", overflow: "hidden", zIndex: 10 },
  closeButton: { position: "absolute", top: 10, right: 15, zIndex: 20, padding: 5 },
  closeButtonText: { fontSize: 24, color: "#333" },
  scrollViewContent: { padding: 24, alignItems: "center" },
  loadingView: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, color: "#555" },
  errorView: { padding: 30, alignItems: "center", width: "100%" },
  placeholderImage: { width: 150, height: 220, backgroundColor: "#e0e0e0", marginBottom: 20 },
  errorText: { textAlign: "center", marginBottom: 20, fontSize: 16, color: "#d32f2f" },
  errorCloseButton: { backgroundColor: "#f0f0f0", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  errorCloseButtonText: { fontWeight: "bold", color: "#333" },
  coverImage: { width: 200, height: 270, borderRadius: 4, marginBottom: 16, backgroundColor: "#e5e7eb" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  author: { textAlign: "center", color: "gray", marginBottom: 20 },
  actionRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 4, marginRight: 10, overflow: "hidden", height: 40, width: 400, justifyContent: "center" },
  languagePicker: { height: 40, color: "#333" },
  readDownloadRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", width: 700, marginBottom: 20 },
  readButton: { backgroundColor: "#4CAF50", paddingVertical: 12, width: 400, paddingHorizontal: 40, borderRadius: 4, marginRight: 10 },
  readButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  downloadButton: { backgroundColor: "#f0f0f0", padding: 12, borderRadius: 4, width: 45, height: 45, justifyContent: "center", alignItems: "center" },
  downloadButtonText: { fontSize: 18, color: "#333" },
  bookDescription: { fontSize: 14, textAlign: "center", color: "gray", marginBottom: 20, paddingHorizontal: 10, marginLeft: "20%", marginRight: "20%" },
  infoGrid: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 20 },
  infoItem: { flex: 1, alignItems: "center", marginHorizontal: 5 },
  infoValue: { fontSize: 24, fontWeight: "bold", color: "#333" },
  infoLabel: { fontSize: 12, color: "gray", marginTop: 4 },
});
