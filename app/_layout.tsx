import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      {/* Home */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Book detail */}
      <Stack.Screen name="book/[id]" options={{ title: "Chi tiết sách" }} />

      {/* Category detail */}
      <Stack.Screen name="category/[id]" options={{ title: "Danh mục" }} />
    </Stack>
  );
}
