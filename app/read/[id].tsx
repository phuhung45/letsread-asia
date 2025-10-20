import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function ReadBook() {
  const { id, lang } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [bookTitle, setBookTitle] = useState<string>("Untitled Book");
  const [languages, setLanguages] = useState<{ id: string; name: string }[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>((lang as string) || "");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [epubUrl, setEpubUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [progress, setProgress] = useState<number>(0);
  const progressRef = useRef(0);

  const [showDownloadPopup, setShowDownloadPopup] = useState(false);

  // 🔹 Lấy danh sách ngôn ngữ
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("book_content")
        .select("language_id, title, languages(name)")
        .eq("book_id", id);

      if (error) return console.error("Error fetching languages:", error);

      if (data && data.length > 0) {
        const langs = data.map((item: any) => ({
          id: item.language_id,
          name: item.languages?.name || item.language_id,
          title: item.title,
        }));

        setLanguages(langs);

        let defaultLang = (lang as string) || langs[0].id;
        if (!langs.some((l) => l.id === defaultLang)) defaultLang = langs[0].id;

        setSelectedLang(defaultLang);
        setBookTitle(langs.find((l) => l.id === defaultLang)?.title || "Untitled Book");
      }
    })();
  }, [id, lang]);

  // 🔹 Lấy file PDF/EPUB
  useEffect(() => {
    if (!id || !selectedLang) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("book_content")
        .select("pdf_url, epub_url, title")
        .eq("book_id", id)
        .eq("language_id", selectedLang)
        .maybeSingle();

      if (error) console.error("Error fetching content:", error);

      setPdfUrl(data?.pdf_url || null);
      setEpubUrl(data?.epub_url || null);
      setBookTitle(data?.title || "Untitled Book");
      setLoading(false);

      fetchProgress();
      insertUserRead(); // 🔹 Thêm row vào user_reads khi mở sách
    })();
  }, [selectedLang, id]);

  // 🔹 Lấy progress hiện tại
  const fetchProgress = async () => {
    if (!userId || !id || !selectedLang) return;
    try {
      const { data } = await supabase
        .from("user_reads")
        .select("progress")
        .eq("user_id", userId)
        .eq("book_id", id)
        .eq("language_id", selectedLang)
        .maybeSingle();
      const prog = data?.progress ?? 0;
      setProgress(prog);
      progressRef.current = prog;
    } catch (err) {
      console.error("Error fetching progress:", err);
    }
  };

  // 🔹 Insert row vào user_reads nếu chưa có
  const insertUserRead = async () => {
    if (!userId || !id || !selectedLang) return;
    try {
      const { data, error } = await supabase
        .from("user_reads")
        .upsert(
          [
            {
              user_id: userId,
              book_id: id,
              language_id: selectedLang,
              progress: 0,
            },
          ],
          { onConflict: ["user_id", "book_id", "language_id"] }
        );

      console.log("Insert/upsert user_reads:", { data, error });
    } catch (err) {
      console.error("Error inserting user_reads:", err);
    }
  };

  // 🔹 Cập nhật progress realtime
  const updateProgress = async (newProgress: number) => {
    setProgress(newProgress);
    progressRef.current = newProgress;
    if (!userId || !id || !selectedLang) return;
    try {
      const { data, error } = await supabase
        .from("user_reads")
        .upsert(
          [
            {
              user_id: userId,
              book_id: id,
              language_id: selectedLang,
              progress: newProgress,
            },
          ],
          { onConflict: ["user_id", "book_id", "language_id"] }
        );
      if (error) console.error("Error updating progress:", error);
      else console.log("Progress updated:", newProgress);
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  // 🔹 Nhận progress từ WebView
  const handleWebViewMessage = (event: any) => {
    const prog = Number(event.nativeEvent.data);
    if (!isNaN(prog) && prog >= 0 && prog <= 100) {
      updateProgress(prog);
    }
  };

  // 🔹 Popup download
  const handleDownload = () => {
    if (!pdfUrl && !epubUrl) return;
    setShowDownloadPopup(true);
  };

  const openFile = (url: string) => {
    if (Platform.OS === "web") window.open(url, "_blank");
    else Linking.openURL(url).catch(() => alert("Không thể mở file."));
    setShowDownloadPopup(false);
  };

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/");
        }}
      >
        <Ionicons name="arrow-back" size={22} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.left}>
        <Text numberOfLines={1} style={styles.title}>
          {bookTitle}
        </Text>
      </View>

      <View style={styles.centerHeader}>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedLang}
            onValueChange={(v) => {
              setSelectedLang(v);
              router.replace(`/read/${id}?lang=${v}`);
            }}
            style={styles.picker}
          >
            {languages.map((l) => (
              <Picker.Item key={l.id} label={l.name} value={l.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.right}>
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
          <Ionicons name="download" size={16} color="#fff" />
          <Text style={styles.downloadText}> Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const DownloadPopup = () => (
    <Modal transparent visible={showDownloadPopup} animationType="fade">
      <View style={styles.popupOverlay}>
        <View style={styles.popupBox}>
          <Text style={styles.popupTitle}>Tải xuống định dạng</Text>
          {pdfUrl && (
            <Pressable style={styles.popupBtn} onPress={() => openFile(pdfUrl)}>
              <Text style={styles.popupBtnText}>📄 PDF</Text>
            </Pressable>
          )}
          {epubUrl && (
            <Pressable style={styles.popupBtn} onPress={() => openFile(epubUrl)}>
              <Text style={styles.popupBtnText}>📚 EPUB</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.popupBtn, { backgroundColor: "#ccc" }]}
            onPress={() => setShowDownloadPopup(false)}
          >
            <Text style={[styles.popupBtnText, { color: "#333" }]}>Hủy</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  const ProgressBar = () => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
      <Text style={styles.progressText}>{progress}%</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <ProgressBar />
      <DownloadPopup />

      {(Platform.OS === "android" || Platform.OS === "ios") && pdfUrl && (
        <WebView
          originWhitelist={["*"]}
          source={{ uri: pdfUrl }}
          style={{ flex: 1, width: windowWidth, height: windowHeight }}
          onMessage={handleWebViewMessage}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
            </View>
          )}
        />
      )}

      {Platform.OS === "web" && pdfUrl && (
        <iframe
          title="pdf-viewer"
          src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
            pdfUrl
          )}`}
          width="90%"
          height="92%"
          style={{ border: "none", borderRadius: 8 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { paddingRight: 8 },
  left: { flex: 1, alignItems: "flex-start", paddingRight: 10 },
  centerHeader: { flex: 1, alignItems: "center" },
  right: { flex: 1, alignItems: "flex-end" },
  title: { fontSize: 18, fontWeight: "600", color: "#222", maxWidth: 180 },
  pickerWrapper: {
    width: "70%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
  },
  picker: { height: 40, width: "100%" },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  downloadText: { color: "#fff", fontWeight: "600" },
  popupOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  popupBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "30%",
    alignItems: "center",
  },
  popupTitle: { fontSize: 18, fontWeight: "600", marginBottom: 15 },
  popupBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
    width: "80%",
    alignItems: "center",
  },
  popupBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  progressBarContainer: {
    height: 20,
    backgroundColor: "#eee",
    borderRadius: 10,
    overflow: "hidden",
    width: "90%",
    marginVertical: 8,
    alignSelf: "center",
    position: "relative",
  },
  progressBar: { height: "100%", backgroundColor: "#4CAF50" },
  progressText: { position: "absolute", alignSelf: "center", color: "#fff", fontWeight: "700" },
});
