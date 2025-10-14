import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ScrollView,
} from "react-native";
// import BookDetailPopup from "./BookDetailPopup"; // ❌ KHÔNG CẦN NHẬP KHI POPUP ĐƯỢC QUẢN LÝ Ở COMPONENT CHA

type Props = {
  categories?: any[];
  // ✅ BỔ SUNG: Prop này được truyền từ Index.tsx để mở Popup
  onSelectBook?: (book: any) => void; 
};

function CategoryRow({
  cat,
  itemWidth,
  itemHeight,
  gap,
  itemsPerRow,
  contentWidth,
  onSelectBook, // ✅ NHẬN PROP TỪ COMPONENT CHA
}: any) {
  const [startIndex, setStartIndex] = useState(0);
  
  // ❌ ĐÃ XÓA: State quản lý popup không còn cần thiết ở đây
  // const [selectedBook, setSelectedBook] = useState<any | null>(null);
  // const [popupVisible, setPopupVisible] = useState(false);

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(prev + itemsPerRow, (cat.books?.length || 0) - 1)
    );
  };

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - itemsPerRow, 0));
  };

  const visibleBooks = Array.isArray(cat.books)
    ? cat.books.slice(startIndex, startIndex + itemsPerRow)
    : [];

  return (
    <View key={cat.id} style={{ marginBottom: 30, alignItems: "center" }}>
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

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={handlePrev}
            disabled={startIndex === 0}
            style={{ marginRight: 12 }}
          >
            <Text style={{ fontSize: 16, opacity: startIndex === 0 ? 0.4 : 1 }}>
              ◀
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            disabled={startIndex + itemsPerRow >= (cat.books?.length || 0)}
          >
            <Text
              style={{
                fontSize: 16,
                opacity:
                  startIndex + itemsPerRow >= (cat.books?.length || 0)
                    ? 0.4
                    : 1,
              }}
            >
              ▶
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Books grid */}
      {visibleBooks.length > 0 ? (
        <View
          style={{
            flexDirection: "row",
            width: contentWidth,
          }}
        >
          {visibleBooks.map((book: any, index: number) => (
            <TouchableOpacity
              key={book.book_uuid || book.id} // Sử dụng book_uuid hoặc id để tránh lỗi key
              // ✅ SỬA LỖI: Gọi hàm onSelectBook được truyền xuống để mở popup bên ngoài
              onPress={() => {
                if (onSelectBook) {
                  onSelectBook(book); 
                }
              }}
              style={{
                width: itemWidth,
                height: itemHeight + 70,
                alignItems: "center",
                marginRight: index !== visibleBooks.length - 1 ? gap : 0,
              }}
            >
              <Image
                source={{ uri: book.cover_image }}
                style={{
                  width: "80%",
                  height: itemHeight * 0.7,
                  borderRadius: 8,
                  marginBottom: 4,
                  backgroundColor: "#e5e7eb",
                }}
                resizeMode="cover"
              />
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                {book.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text
          style={{
            textAlign: "center",
            color: "gray",
            fontSize: 13,
            marginTop: 10,
          }}
        >
          Không có sách nào trong danh mục này
        </Text>
      )}

      {/* Pagination info */}
      {visibleBooks.length > 0 && (
        <Text
          style={{
            marginTop: 8,
            textAlign: "center",
            fontSize: 12,
            color: "gray",
          }}
        >
          {`${startIndex + 1}-${Math.min(
            startIndex + itemsPerRow,
            cat.books.length
          )} / ${cat.books.length} sách`}
        </Text>
      )}

      {/* ❌ ĐÃ XÓA: Popup không còn được render ở đây nữa */}
    </View>
  );
}

export default function BookListByCategory({ categories = [], onSelectBook }: Props) {
  const { width: screenWidth } = useWindowDimensions();

  const gap = 12;
  const contentWidth = screenWidth * 0.9;
  const desiredItemWidth = 150;
  const maxItemsPerRow = 6;

  const itemsPerRow = Math.min(
    Math.floor((contentWidth + gap) / (desiredItemWidth + gap)),
    maxItemsPerRow
  );

  const itemWidth = (contentWidth - (itemsPerRow - 1) * gap) / itemsPerRow;
  const itemHeight = itemWidth * 1.5;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      {Array.isArray(categories) &&
        categories.map((cat) => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            itemWidth={itemWidth}
            itemHeight={itemHeight}
            gap={gap}
            itemsPerRow={itemsPerRow}
            contentWidth={contentWidth}
            onSelectBook={onSelectBook} // ✅ TRUYỀN HÀM XỬ LÝ CLICK XUỐNG
          />
        ))}
    </ScrollView>
  );
}