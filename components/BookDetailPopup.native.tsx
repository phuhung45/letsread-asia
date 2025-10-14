import React, { useEffect, useState } from "react";
import {
    Modal,
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Linking, 
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../lib/supabase"; // Import supabase client

interface Props {
    visible?: boolean;
    bookId: string | undefined;
    onClose: () => void;
}

// Component phụ để hiển thị thông tin cơ bản
const InfoItem = ({ label, value }: { label: string, value: string | number }) => (
    <View style={styles.infoItem}>
        <Text style={styles.infoValue}>{value}</Text>
        <Text style={styles.infoLabel}>{label}</Text>
    </View>
);

// Component phụ để hiển thị thông tin chi tiết
const DetailRow = ({ label, value, isLink = false }: { label: string, value: string, isLink?: boolean }) => {
    if (!value) return null;
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text 
                style={isLink ? styles.detailLink : styles.detailValue}
                numberOfLines={isLink ? 1 : undefined} 
                ellipsizeMode="tail"
            >
                {value}
            </Text>
        </View>
    );
};

export default function BookDetailPopup({ visible = false, bookId, onClose }: Props) {
    const [book, setBook] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

    // Xử lý nút Read
    const handleRead = () => {
        const url = book?.web_book_uuid ? `https://your-domain.com/read/${book.web_book_uuid}` : null;
        if (url) {
            Linking.openURL(url);
        } else {
            Alert.alert("Lỗi", "Không tìm thấy liên kết đọc sách.");
        }
    };

    // Xử lý nút Download
    const handleDownload = () => {
        const downloadUrl = book?.pdf_url || book?.epub_url;
        if (downloadUrl) {
            Linking.openURL(downloadUrl);
        } else {
            Alert.alert("Lỗi", "Không tìm thấy liên kết tải về (PDF/EPUB).");
        }
    };

    useEffect(() => {
        if (!visible || !bookId) {
            setBook(null);
            setSelectedLanguage(null);
            return;
        }

        const fetchBook = async () => {
            let fetchedBookData: any = null;
            
            try {
                setLoading(true);

                // 1. Fetch thông tin sách chính (Quan trọng nhất)
                const { data: bookData, error: bookError } = await supabase
                    .from("books")
                    .select(`*`) 
                    .eq("book_uuid", bookId)
                    .single();

                // XỬ LÝ LỖI CHÍNH: KHÔNG TÌM THẤY SÁCH (PGRST116)
                if (bookError && bookError.code === 'PGRST116') {
                    setBook(null); 
                    return;
                }
                if (bookError) throw bookError;

                fetchedBookData = bookData;

                // 2. Fetch thông tin ngôn ngữ (Mềm dẻo: bỏ qua lỗi)
                // GIẢ ĐỊNH FKEY CÓ TÊN LÀ book_languages_language_id_fkey
                const FKEY_LANG = "book_languages_language_id_fkey"; 
                const { data: langData, error: langError } = await supabase
                    .from("book_languages")
                    .select(`languages!${FKEY_LANG}(name)`) 
                    .eq("book_uuid", bookId); // Dùng book_uuid

                if (langError) console.warn("❌ Language fetch warning:", langError.message);
                
                // 3. Fetch thông tin thể loại (Mềm dẻo: bỏ qua lỗi)
                // Dùng book_id theo sơ đồ DB
                const { data: categoryData, error: categoryError } = await supabase
                    .from("book_categories")
                    .select("categories(name)")
                    .eq("book_id", bookId); 

                if (categoryError) console.warn("❌ Category fetch warning:", categoryError.message);

                // 4. Fetch nội dung (PDF/EPUB URL) (Mềm dẻo: bỏ qua lỗi)
                // Dùng book_id theo sơ đồ DB
                const { data: contentData, error: contentError } = await supabase
                    .from("book_content")
                    .select("pdf_url, epub_url") 
                    .eq("book_id", bookId)
                    .maybeSingle(); 

                if (contentError) console.warn("❌ Content fetch warning:", contentError.message);


                const languages = langData?.map((l: any) => l.languages?.name).filter(Boolean) ?? [];
                
                setBook({
                    ...fetchedBookData,
                    pages: fetchedBookData?.pages || 0, 
                    reading_level: fetchedBookData?.reading_level || 0,
                    
                    languages: languages,
                    categories: categoryData?.map((c: any) => c.categories?.name).filter(Boolean) ?? [],
                    
                    // Thêm URL nội dung
                    pdf_url: contentData?.pdf_url || null,
                    epub_url: contentData?.epub_url || null,
                });
                
                if (languages.length > 0) {
                    setSelectedLanguage(languages[0]);
                } else {
                    setSelectedLanguage(null);
                }

            } catch (err: any) {
                console.error("❌ Lỗi tải sách (General):", err);
                // Hiển thị thông báo chung nếu không phải lỗi 404
                if (err.code !== 'PGRST116') {
                    Alert.alert("Lỗi tải sách", "Có lỗi nghiêm trọng khi tải chi tiết sách. Vui lòng thử lại.");
                }
                setBook(null);
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [visible, bookId]);

    // ... (Phần JSX (return) và Styles giữ nguyên như các phiên bản trước)
    if (!visible || !bookId) {
        return null;
    }
    
    const displayBook = book || {};
    const hasDownloadLink = displayBook.pdf_url || displayBook.epub_url;

    return (
        <Modal 
            visible={visible} 
            animationType="fade" 
            transparent
            onRequestClose={onClose} 
        >
            <TouchableOpacity 
                style={styles.overlay} 
                activeOpacity={1} 
                onPress={onClose} 
            >
                <View 
                    onStartShouldSetResponder={() => true}
                    onPress={() => {}} 
                    style={styles.popupContainer}
                >
                    
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                    >
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>

                    {loading ? (
                        <View style={styles.loadingView}>
                            <ActivityIndicator size="large" color="#4CAF50" />
                            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                        </View>
                    ) : !book ? (
                        <View style={styles.errorView}>
                            <View style={styles.placeholderImage} /> 
                            <Text style={styles.errorText}>
                                Không tìm thấy thông tin sách cho ID: {bookId}. Vui lòng kiểm tra lại ID sách trong Database.
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.errorCloseButton}>
                                <Text style={styles.errorCloseButtonText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        
                        <ScrollView contentContainerStyle={styles.scrollViewContent}>
                            
                            <Image
                                source={{ uri: displayBook.cover_image }}
                                style={styles.coverImage}
                                resizeMode="contain"
                            />

                            <Text style={styles.title}>{displayBook.title}</Text>
                            
                            <Text style={styles.author}>{displayBook.author}</Text>
                            
                            <View style={styles.actionRow}>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={selectedLanguage}
                                        onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
                                        style={styles.languagePicker}
                                        dropdownIconColor="#333"
                                        enabled={displayBook.languages.length > 0} 
                                    >
                                        {displayBook.languages.length === 0 ? (
                                            <Picker.Item label="English" value="English" /> 
                                        ) : (
                                            displayBook.languages.map((lang: string) => (
                                                <Picker.Item key={lang} label={lang} value={lang} />
                                            ))
                                        )}
                                    </Picker>
                                </View>
                                
                                <TouchableOpacity style={styles.likeButton}><Text style={{fontSize: 20}}>♡</Text></TouchableOpacity>
                            </View>
                            
                            <View style={styles.readDownloadRow}>
                                <TouchableOpacity 
                                    style={[styles.readButton, !displayBook.web_book_uuid && {opacity: 0.5}]}
                                    onPress={handleRead}
                                    disabled={!displayBook.web_book_uuid}
                                >
                                    <Text style={styles.readButtonText}>📖 Read</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.downloadButton, !hasDownloadLink && {opacity: 0.5}]}
                                    onPress={handleDownload}
                                    disabled={!hasDownloadLink}
                                >
                                    <Text style={styles.downloadButtonText}>⬇</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.bookDescription}>{displayBook.description || "Không có mô tả."}</Text> 
                            
                            <View style={styles.infoGrid}>
                                <InfoItem label="Reading Level" value={displayBook.reading_level} />
                                <InfoItem label="Pages" value={displayBook.pages} />
                                <InfoItem label="Available Languages" value={displayBook.languages.length} />
                            </View>

                            <View style={styles.detailSection}>
                                <DetailRow label="Publisher" value={displayBook.publisher} />
                                <DetailRow label="Illustrator" value={displayBook.illustrator} />
                                <DetailRow label="Editor" value={displayBook.editor} />
                                <DetailRow label="Categories" value={displayBook.categories?.join(" & ") || "N/A"} />
                                <DetailRow label="Contributor" value={displayBook.contributor} />
                                <DetailRow label="Source Language" value={displayBook.source_language} />
                                <DetailRow label="Country of Origin" value={displayBook.country_of_origin} />
                                <DetailRow label="Original Url" value={displayBook.original_url} isLink={true} />
                                <DetailRow label="License" value={displayBook.license} />
                            </View>
                            
                            {displayBook.notes && (
                                <View style={styles.notesContainer}>
                                    <Text style={styles.notesHeader}>Notes:</Text>
                                    <Text style={styles.notesText}>{displayBook.notes}</Text>
                                </View>
                            )}
                            
                            <TouchableOpacity style={styles.reportIssue}>
                                <Text style={styles.reportIssueText}>Report an issue with the book</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    )}

                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    // ... (Phần styles giữ nguyên)
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    popupContainer: {
        backgroundColor: "white",
        borderRadius: 8, 
        width: "100%",
        maxWidth: 400, 
        maxHeight: "90%",
        overflow: "hidden", 
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 15,
        zIndex: 10,
        padding: 5,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#333',
    },
    scrollViewContent: {
        padding: 24,
        alignItems: 'center',
    },
    loadingView: { 
        padding: 40, 
        alignItems: "center" 
    },
    loadingText: { 
        marginTop: 12, 
        color: "#555" 
    },
    errorView: { 
        padding: 30, 
        alignItems: "center",
        width: '100%',
    },
    placeholderImage: {
        width: 120,
        height: 180,
        backgroundColor: '#e0e0e0',
        marginBottom: 20,
        borderRadius: 4,
    },
    errorText: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 16,
        color: '#d32f2f',
    },
    errorCloseButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 4,
    },
    errorCloseButtonText: {
        fontWeight: 'bold',
        color: '#333',
    },
    coverImage: {
        width: 150,
        height: 200,
        borderRadius: 4,
        marginBottom: 16,
        backgroundColor: "#e5e7eb",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    author: {
        textAlign: "center",
        color: "gray",
        marginBottom: 20,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        marginRight: 10,
        overflow: 'hidden',
        height: 40,
        width: 150,
        justifyContent: 'center',
    },
    languagePicker: {
        height: 40,
        color: '#333',
    },
    likeButton: {
        padding: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
    },
    readDownloadRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    readButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 4,
        marginRight: 10,
    },
    readButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    downloadButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 4,
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadButtonText: {
        fontSize: 18,
        color: '#333',
    },
    bookDescription: {
        fontSize: 14,
        textAlign: 'center',
        color: 'gray',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 20,
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    infoValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    infoLabel: {
        fontSize: 12,
        color: 'gray',
        marginTop: 4,
    },
    detailSection: {
        width: '100%',
        paddingHorizontal: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    detailLabel: {
        fontWeight: '600',
        color: '#333',
        flexBasis: '40%', 
    },
    detailValue: {
        color: '#555',
        textAlign: 'right',
        flexBasis: '60%',
        flexShrink: 1,
    },
    detailLink: {
        color: '#007bff', 
        textAlign: 'right',
        textDecorationLine: 'underline',
        flexBasis: '60%',
        flexShrink: 1,
    },
    notesContainer: {
        width: '100%',
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    notesHeader: {
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 5,
        alignSelf: 'flex-start',
        width: '100%',
    },
    notesText: {
        fontSize: 12,
        color: 'gray',
        alignSelf: 'flex-start',
        width: '100%',
    },
    reportIssue: {
        paddingVertical: 10,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    reportIssueText: {
        color: '#007bff',
        textDecorationLine: 'underline',
    }
});