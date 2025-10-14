import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: isMobile ? 16 : width < 1024 ? 100 : 450,
        marginVertical: 10,
        gap: 8,
      }}
    >
      {/* Search input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#f3f4f6",
          borderRadius: 10,
          flex: 1,
          paddingHorizontal: 10,
        }}
      >
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          placeholder="Start your search"
          value={query}
          onChangeText={setQuery}
          style={{
            flex: 1,
            marginLeft: 6,
            paddingVertical: isMobile ? 6 : 8,
            fontSize: isMobile ? 14 : 16,
          }}
        />
      </View>

      {/* Filter button */}
      <TouchableOpacity
        onPress={() => setShowFilter(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "green",
          paddingHorizontal: isMobile ? 8 : 12,
          paddingVertical: isMobile ? 6 : 8,
          borderRadius: 8,
        }}
      >
        <Ionicons name="options" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal visible={showFilter} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Filter</Text>
            <TouchableOpacity onPress={() => setShowFilter(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Nội dung Filter */}
          <ScrollView style={{ padding: 16 }}>
            <Text style={{ fontWeight: "600", marginBottom: 8 }}>Reading Level</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {["0", "1", "2", "3", "4", "5"].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: "#f3f4f6",
                  }}
                >
                  <Text>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 16,
              borderTopWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <TouchableOpacity>
              <Text style={{ color: "#10b981", fontWeight: "600" }}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "#22c55e",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
              }}
              onPress={() => setShowFilter(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Show Books</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
