import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

type Language = { id: string; name: string };
type Category = { id: number; name: string };

export default function SearchBar() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  const levels = [0, 1, 2, 3, 4, 5];

  // === Load languages & categories ===
  useEffect(() => {
    const loadFilters = async () => {
      const [{ data: langs }, { data: cats }] = await Promise.all([
        supabase.from("languages").select("id, name"),
        supabase.from("categories").select("id, name"),
      ]);
      if (langs) setLanguages(langs);
      if (cats) setCategories(cats);
    };
    loadFilters();
  }, []);

  // === Main search & filter ===
  const applyFilter = async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params: Record<string, string> = {};
      if (searchText.trim()) params.q = searchText.trim();
      if (selectedLanguage) params.lang = selectedLanguage;
      if (selectedLevels.length > 0)
        params.levels = selectedLevels.join(",");
      if (selectedCategories.length > 0)
        params.cats = selectedCategories.join(",");

      // Summary for UI
      const summary: string[] = [];
      if (searchText.trim()) summary.push(`Keyword: ${searchText.trim()}`);
      if (selectedLanguage) {
        const lang = languages.find((l) => l.id === selectedLanguage);
        if (lang) summary.push(`Language: ${lang.name}`);
      }
      if (selectedLevels.length)
        summary.push(`Reading Level: ${selectedLevels.join(", ")}`);
      if (selectedCategories.length) {
        const cats = categories
          .filter((c) => selectedCategories.includes(c.id))
          .map((c) => c.name);
        summary.push(`Categories: ${cats.join(", ")}`);
      }

      setAppliedFilters(summary);
      setShowFilter(false);

      // 🔹 Navigate to results page
      router.push({
        pathname: "/SearchResults",
        params,
      });
    } catch (err) {
      console.error("❌ Filter error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setSearchText("");
    setSelectedLanguage(null);
    setSelectedLevels([]);
    setSelectedCategories([]);
    setAppliedFilters([]);
  };

  const toggleLevel = (lv: number) => {
    setSelectedLevels((prev) =>
      prev.includes(lv) ? prev.filter((x) => x !== lv) : [...prev, lv]
    );
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <View style={{ padding: 16 }}>
      {/* === Search Bar === */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 2,
          borderColor: "#22c55e",
          borderRadius: 25,
          paddingHorizontal: 12,
          backgroundColor: "#fff",
        }}
      >
        <Ionicons name="search" size={20} color="#22c55e" />
        <TextInput
          placeholder="Search books..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={applyFilter}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 6,
            fontSize: 16,
            color: "#333",
          }}
        />
        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          style={{
            backgroundColor: "#22c55e",
            borderRadius: 20,
            padding: 8,
          }}
        >
          <Ionicons name="options-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* === Applied filters summary === */}
      {appliedFilters.length > 0 && (
        <View
          style={{
            marginTop: 10,
            backgroundColor: "#f0fdf4",
            borderRadius: 8,
            padding: 8,
            borderColor: "#22c55e",
            borderWidth: 1,
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#166534", flex: 1, fontSize: 14 }}>
            {appliedFilters.join(", ")}
          </Text>
          <TouchableOpacity onPress={clearAll}>
            <Ionicons name="close-circle-outline" size={18} color="#166534" />
          </TouchableOpacity>
        </View>
      )}

      {/* === Filter Modal === */}
      <Modal visible={showFilter} animationType="slide">
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: "#fff",
            paddingHorizontal: 16,
            paddingTop: 40,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700" }}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilter(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Language */}
          <Text style={{ fontWeight: "600", marginBottom: 8 }}>Language</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                onPress={() =>
                  setSelectedLanguage(
                    selectedLanguage === lang.id ? null : lang.id
                  )
                }
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  margin: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor:
                    selectedLanguage === lang.id ? "#22c55e" : "#ccc",
                  backgroundColor:
                    selectedLanguage === lang.id ? "#dcfce7" : "#fff",
                }}
              >
                <Text>{lang.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reading Level */}
          <Text style={{ fontWeight: "600", marginTop: 16 }}>Reading Level</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {levels.map((lv) => (
              <TouchableOpacity
                key={lv}
                onPress={() => toggleLevel(lv)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  margin: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: selectedLevels.includes(lv)
                    ? "#22c55e"
                    : "#ccc",
                  backgroundColor: selectedLevels.includes(lv)
                    ? "#dcfce7"
                    : "#fff",
                }}
              >
                <Text>{lv}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Categories */}
          <Text style={{ fontWeight: "600", marginTop: 16 }}>Categories</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => toggleCategory(cat.id)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  margin: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: selectedCategories.includes(cat.id)
                    ? "#22c55e"
                    : "#ccc",
                  backgroundColor: selectedCategories.includes(cat.id)
                    ? "#dcfce7"
                    : "#fff",
                }}
              >
                <Text>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginVertical: 24,
              alignItems: "center",
            }}
          >
            <TouchableOpacity onPress={clearAll}>
              <Text style={{ color: "#22c55e", fontWeight: "600" }}>
                Clear All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={applyFilter}
              disabled={isLoading}
              style={{
                backgroundColor: "#22c55e",
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {isLoading && (
                <ActivityIndicator
                  color="#fff"
                  size="small"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Show Books
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}
