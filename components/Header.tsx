import React, { useState } from "react";
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
import { Colors } from "react-native/Libraries/NewAppScreen";

export default function Header({ navigation, currentTab = "Home" }: any) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [lang, setLang] = useState("English");

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
          <Text>
            <HomeIcon
            size={20}
            color={currentTab === "Home" ? "#1F8915" : "green"}
          />Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("MyBooks")}>
          <Text>
            <BookIcon
            size={20}
            color={currentTab === "MyBooks" ? "#1F8915" : "green"}
          />My Books</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Text>
                <ProfileIcon
            size={20}
            color={currentTab === "Profile" ? "#1F8915" : "green"}
          />Profile</Text>
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
          <TouchableOpacity style={styles.loginBtn}>
            <Text style={styles.loginText}>
              Log in to save your progress and favorite books
            </Text>
          </TouchableOpacity>

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
  centerMenu: {
    flexDirection: "row",
    gap: 20,
  },
  rightMenu: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    color: "green",
  },
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
  loginBtn: {
    borderWidth: 1,
    borderColor: "#22c55e",
    borderRadius: 6,
    padding: 8,
    marginBottom: 15,
  },
  loginText: {
    color: "green",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
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
