import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Home */}
      <Stack.Screen name="index" />

      {/* Auth */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />

      {/* Book detail */}
      <Stack.Screen name="book/[id]" options={{ title: "Book detail" }} />

      {/* Read page */}
      <Stack.Screen name="read/[id]" />

      {/* Category detail */}
      <Stack.Screen name="category/[id]" options={{ title: "Category" }} />
    </Stack>
  );
}
