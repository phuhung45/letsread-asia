import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import Toast from "react-native-toast-message";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập email và mật khẩu",
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    console.log("📩 Login result:", { data, error });

    if (error) {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: error.message,
      });
    } else {
      Toast.show({
        type: "success",
        text1: "Login success",
      });

      // Đợi 1 chút để người dùng thấy toast
      setTimeout(() => {
        router.push("/UserProfile");
      }, 800);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.box}>
        <Text style={styles.title}>Login to Letsread</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in ..." : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/Register")}>
         <h4> Don't have an account?<Text style={styles.link}>  Sign up</Text></h4>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  box: {
    width: "100%",
    maxWidth: 400,
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link: { marginTop: 15, color: "#007BFF", textAlign: "center" },
});
