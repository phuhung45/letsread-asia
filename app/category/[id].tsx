import { useLocalSearchParams } from "expo-router";
import { View, Text, ScrollView } from "react-native";

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
        Category: {id}
      </Text>
      {/* TODO: Fetch và render danh sách sách theo category id */}
      <Text>Sẽ load sách thuộc category này...</Text>
    </ScrollView>
  );
}
