import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getBookWithLanguages } from "../../lib/queries";
import { Ionicons } from "@expo/vector-icons";

export default function BookDetail({ route }) {
  const { uuid } = route.params;
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState("");

  useEffect(() => {
    async function fetchBook() {
      setLoading(true);
      const data = await getBookWithLanguages(uuid);
      if (data) {
        setBook(data);
        if (data.languages && data.languages.length > 0)
          setSelectedLang(data.languages[0].id.toString());
      }
      setLoading(false);
    }
    fetchBook();
  }, [uuid]);

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text className="mt-3 text-gray-600">Đang tải chi tiết sách...</Text>
      </View>
    );

  if (!book)
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Không tìm thấy dữ liệu chi tiết sách.</Text>
      </View>
    );

  return (
    <ScrollView className="p-4">
      <View className="items-center">
        {book.cover_url && (
          <Image
            source={{ uri: book.cover_url }}
            className="w-48 h-64 rounded-xl"
            resizeMode="cover"
          />
        )}
        <Text className="text-xl font-bold mt-3 text-center">{book.title}</Text>
        <Text className="text-gray-600">{book.author}</Text>

        <View className="w-full mt-4 border rounded-lg overflow-hidden">
          <Picker
            selectedValue={selectedLang}
            onValueChange={(value) => setSelectedLang(value)}
          >
            {book.languages && book.languages.length > 0 ? (
              book.languages.map((lang: any) => (
                <Picker.Item
                  key={lang.id}
                  label={lang.name}
                  value={lang.id.toString()}
                />
              ))
            ) : (
              <Picker.Item
                label="No language available"
                value=""
                color="#999"
              />
            )}
          </Picker>
        </View>

        <TouchableOpacity className="bg-green-600 w-full py-2 mt-4 rounded-xl">
          <Text className="text-center text-white font-semibold">Read</Text>
        </TouchableOpacity>

        <Text className="mt-4 text-center text-gray-700">
          {book.description || "No description available."}
        </Text>
      </View>
    </ScrollView>
  );
}
