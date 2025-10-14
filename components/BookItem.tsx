import React from 'react';
import { TouchableOpacity, Image, Text, View, StyleSheet } from 'react-native';

// === INTERFACES ===
interface BookProp {
    id?: string;
    book_uuid: string;
    title: string;
    cover_image: string; // Tên cột trong CSDL
    [key: string]: any; 
}
interface BookItemProps {
    book: BookProp;
    // Hàm này được truyền từ Home.tsx -> BookListByCategory -> BookItem
    onSelectBook: (book: BookProp) => void;
}

// === COMPONENT CHÍNH: BOOKITEM ===
export default function BookItem({ book, onSelectBook }: BookItemProps): JSX.Element {

    // Sử dụng book_uuid làm key dự phòng nếu id bị thiếu
    const itemKey = book.id || book.book_uuid;

    return (
        // 🔥 Đảm bảo component được bọc trong một Touchable (TouchableOpacity)
        <TouchableOpacity 
            key={itemKey}
            onPress={() => onSelectBook(book)} // Gọi hàm xử lý click từ component cha
            style={styles.itemContainer}
        >
            <Image 
                source={{ uri: book.cover_image }} 
                style={styles.coverImage} 
                resizeMode="cover"
            />
            <Text numberOfLines={2} style={styles.title}>
                {book.title}
            </Text>
        </TouchableOpacity>
    );
}

// === STYLES ===
const styles = StyleSheet.create({
    itemContainer: { 
        width: 120, 
        marginHorizontal: 8,
        marginBottom: 15,
        // Thêm một chút đổ bóng/viền để trông giống một item có thể click
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 2, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        overflow: 'hidden', // Cắt ảnh bìa theo border radius
    },
    coverImage: { 
        width: '100%', 
        height: 150, // Điều chỉnh chiều cao cho phù hợp với kích thước list
        backgroundColor: '#eee'
    },
    title: { 
        marginTop: 5, 
        paddingHorizontal: 5,
        paddingBottom: 5,
        fontSize: 13, 
        textAlign: 'center',
        color: '#333',
        minHeight: 35, // Giúp căn chỉnh chiều cao cho các title có 1 hoặc 2 dòng
    }
});