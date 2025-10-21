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

  const [bookTitle, setBookTitle] = useState("Untitled Book");
  const [languages, setLanguages] = useState<{ id: string; name: string; title: string }[]>([]);
  const [selectedLang, setSelectedLang] = useState((lang as string) || "");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [epubUrl, setEpubUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const lastUpdateTs = useRef(0);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);

  // ---------- Fetch languages ----------
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("book_content")
        .select("language_id, title, languages(name)")
        .eq("book_id", id);

      if (error) {
        console.error("❌ Error fetching languages:", error);
        return;
      }

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

  // ---------- Fetch content ----------
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

      if (error) console.error("❌ Error fetching content:", error);

      setPdfUrl(data?.pdf_url || null);
      setEpubUrl(data?.epub_url || null);
      setBookTitle(data?.title || "Untitled Book");
      setLoading(false);

      await fetchProgress();
    })();
  }, [selectedLang, id]);

  // ---------- Fetch progress ----------
  const fetchProgress = async () => {
    if (!userId || !id) return;
    console.log("🔍 Fetching progress for user:", userId, "book:", id);
    const { data, error } = await supabase
      .from("user_reads")
      .select("progress")
      .eq("user_id", userId)
      .eq("book_id", id)
      .maybeSingle();

    if (error) {
      console.error("❌ fetchProgress error:", error);
      return;
    }

    if (data) {
      const prog = Number(data.progress ?? 0);
      console.log("✅ Current progress (fetched):", prog);
      setProgress(prog);
      progressRef.current = prog;
    } else {
      console.log("ℹ️ No progress found → insert new row");
      await insertUserRead();
      setProgress(0);
      progressRef.current = 0;
    }
  };

  // ---------- Insert initial user_reads ----------
  const insertUserRead = async () => {
    if (!userId || !id) return;
    const { error } = await supabase.from("user_reads").insert([
      {
        user_id: userId,
        book_id: id,
        progress: 0,
      },
    ]);
    if (error) console.error("❌ Insert error:", error);
    else console.log("✅ Inserted new user_reads record");
  };

  // ---------- Update progress ----------
  const updateProgress = async (newProgress: number) => {
    const np = Math.max(0, Math.min(100, Math.round(newProgress)));
    const prev = progressRef.current ?? 0;
    if (Math.abs(np - prev) < 1) return;

    const now = Date.now();
    if (now - lastUpdateTs.current < 1000) {
      setProgress(np);
      progressRef.current = np;
      return;
    }
    lastUpdateTs.current = now;

    if (!userId || !id) return;

    console.log(`⬆️ Upserting progress: ${np}% for user=${userId}, book=${id}`);
    const { error } = await supabase
      .from("user_reads")
      .upsert(
        [
          {
            user_id: userId,
            book_id: id,
            progress: np,
          },
        ],
        { onConflict: "user_id,book_id" } // 🔥 chỉ 1 bản ghi duy nhất / người / sách
      );

    if (error) console.error("❌ Upsert error:", error);
    else {
      console.log("✅ Progress updated to:", np);
      setProgress(np);
      progressRef.current = np;
    }
  };

  // ---------- PDF.js HTML (mobile) ----------
  const makePdfJsHTML = (pdfUrlStr: string) => `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
html,body{height:100%;margin:0;padding:0;background:#fff;}
#viewerContainer{height:100vh;overflow:auto;}
canvas{display:block;margin:0 auto 8px;}
</style>
</head>
<body>
<div id="viewerContainer"></div>
<script src="https://unpkg.com/pdfjs-dist@3.10.116/build/pdf.min.js"></script>
<script>
  const url = '${pdfUrlStr.replace(/'/g, "%27")}';
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.10.116/build/pdf.worker.min.js';
  let pdfDoc = null;
  const container = document.getElementById('viewerContainer');
  function renderPage(num){
    pdfDoc.getPage(num).then(p=>{
      const v = p.getViewport({scale:1.2});
      const c = document.createElement('canvas');
      c.width=v.width;c.height=v.height;
      const ctx=c.getContext('2d');
      p.render({canvasContext:ctx,viewport:v}).promise.then(()=>container.appendChild(c));
    });
  }
  function renderAll(){
    for(let i=1;i<=pdfDoc.numPages;i++) renderPage(i);
  }
  function sendProgress(){
    const st=container.scrollTop,sh=container.scrollHeight-container.clientHeight;
    const prog=sh>0?Math.floor(st/sh*100):0;
    window.ReactNativeWebView?.postMessage(String(prog));
  }
  let throttled=false;
  container.addEventListener('scroll',()=>{if(!throttled){throttled=true;sendProgress();setTimeout(()=>throttled=false,800);}});
  pdfjsLib.getDocument(url).promise.then(pdf=>{pdfDoc=pdf;renderAll();sendProgress();});
</script>
</body>
</html>
`;

  const handleWebViewMessage = (event: any) => {
    const data = event.nativeEvent?.data;
    const prog = Number(data);
    if (!isNaN(prog)) updateProgress(prog);
  };

  // ---------- Download ----------
  const handleDownload = () => setShowDownloadPopup(true);
  const openFile = (url: string) => {
    if (Platform.OS === "web") window.open(url, "_blank");
    else Linking.openURL(url);
    setShowDownloadPopup(false);
  };

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
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

  const ProgressBar = () => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
      <Text style={styles.progressText}>{progress}%</Text>
    </View>
  );

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <ProgressBar />
      <DownloadPopup />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          {(Platform.OS === "android" || Platform.OS === "ios") && pdfUrl && (
            <WebView
              originWhitelist={["*"]}
              source={{ html: makePdfJsHTML(pdfUrl) }}
              style={{ flex: 1, width: windowWidth, height: windowHeight }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
            />
          )}
          {Platform.OS === "web" && pdfUrl && (
            <iframe
              title="pdf"
              src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`}
              style={{ width: "100%", height: "calc(100vh - 140px)", border: "none" }}
            />
          )}
        </>
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
  left: { flex: 1 },
  centerHeader: { flex: 1, alignItems: "center" },
  right: { flex: 1, alignItems: "flex-end" },
  title: { fontSize: 18, fontWeight: "600", color: "#222" },
  pickerWrapper: {
    width: "70%",
    borderRadius: 8,
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
