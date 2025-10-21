import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import HomeIcon from "../assets/icons/HomeIcon";
import BookIcon from "../assets/icons/BookIcon";
import ProfileIcon from "../assets/icons/ProfileIcon";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function Header({ currentTab = "Home" }: any) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLang, setSelectedLang] = useState("English");
  const { user, signOut } = useAuth();

  // ✅ Fetch language list từ Supabase
  useEffect(() => {
    const fetchLanguages = async () => {
      const { data, error } = await supabase.from("languages").select("id, name");
      if (!error && data) setLanguages(data);
    };
    fetchLanguages();
  }, []);

  const handleLogin = () => {
    router.push("/Login");
    setMenuVisible(false);
  };

  const handleLogout = async () => {
    await signOut();
    setMenuVisible(false);
  };

  const goHome = () => router.push("/");
  const goMyBooks = () => router.push("/Mybooks" as any);
  const goProfile = () => router.push("/Profile");
  const goUserProfile = () => {
    setMenuVisible(false);
    router.push("/UserProfile");
  };

  const handleLanguageSelect = (langName: string) => {
    setSelectedLang(langName);
    setMenuVisible(false);
  };

  return (
    <View style={styles.header}>
      {/* Logo */}
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Middle Menu */}
      <View style={styles.centerMenu}>
        <TouchableOpacity onPress={goHome}>
          <Text style={styles.menuItem}>
            <HomeIcon
              size={20}
              color={currentTab === "Home" ? "#1F8915" : "green"}
            />{" "}
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goMyBooks}>
          <Text style={styles.menuItem}>
            <BookIcon
              size={20}
              color={currentTab === "MyBooks" ? "#1F8915" : "green"}
            />{" "}
            My Books
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goProfile}>
          <Text style={styles.menuItem}>
            <ProfileIcon
              size={20}
              color={currentTab === "Profile" ? "#1F8915" : "green"}
            />{" "}
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Right Menu */}
      <View style={styles.rightMenu}>
        {/* Hiển thị ngôn ngữ đang chọn */}
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="globe-outline" size={20} color="green" />
          <Text style={styles.langText}>{selectedLang}</Text>
        </TouchableOpacity>

        {/* Avatar mở menu */}
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu-outline" size={35} color="green" />
        </TouchableOpacity>
      </View>

      {/* Side Menu */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        />
        <View style={styles.sideMenu}>
          {/* Header user info */}
          <TouchableOpacity style={styles.sideHeader} onPress={goUserProfile}>
            <Image
              source={
                user?.user_metadata?.avatar_url
                  ? { uri: user.user_metadata.avatar_url }
                  : require("../assets/images/avatar.jpg")
              }
              style={styles.avatar}
            />
            <View>
              <Text style={styles.username}>
                {user?.user_metadata?.fullname || user?.email || "Guest"}
              </Text>
              <Text style={styles.subText}>View profile</Text>
            </View>
          </TouchableOpacity>

          {/* Login / Logout */}
          {!user ? (
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginText}>Log in to your account</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogout}>
              <Text style={styles.loginText}>Log out</Text>
            </TouchableOpacity>
          )}

          {/* Hiển thị username trong menu */}
          {user && (
            <Text style={styles.menuUsername}>
              👤 {user?.user_metadata?.name || user?.email}
            </Text>
          )}

          {/* Danh sách ngôn ngữ */}
          <Text style={styles.sectionLabel}>🌐 Choose Language</Text>
          <ScrollView style={{ maxHeight: 150 }}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={styles.langRow}
                onPress={() => handleLanguageSelect(lang.name)}
              >
                <Ionicons
                  name={
                    lang.name === selectedLang
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={18}
                  color={lang.name === selectedLang ? "green" : "#777"}
                />
                <Text
                  style={[
                    styles.langItem,
                    lang.name === selectedLang && { color: "green" },
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Other menu items */}
          <View style={styles.menuList}>
            <View style={styles.menuRow}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#444"
              />
              <Text style={styles.menuLabel}>About Let's Read</Text>
            </View>
            <View style={styles.menuRow}>
              <Ionicons name="people-outline" size={20} color="#444" />
              <Text style={styles.menuLabel}>Collaborators</Text>
            </View>
            <View style={styles.menuRow}>
              <Ionicons name="document-text-outline" size={20} color="#444" />
              <Text style={styles.menuLabel}>Terms & Conditions</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
    justifyContent: "space-between",
  },
  logo: { width: 100, height: 35 },
  centerMenu: { flexDirection: "row", gap: 20 },
  rightMenu: { flexDirection: "row", alignItems: "center", gap: 15 },
  menuItem: { fontSize: 15, color: "green" },
  langBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  langText: { fontSize: 14, color: "green" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sideMenu: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "#fff",
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  sideHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: { width: 45, height: 45, borderRadius: 22 },
  username: { fontSize: 16, fontWeight: "600", color: "#333" },
  subText: { fontSize: 12, color: "#888" },
  loginBtn: {
    borderWidth: 1,
    borderColor: "#22c55e",
    borderRadius: 6,
    padding: 8,
    marginVertical: 10,
  },
  loginText: { color: "green", textAlign: "center", fontSize: 14 },
  menuUsername: {
    marginVertical: 8,
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  sectionLabel: {
    fontWeight: "600",
    fontSize: 14,
    color: "#444",
    marginTop: 10,
    marginBottom: 6,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  langItem: { marginLeft: 8, fontSize: 14, color: "#555" },
  menuList: { marginTop: 15 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuLabel: { marginLeft: 10, fontSize: 15, color: "#333" },
});
