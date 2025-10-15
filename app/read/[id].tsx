import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Platform, Dimensions } from "react-native";
import { getBookPdf } from "../../lib/queries";
import { WebView } from "react-native-webview";

export default function ReadBook() {
  const { id, lang } = useLocalSearchParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const url = await getBookPdf(id as string, lang || "en");
      setPdfUrl(url);
      setLoading(false);
    })();
  }, [id, lang]);

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );

  if (!pdfUrl)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>❌ Không có file PDF cho sách này</Text>
      </View>
    );

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  // 🟢 Mobile: dùng WebView
  if (Platform.OS === "android" || Platform.OS === "ios") {
    return (
      <WebView
        originWhitelist={["*"]}
        source={{ uri: pdfUrl }}
        style={{ flex: 1, width: windowWidth, height: windowHeight }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    );
  }

  // 🟢 Web: dùng iframe
  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <iframe
        src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`}
        width="90%"
        height="95%"
        style={{
          border: "none",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          borderRadius: "8px",
        }}
      />
    </View>
  );
}
