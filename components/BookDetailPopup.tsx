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

interface Props {
  visible?: boolean;
  bookId: string | undefined;
  onClose: () => void;
}

const InfoItem = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoValue}>{value}</Text>
    <Text style={styles.infoLabel}>{label}</Text>
  </View>
);

const DetailRow = ({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value: string;
  isLink?: boolean;
}) => {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={isLink ? styles.detailLink : styles.detailValue}
        numberOfLines={isLink ? 1 : undefined}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  );
};

export default function BookDetailPopup({ visible = false, bookId, onClose }: Props) {
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [languagesList, setLanguagesList] = useState<{ id: string; name: string }[]>([]);

  const handleRead = () => {
    const url = book?.web_book_uuid ? `https://your-domain.com/read/${book.web_book_uuid}` : null;
    if (url) {
      Linking.openURL(url);
    } else {
      Alert.alert("Lỗi", "Không tìm thấy liên kết đọc sách.");
    }
  };

  const handleDownload = () => {
    const downloadUrl = book?.pdf_url || book?.epub_url;
    if (downloadUrl) {
      Linking.openURL(downloadUrl);
    } else {
      Alert.alert("Lỗi", "Không tìm thấy liên kết tải về (PDF/EPUB).");
    }
  };

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

      const { data: contentData } = await supabase
        .from("book_content")
        .select("pdf_url, epub_url")
        .eq("book_id", bookData.id)
        .maybeSingle();

      const categories =
        catData?.map((c: any) => c.categories?.name).filter(Boolean) ?? [];

      setBook({
        ...bookData,
        categories,
        pdf_url: contentData?.pdf_url || null,
        epub_url: contentData?.epub_url || null,
      });
    } catch (err: any) {
      console.error("❌ Lỗi fetchBookByLanguage:", err);
      Alert.alert("Lỗi tải dữ liệu", "Không thể tải chi tiết sách.");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (selectedLanguage && bookId) {
      fetchBookByLanguage(selectedLanguage);
    }
  }, [selectedLanguage]);

  if (!visible || !bookId) return null;

  const displayBook = book || {};
  const hasDownloadLink = displayBook.pdf_url || displayBook.epub_url;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* phần popup chính – chặn click ra ngoài */}
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
                  <TouchableOpacity style={styles.likeButton}>
                    <Text style={{ fontSize: 20 }}>♡</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.readDownloadRow}>
                  <TouchableOpacity
                    style={[styles.readButton, !displayBook.web_book_uuid && { opacity: 0.5 }]}
                    onPress={handleRead}
                    disabled={!displayBook.web_book_uuid}
                  >
                    <Text style={styles.readButtonText}>📖 Read</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.downloadButton, !hasDownloadLink && { opacity: 0.5 }]}
                    onPress={handleDownload}
                    disabled={!hasDownloadLink}
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

        {/* lớp nền ngoài để đóng popup */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

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
    borderRadius: 30,
    width: "100%",
    maxWidth: 900,
    maxHeight: "100%",
    overflow: "hidden",
    zIndex: 10,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 15,
    zIndex: 20,
    padding: 5,
  },
  closeButtonText: { fontSize: 24, color: "#333" },
  scrollViewContent: { padding: 24, alignItems: "center" },
  loadingView: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, color: "#555" },
  errorView: { padding: 30, alignItems: "center", width: "100%" },
  placeholderImage: { width: 150, height: 220, backgroundColor: "#e0e0e0", marginBottom: 20 },
  errorText: { textAlign: "center", marginBottom: 20, fontSize: 16, color: "#d32f2f" },
  errorCloseButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  errorCloseButtonText: { fontWeight: "bold", color: "#333" },
  coverImage: {
    width: 200,
    height: 270,
    borderRadius: 4,
    marginBottom: 16,
    backgroundColor: "#e5e7eb",
  },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  author: { textAlign: "center", color: "gray", marginBottom: 20 },
  actionRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginRight: 10,
    overflow: "hidden",
    height: 40,
    width: 400,
    justifyContent: "center",
  },
  languagePicker: { height: 40, color: "#333" },
  likeButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
  },
  readDownloadRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: 700,
    marginBottom: 20,
  },
  readButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    width: 400,
    paddingHorizontal: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  readButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  downloadButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 4,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadButtonText: { fontSize: 18, color: "#333" },
  bookDescription: {
    fontSize: 14,
    textAlign: "center",
    color: "gray",
    marginBottom: 20,
    paddingHorizontal: 10,
    marginLeft: "20%",
    marginRight: "20%",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 20,
  },
  infoItem: { flex: 1, alignItems: "center", marginHorizontal: 5 },
  infoValue: { fontSize: 24, fontWeight: "bold", color: "#333" },
  infoLabel: { fontSize: 12, color: "gray", marginTop: 4 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailLabel: { fontWeight: "600", color: "#333", flexBasis: "40%" },
  detailValue: { color: "#555", textAlign: "right", flexBasis: "60%", flexShrink: 1 },
  detailLink: {
    color: "#007bff",
    textAlign: "right",
    textDecorationLine: "underline",
    flexBasis: "60%",
    flexShrink: 1,
  },
});
