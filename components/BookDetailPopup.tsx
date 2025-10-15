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

const InfoItem = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value ?? "-"}</Text>
  </View>
);

export default function BookDetailPopup({ visible = false, bookId, onClose }: Props) {
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [languagesList, setLanguagesList] = useState<{ id: string; name: string }[]>([]);
  const [favorite, setFavorite] = useState(false);

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

  // ✅ 2. Nút DOWNLOAD — giữ nguyên logic của bạn
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

  // =========================
  // fetchBookByLanguage - giữ nguyên logic SQL của bạn (không sửa query)
  // =========================
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

  // ✅ Add to favorite (đơn giản)
  const handleAddFavorite = async () => {
    if (!book) return;
    try {
      const { error } = await supabase.from("favorites").insert([{ book_id: book.id }]);
      if (error) throw error;
      setFavorite(true);
      Alert.alert("Đã thêm vào yêu thích");
    } catch (err) {
      console.error("❌ Lỗi thêm favorite:", err);
      Alert.alert("Lỗi", "Không thể thêm vào yêu thích.");
    }
  };

  if (!visible || !bookId) return null;

  const displayBook = book || {};

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.popupContainer}>
            {/* Close */}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Content */}
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
                {/* Cover */}
                <View style={styles.coverWrap}>
                  <Image
                    source={{ uri: displayBook.cover_image }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Title & author */}
                <Text style={styles.title}>{displayBook.title}</Text>
                <Text
                  style={styles.author}
                  onPress={() => {
                    // nếu có link tác giả, mở; else noop
                    if (displayBook.author_url) Linking.openURL(displayBook.author_url);
                  }}
                >
                  {displayBook.author}
                </Text>

                {/* Language picker + favorite (row) */}
                <View style={styles.pickerRow}>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedLanguage}
                      onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
                      style={styles.languagePicker}
                      dropdownIconColor="#333"
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

                  <TouchableOpacity
                    style={[styles.favoriteButton, favorite && styles.favoriteActive]}
                    onPress={handleAddFavorite}
                  >
                    <Text style={styles.favoriteText}>{favorite ? "♥ Favorited" : "♡ Add to favorite"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Read & download */}
                <View style={styles.readDownloadRow}>
                  <TouchableOpacity
                    style={[styles.readButton, !displayBook.book_uuid && { opacity: 0.5 }]}
                    onPress={handleRead}
                    disabled={!displayBook.book_uuid}
                  >
                    <Text style={styles.readButtonText}>📖 Read</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                    <Text style={styles.downloadButtonText}>⬇</Text>
                  </TouchableOpacity>
                </View>

                {/* Short description */}
                <Text style={styles.bookDescription}>
                  {displayBook.description || "Không có mô tả."}
                </Text>

                {/* Info Grid (Reading Level / Pages / Available Languages) */}
                <View style={styles.infoGrid}>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridValue}>{displayBook.reading_level ?? "-"}</Text>
                    <Text style={styles.gridLabel}>Reading Level</Text>
                  </View>
                  <View style={styles.gridSep} />
                  <View style={styles.gridItem}>
                    <Text style={styles.gridValue}>{displayBook.pages ?? "-"}</Text>
                    <Text style={styles.gridLabel}>Pages</Text>
                  </View>
                  <View style={styles.gridSep} />
                  <View style={styles.gridItem}>
                    <Text style={styles.gridValue}>{(displayBook.availableLanguages ?? languagesList)?.length ?? languagesList.length}</Text>
                    <Text style={styles.gridLabel}>Available Languages</Text>
                  </View>
                </View>

                {/* DETAILS SECTION - each row separated by hr */}
                <View style={styles.detailsContainer}>
                  <View style={styles.hr} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Publisher:</Text>
                    <Text
                      style={styles.detailValueLink}
                      onPress={() => {
                        if (displayBook.original_url) Linking.openURL(displayBook.original_url);
                      }}
                    >
                      {displayBook.publisher ?? "-"}
                    </Text>
                  </View>

                  <View style={styles.hr} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Illustrator:</Text>
                    <Text style={styles.detailValue}>{displayBook.illustrator ?? "-"}</Text>
                  </View>

                  <View style={styles.hr} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Categories:</Text>
                    <Text style={styles.detailValue}>
                      {displayBook.categories?.length ? displayBook.categories.join(", ") : "-"}
                    </Text>
                  </View>

                  <View style={styles.hr} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Source Language:</Text>
                    <Text style={styles.detailValue}>{displayBook.source_language ?? displayBook.source_language_id ?? "-"}</Text>
                  </View>

                  <View style={styles.hr} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Country of Origin:</Text>
                    <Text style={styles.detailValue}>{displayBook.country_of_origin ?? "-"}</Text>
                  </View>

                  <View style={styles.hr} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Original Url:</Text>
                    <Text
                      style={styles.detailValueLink}
                      onPress={() => {
                        if (displayBook.original_url) Linking.openURL(displayBook.original_url);
                      }}
                    >
                      {displayBook.original_url ?? "-"}
                    </Text>
                  </View>

                  <View style={styles.hr} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>License:</Text>
                    <Text style={styles.detailValue}>{displayBook.license ?? "-"}</Text>
                  </View>

                  <View style={styles.hr} />
                  <View style={styles.notesRow}>
                    <Text style={styles.detailLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{displayBook.notes ?? "-"}</Text>
                  </View>

                  <View style={styles.hr} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={styles.detailValue}>{displayBook.status ?? "Complete"}</Text>
                  </View>

                  <View style={styles.hr} />
                  <TouchableOpacity
                    style={styles.reportRow}
                    onPress={() => {
                      // nếu có trang báo lỗi, mở; nếu không, alert
                      if (displayBook.book_uuid) {
                        // mở modal báo lỗi hoặc trang report — giữ đơn giản bằng Alert / Linking
                        Alert.alert("Report", "Bạn muốn báo cáo sự cố với sách này?");
                      } else {
                        Alert.alert("Info", "Không có thông tin để báo cáo.");
                      }
                    }}
                  >
                    <Text style={styles.reportText}>Report an issue with the book</Text>
                  </TouchableOpacity>
                </View>

                {/* bottom padding */}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* backdrop to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

// ==========================
// Styles
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
    paddingHorizontal: "10%", // ✅ cách lề mỗi bên 10%
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: "center",
  },

  coverWrap: {
    width: 160,
    height: 220,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 6,
    backgroundColor: "#f7f7f7",
    marginBottom: 12,
  },
  coverImage: { width: "100%", height: "100%" },

  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginTop: 6 },
  author: { textAlign: "center", color: "#1e88e5", marginBottom: 12 },

  // picker + favorite row
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 14,
  },
  pickerWrapper: {
    width: "90%", // ✅ dropdown 90%
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    overflow: "hidden",
    height: 48,
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  languagePicker: { height: 48 },

  favoriteButton: {
    width: "10%", // ✅ favorite 10%
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    height: 48,
    marginLeft: 6,
  },
  favoriteActive: { backgroundColor: "#fdecea", borderColor: "#f5b4b4" },
  favoriteText: { color: "#333", fontWeight: "600", fontSize: 10, textAlign: "center" },

  readDownloadRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  readButton: {
    width: "90%", // ✅ read 90%
    backgroundColor: "#11813a",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  readButtonText: { color: "#fff", fontWeight: "700" },

  downloadButton: {
    width: "10%", // ✅ download 10%
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    height: 48,
    marginLeft: 6,
  },
  downloadButtonText: { color: "#333", fontSize: 18 },

  bookDescription: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 18,
    width: "100%",
  },

  // info grid
  infoGrid: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 16,
    marginBottom: 18,
  },
  gridItem: { flex: 1, alignItems: "center" },
  gridValue: { fontSize: 28, fontWeight: "800" },
  gridLabel: { fontSize: 12, color: "#888", marginTop: 8 },
  gridSep: { width: 1, height: 48, backgroundColor: "#eee" },

  // details
  detailsContainer: {
    width: "100%",
    paddingVertical: 8,
  },
  hr: { height: 1, backgroundColor: "#eee", marginVertical: 12 },

  detailRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: { fontSize: 14, color: "#333", width: 140 },
  detailValue: { fontSize: 14, color: "#555", flex: 1 },
  detailValueLink: { fontSize: 14, color: "#1e88e5", flex: 1, textDecorationLine: "underline" },

  notesRow: {
    paddingVertical: 4,
  },
  notesText: { color: "#555", fontSize: 14, lineHeight: 20 },

  infoRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 12, color: "#777" },
  infoValue: { fontSize: 14, color: "#333", fontWeight: "600" },

  reportRow: {
    paddingVertical: 8,
  },
  reportText: { color: "#1e88e5", textDecorationLine: "underline" },
});
