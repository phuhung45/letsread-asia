import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/AuthContext"; // dùng context login của bạn

export default function ProfileScreen() {
  const { session } = useAuth();

  if (!session) {
    return (
      <View style={styles.center}>
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
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/elephant_read.png")} // ảnh bạn có thể thay
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
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
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
