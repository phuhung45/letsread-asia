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

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Missing information",
        text2: "Please fill in email, password, and confirm password.",
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Passwords do not match",
        text2: "Please make sure both passwords are the same.",
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:8081/Login",
      },
    });

    setLoading(false);
    console.log("📩 Register result:", { data, error });

    if (error) {
      Toast.show({
        type: "error",
        text1: "Registration failed",
        text2: error.message,
      });
      return;
    }

    // ✅ Nếu user đã tồn tại, Supabase trả user.identities = []
    if (data?.user && data.user.identities?.length === 0) {
      Toast.show({
        type: "error",
        text1: "Email already registered",
        text2: "Please log in or use a different email address.",
      });
      return;
    }

    if (data?.user) {
      Toast.show({
        type: "success",
        text1: "Registration successful",
        text2: "Please check your email to verify your account.",
      });

      setTimeout(() => {
        router.push("/Login");
      }, 1500);
    } else {
      Toast.show({
        type: "info",
        text1: "Verification required",
        text2:
          "We have sent a verification link to your email. Please check your inbox.",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.box}>
        <Text style={styles.title}>Register new account</Text>

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

        <TextInput
          style={styles.input}
          placeholder="Re-enter Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Processing..." : "Register"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/Login")}>
          <Text style={styles.link}>
            Already have an account?{" "}
            <Text style={{ color: "#007bff" }}>Login</Text>
          </Text>
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
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
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
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  link: { marginTop: 15, color: "#28a745", textAlign: "center" },
});
