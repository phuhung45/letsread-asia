import { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";

function normalizeCover(url?: string | null): string {
  if (!url) return "https://via.placeholder.com/230x160.png?text=No+Cover";
  let coverUrl = url.replace(/^http:\/\//, "https://");
  return encodeURI(coverUrl);
}

export default function CategoryRow({ cat }: { cat: any }) {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const [scrollX, setScrollX] = useState(0);

  const gap = 12;
  const contentWidth = screenWidth * 0.8;
  const desiredItemWidth = 150;
  const maxItemsPerRow = 4;

  const itemsPerRow = Math.min(
    Math.floor((contentWidth + gap) / (desiredItemWidth + gap)),
    maxItemsPerRow
  );

  const itemWidth = (contentWidth - (itemsPerRow - 1) * gap) / itemsPerRow;
  const itemHeight = itemWidth * 1.5;

  const maxScrollX = cat.books.length * (itemWidth + gap) - contentWidth;
  const disablePrev = scrollX <= 0;
  const disableNext = scrollX >= maxScrollX - 10;

  const handleScroll = (direction: "prev" | "next") => {
    const step = contentWidth;
    let nextX =
      direction === "next" ? scrollX + step : Math.max(0, scrollX - step);
    scrollRef.current?.scrollTo({ x: nextX, animated: true });
    setScrollX(nextX);
  };

  return (
    <View key={cat.id} style={{ alignItems: "center", marginBottom: 30 }}>
      {/* Header category */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: contentWidth,
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "700" }}>{cat.name}</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/category/[id]",
                params: { id: cat.id },
              })
            }
          >
            <Text style={{ color: "green", fontWeight: "600" }}>See All</Text>
          </TouchableOpacity>

          {/* Prev */}
          <TouchableOpacity
            onPress={() => handleScroll("prev")}
            disabled={disablePrev}
            style={{
              padding: 6,
              backgroundColor: "#fff",
              borderRadius: 20,
              opacity: disablePrev ? 0.4 : 1,
            }}
          >
            <Text>⬅️</Text>
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity
            onPress={() => handleScroll("next")}
            disabled={disableNext}
            style={{
              padding: 6,
              backgroundColor: "#fff",
              borderRadius: 20,
              opacity: disableNext ? 0.4 : 1,
            }}
          >
            <Text>➡️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Book list */}
      <View style={{ width: contentWidth, height: itemHeight + 70 }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap }}
          onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
        >
          {cat.books.map((book: any) => (
            <TouchableOpacity
              key={book.id}
              style={{
                width: itemWidth,
                height: itemHeight + 70,
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 8,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 3,
              }}
              onPress={() =>
                router.push({
                  pathname: "/book/[id]",
                  params: { id: book.id },
                })
              }
            >
              <Image
                source={{ uri: normalizeCover(book.cover_url) }}
                style={{
                  width: "100%",
                  height: itemHeight * 0.9,
                  borderRadius: 8,
                  backgroundColor: "#e5e7eb",
                }}
                resizeMode="cover"
              />
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 15,
                  marginTop: 15,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {book.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
