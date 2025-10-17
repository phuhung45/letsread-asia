import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeIcon from "../assets/icons/HomeIcon";
import BookIcon from "../assets/icons/BookIcon";
import ProfileIcon from "../assets/icons/ProfileIcon";

export default function Header({currentTab = "Home" }: any) {
  const navigation = useNavigation<any>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [lang, setLang] = useState("English");
  const [user, setUser] = useState<{ name?: string; avatar_url?: string } | null>(null); // 👈 kiểm tra login hay chưa

  const handleLogin = () => {
    // ⚡ Ở đây bạn có thể gọi Supabase / API login / navigation
    console.log("Login button pressed");
    navigation.navigate("Login"); // hoặc mở popup login
  };

  const handleLogout = () => {
    // ⚡ Thực hiện logout
    setUser(null);
    console.log("User logged out");
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
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.menuItem}>
            <HomeIcon
              size={20}
              color={currentTab === "Home" ? "#1F8915" : "green"}
            />
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("MyBooks")}>
          <Text style={styles.menuItem}>
            <BookIcon
              size={20}
              color={currentTab === "MyBooks" ? "#1F8915" : "green"}
            />
            My Books
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Text style={styles.menuItem}>
            <ProfileIcon
              size={20}
              color={currentTab === "Profile" ? "#1F8915" : "green"}
            />
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Right Menu */}
      <View style={styles.rightMenu}>
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setLang(lang === "English" ? "Tiếng Việt" : "English")}
        >
          <Ionicons name="globe-outline" size={20} color="green" />
          <Text style={styles.langText}>{lang}</Text>
        </TouchableOpacity>

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
          {/* 👤 Header Side Menu */}
          <View style={styles.sideHeader}>
            <Image
              source={
                user
                  ? { uri: user.avatar_url }
                  : require("../assets/images/avatar.jpg")
              }
              style={styles.avatar}
            />
            <Text style={styles.username}>
              {user ? user.name : "Guest"}
            </Text>
          </View>

          {/* 🔐 Login / Logout */}
          {!user ? (
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginText}>Log in to your account</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogout}>
              <Text style={styles.loginText}>Log out</Text>
            </TouchableOpacity>
          )}

          {/* 📜 Menu phụ */}
          <View style={styles.menuList}>
            <View style={styles.menuRow}>
              <Ionicons name="globe-outline" size={20} color="#444" />
              <Text style={styles.menuLabel}>App Language</Text>
              <Text style={styles.langSmall}>{lang}</Text>
            </View>
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
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  username: { fontSize: 16, fontWeight: "600", color: "#333" },
  loginBtn: {
    borderWidth: 1,
    borderColor: "#22c55e",
    borderRadius: 6,
    padding: 8,
    marginBottom: 15,
  },
  loginText: { color: "green", textAlign: "center", fontSize: 14 },
  menuList: { marginTop: 10 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuLabel: { marginLeft: 10, fontSize: 15, color: "#333" },
  langSmall: { marginLeft: "auto", fontSize: 14, color: "#555" },
});
