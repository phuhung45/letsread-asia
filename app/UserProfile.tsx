import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

const AVATAR_LIST = [
  "https://storage.googleapis.com/lets-read-asia/assets/images/adcfa051-9cfc-431c-8625-739ebc6eb316.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/2b571f5b-e352-46ef-950c-4942b9b021b9.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/fb7525fa-7423-4287-bf42-e356e8ccd682.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/c8db41cf-c960-4f8c-9c6d-5addf8f8e740.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/0ae7812f-fa15-4eb8-af83-fc0cb4d266f9.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/7b0793cd-9a5f-4035-8465-9197f1e6c891.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/0c33748d-eef8-4977-a370-88d6f33981f1.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/bc2e685d-3e54-4570-b144-03b3a090131d.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/0b02db12-b916-4e7a-90af-240fc7ad1a83.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/27eb7344-c6a1-487a-ae7b-9436f42ee666.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/e4507e83-16cb-424a-8a7e-3b73e2dd9073.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/51a1367d-d10b-451c-b033-dcdfad6d504d.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/6d340601-f9bf-4b3d-b8e7-6ad960531a45.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/f8db361a-eedd-4d24-93e9-2b53b228061b.png",
  "https://storage.googleapis.com/lets-read-asia/assets/images/5bc71f3e-73c4-4838-9ada-d31e7d181c03.png",
  "",
];


export default function UserProfile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullname, setFullname] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  // Thêm state cho modal đổi mật khẩu
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/Login");
        return;
      }
      setUser(data.user);
      setFullname(data.user.user_metadata?.fullname || "");
      setAvatar(data.user.user_metadata?.avatar_url || AVATAR_LIST[0]);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.auth.updateUser({
      data: { fullname, avatar_url: avatar },
    });
    if (error)
      Toast.show({ type: "error", text1: "Update failed", text2: error.message });
    else Toast.show({ type: "success", text1: "Profile updated successfully!" });
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Toast.show({
        type: "error",
        text1: "Password must be at least 6 characters",
      });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error)
      Toast.show({ type: "error", text1: "Password change failed", text2: error.message });
    else Toast.show({ type: "success", text1: "Password changed successfully!" });
    setShowPasswordModal(false);
    setNewPassword("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/Login");
  };

  const handleBackHome = () => {
    router.push("/"); // redirect về Home
  };

  if (loading) return <ActivityIndicator size="large" color="#007bff" style={{ flex: 1 }} />;

  // Chia AVATAR_LIST thành các hàng 4 ảnh
  const rows: string[][] = [];
  for (let i = 0; i < AVATAR_LIST.length; i += 4) {
    rows.push(AVATAR_LIST.slice(i, i + 4));
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>User Profile</Text>

      {/* Avatar */}
      <Image source={{ uri: avatar! }} style={styles.avatar} />
      <Text style={{ marginVertical: 8 }}>Choose your avatar:</Text>

      <View style={styles.avatarGrid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.avatarRow}>
            {row.map((url) => (
              <TouchableOpacity key={url} onPress={() => setAvatar(url)}>
                <Image
                  source={{ uri: url }}
                  style={[
                    styles.avatarOption,
                    avatar === url && { borderColor: "#007bff", borderWidth: 2 },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* User info */}
      <Text style={styles.label}>Email:</Text>
      <Text>{user.email}</Text>

      <Text style={styles.label}>Full name:</Text>
      <TextInput style={styles.input} value={fullname} onChangeText={setFullname} />

      {/* Buttons */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.btnText}>Save Changes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => setShowPasswordModal(true)}
      >
        <Text style={styles.btnText}>Change Password</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: "#6c757d" }]} onPress={handleLogout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: "#343a40" }]} onPress={handleBackHome}>
        <Text style={styles.btnText}>Back to Home</Text>
      </TouchableOpacity>

      {/* Modal đổi mật khẩu */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Enter new password:</Text>
            <TextInput
              style={styles.input}
              placeholder="New password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
              <TouchableOpacity style={[styles.btn, { flex: 1, marginRight: 5 }]} onPress={handleChangePassword}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { flex: 1, backgroundColor: "#6c757d", marginLeft: 5 }]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, alignSelf: "center", marginBottom: 10 },
  avatarGrid: { marginBottom: 20 },
  avatarRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  avatarOption: { width: 60, height: 60, borderRadius: 30 },
  label: { marginTop: 10, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginTop: 5 },
  saveBtn: { backgroundColor: "#007bff", padding: 12, borderRadius: 8, marginTop: 20, alignItems: "center" },
  btn: { backgroundColor: "#28a745", padding: 12, borderRadius: 8, marginTop: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { width: "80%", backgroundColor: "#fff", padding: 20, borderRadius: 10 },
});
