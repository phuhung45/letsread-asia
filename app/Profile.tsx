import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ProfileScreen() {
  const { session } = useAuth();

  if (!session) {
    return (
      <View style={styles.center}>
        <Header title="Profile" /> {/* ✅ Header cố định trên cùng */}
        <View style={{ marginTop: 100 }}> {/* ✅ Đẩy nội dung xuống dưới header */}
          <Text style={styles.message}>
            Log in to access profiles, favorite books, and your reading goals
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/Login")}
          >
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Profile" /> {/* ✅ Full width header */}
      <View style={{ marginTop: 100, alignItems: "center" }}>
        <Image
          source={require("../assets/images/elephant_read.png")}
          style={styles.image}
        />
        <Text style={styles.title}>Today's Reading</Text>
        <Text style={styles.time}>0 min</Text>

        <View style={styles.weekContainer}>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <View key={index} style={styles.dayCircle}>
              <Text style={styles.dayText}>{day}</Text>
            </View>
          ))}
        </View>
      </View>
      <Footer activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
  },
  image: {
    width: 160,
    height: 160,
    resizeMode: "contain",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
  },
  time: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 10,
  },
  weekContainer: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
    marginBottom:200,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontWeight: "600",
  },
});
