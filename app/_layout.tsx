import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import Toast from "react-native-toast-message";

export default function Layout() {
  return (
    <AuthProvider>
      <>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Home */}
          <Stack.Screen name="index" />

          {/* Auth */}
          <Stack.Screen name="Login" />
          <Stack.Screen name="Register" />
          <Stack.Screen name="Profile" />

          {/* Book detail */}
          <Stack.Screen name="book/[id]" options={{ title: "Book detail" }} />

          {/* Read page */}
          <Stack.Screen name="read/[id]" />
          <Stack.Screen name="Mybooks" options={{ title: "Mybooks" }} />
          <Stack.Screen name="UserProfile" options={{ title: "UserProfile" }} />

          {/* Category detail */}
          <Stack.Screen name="category/[id]" options={{ title: "Category" }} />
        </Stack>

        {/* 👇 Toast phải nằm ngoài Stack để hiển thị global */}
        <Toast />
      </>
    </AuthProvider>
  );
}
