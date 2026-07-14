import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS = {
  primary: "#EC4899",        
  primaryDark: "#DB2777",    
  background: "#FFFFFF",  
  surface: "#FFF1F2",        
  border: "#FFE4E6",          
  text: "#3F3F46",            
  textSecondary: "#A1A1AA",   
};

export default function HomeScreen() {
  const [currentScreen, setCurrentScreen] = useState("products");
  const [catList, setCatList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🌟 เพิ่มระบบจัดการ Error เหมือนโค้ดตัวอย่าง
  const [error, setError] = useState(null); 
  
  const [searchQuery, setSearchQuery] = useState("");
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");

  const GITHUB_JSON_URL = "https://raw.githubusercontent.com/RatchataAiam/Ratchata-Internet-Programming/refs/heads/main/src/app/Cat.json";

  useEffect(() => {
    fetchCatsData();
  }, []);

  const fetchCatsData = async () => {
    try {
      setIsLoading(true);
      setError(null); // รีเซ็ต error ก่อนโหลดใหม่
      const response = await fetch(GITHUB_JSON_URL);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setCatList(data);
    } catch (err) {
      console.error(err);
      setError(err.message); // 🌟 เก็บข้อความ error ไว้แสดงบน UI เหมือนโค้ดตัวอย่าง
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCat = () => {
    if (!catName.trim()) {
      alert("กรุณากรอกชื่อสายพันธุ์แมว");
      return;
    }

    const newCat = {
      id: Date.now().toString(),
      name: catName,
      description: catDescription,
      image: catImageUrl.trim() !== "" ? catImageUrl : "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500"
    };

    setCatList([newCat, ...catList]);
    setCatName("");
    setCatDescription("");
    setCatImageUrl("");
    setCurrentScreen("products");
  };

  const filteredCats = catList.filter((cat) => {
    const nameMatch = cat.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = cat.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || descMatch;
  });

  // 🌟 Render หน้าตอนกำลังโหลด (เหมือนตัวอย่าง)
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.textSecondary }}>Loading cats...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCatsData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="menu" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentScreen === "products" ? "Cats Directory" : "Add New Cat"}
        </Text>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {currentScreen === "products" ? (
        <View style={{ flex: 1 }}>
          {/* Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Search cat breeds..."
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => setCurrentScreen("add_cat")}>
              <Text style={styles.addButtonText}>+ Add Cat</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterText}>Filter ▼</Text>
            </TouchableOpacity>
          </View>

          {filteredCats.length > 0 ? (
            <FlatList
              data={filteredCats}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16 }}
              // 🌟 ปรับมาใช้ ItemSeparatorComponent เพื่อความเป๊ะของ Layout แบบโค้ดตัวอย่าง
              ItemSeparatorComponent={() => <View style={styles.separator} />} 
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Image source={{ uri: item.image }} style={styles.cardImage} />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {item.description ? (
                      <Text style={styles.cardDescription} numberOfLines={3}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={styles.content}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="paw-outline" size={64} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Cats Found</Text>
              <Text style={styles.emptySub}>
                {searchQuery ? "ลองค้นหาด้วยคำอื่นดูนะ" : 'Your cat directory is currently empty.\nTap "+ Add Cat" to add your first breed!'}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.formSectionTitle}>Cat Breed Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Breed Name (ชื่อสายพันธุ์แมว)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. British Shorthair, Persian, Ragdoll"
                placeholderTextColor={COLORS.textSecondary}
                value={catName}
                onChangeText={setCatName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (รายละเอียด)</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Tell us about this breed..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={4}
                value={catDescription}
                onChangeText={setCatDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Image URL (ลิงก์รูปภาพแมว)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="https://example.com/cat-image.jpg"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
                value={catImageUrl}
                onChangeText={setCatImageUrl}
              />
              <Text style={styles.inputHelperText}>วางลิงก์รูปภาพจากเว็บอินเทอร์เน็ตที่นี่</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.formButton, styles.cancelButton]} 
                onPress={() => {
                  setCatName("");
                  setCatDescription("");
                  setCatImageUrl("");
                  setCurrentScreen("products");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.formButton, styles.saveButton]} onPress={handleSaveCat}>
                <Text style={styles.saveButtonText}>Save Cat</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen("products")}>
          <Ionicons name="home" size={24} color={currentScreen === "products" ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.navText, currentScreen === "products" && { color: COLORS.primary, fontWeight: "600" }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen("add_cat")}>
          <Ionicons name="add-circle" size={30} color={currentScreen === "add_cat" ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.navText, currentScreen === "add_cat" && { color: COLORS.primary, fontWeight: "600" }]}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen("products")}>
          <MaterialIcons name="pets" size={24} color={currentScreen === "products" ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.navText, { color: currentScreen === "products" ? COLORS.primary : COLORS.textSecondary, fontWeight: currentScreen === "products" ? "600" : "400" }]}>Cats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="folder" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navText}>Categories</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 18, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: "700", color: COLORS.primary },
  iconButton: { width: 36, alignItems: "center" },
  profileButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: 18 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 48 },
  input: { flex: 1, marginLeft: 8, color: COLORS.text },
  addButton: { marginLeft: 12, backgroundColor: COLORS.primary, paddingHorizontal: 18, height: 48, borderRadius: 12, justifyContent: "center", elevation: 1 },
  addButtonText: { color: "#fff", fontWeight: "700" },
  filterRow: { paddingHorizontal: 18, paddingTop: 15 },
  filterButton: { alignSelf: "flex-end" },
  filterText: { color: COLORS.primary, fontWeight: "600", fontSize: 15 },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 25, marginBottom: 60 },
  emptyIconCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  emptySub: { marginTop: 8, fontSize: 15, textAlign: "center", color: COLORS.textSecondary, lineHeight: 22 },
  
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden", 
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardImage: { width: "100%", height: 200, resizeMode: "cover" },
  cardContent: { padding: 16 },
  cardName: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  cardDescription: { marginTop: 6, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  
  separator: { height: 16 }, 

  formContainer: { padding: 24, paddingBottom: 40 },
  formSectionTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  formInput: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 50, color: COLORS.text, fontSize: 15 },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: "top" },
  inputHelperText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, fontStyle: "italic" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  formButton: { flex: 1, height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  cancelButton: { backgroundColor: "#F4F4F5", marginRight: 10, borderWidth: 1, borderColor: "#E4E4E7" },
  cancelButtonText: { color: "#71717A", fontWeight: "600", fontSize: 16 },
  saveButton: { backgroundColor: COLORS.primary, marginLeft: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  bottomNav: { flexDirection: "row", backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 12 },
  navItem: { flex: 1, alignItems: "center" },
  navText: { marginTop: 4, fontSize: 12, color: COLORS.textSecondary },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  
  errorText: { color: "red", fontSize: 16, marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
  retryButton: { marginTop: 15, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: 'bold' }
});