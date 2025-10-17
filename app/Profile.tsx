import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin người dùng hiện tại
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/login");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };

    getUser();

    // Lắng nghe sự thay đổi trạng thái đăng nhập (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Đăng xuất
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Lỗi", error.message);
    else router.replace("/login");
  };

  if (loading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông tin tài khoản</Text>
      <View style={styles.card}>
        <Text style={styles.label}>ID:</Text>
        <Text style={styles.value}>{user?.id}</Text>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  label: { fontWeight: "bold", fontSize: 16, marginTop: 10 },
  value: { fontSize: 16, color: "#333" },
  button: { backgroundColor: "#dc3545", padding: 12, borderRadius: 8, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
