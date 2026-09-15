import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "http://119.59.102.161:3099/api/products";

const COLORS = {
  primary: "#7C5CFF",
  background: "#080A12",
  cardBg: "#111522",
  border: "#2A3142",
  text: "#E5E7F0",
  textSecondary: "#8F99AA",
};

interface Product {
  id: number;
  productCode: string;
  productName: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  color: string;
  storage: string;
  ram: string;
  image: string;
  description: string;
  status: string;
}

interface BrandGroup {
  brandName: string;
  itemCount: number;
  products: Product[];
  sampleImage: string;
}

export default function CategoriesScreen() {
  const params = useLocalSearchParams();
  const userRole = (params.role as "admin" | "user") || null;
  const userToken = (params.token as string) || "";

  const [loading, setLoading] = useState(false);
  const [brandGroups, setBrandGroups] = useState<BrandGroup[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandGroup | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchProductsAndGroup = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Fetch error");
      const data: Product[] = await response.json();

      const groupsMap: { [key: string]: Product[] } = {};
const displayNames: { [key: string]: string } = {};

data.forEach((product) => {
  const raw = product.brand?.trim() || "Unnamed Brand";
  const key = raw.toLowerCase(); // ใช้ตัวพิมพ์เล็กเป็น key สำหรับจัดกลุ่ม

  if (!groupsMap[key]) {
    groupsMap[key] = [];
    displayNames[key] = raw; // เก็บชื่อที่เจอครั้งแรกไว้แสดงผล
  }
  groupsMap[key].push(product);
});

const formattedGroups: BrandGroup[] = Object.keys(groupsMap).map((key) => ({
  brandName: displayNames[key],
  itemCount: groupsMap[key].length,
  products: groupsMap[key],
  sampleImage: groupsMap[key][0]?.image || "",
}));

      setBrandGroups(formattedGroups);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndGroup();
  }, []);

  const openBrandProducts = (brandGroup: BrandGroup) => {
    setSelectedBrand(brandGroup);
    setDetailModalVisible(true);
  };

  // ฟังก์ชันกดเลือกแบรนด์หรือสินค้าเพื่อไปยังหน้า Products
  const goToProductPage = (searchKeyword?: string) => {
    setDetailModalVisible(false);
    router.push({
      pathname: "/", // นำทางไปหน้า สินค้า (Products)
      params: {
        token: userToken,
        role: userRole,
        search: searchKeyword !== undefined ? searchKeyword : selectedBrand?.brandName || "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080A12" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories / Brands</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchProductsAndGroup}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Brand List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={brandGroups}
          keyExtractor={(item) => item.brandName}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.brandCard}
              onPress={() => openBrandProducts(item)}
            >
              <View style={styles.brandInfo}>
                <Text style={styles.brandNameText}>{item.brandName}</Text>
                <Text style={styles.itemCountText}>{item.itemCount} Products available</Text>
              </View>
              <View style={styles.arrowBadge}>
                <Ionicons name="chevron-forward" size={18} color="#8B5CF6" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push({
              pathname: "/home",
              params: { token: userToken, role: userRole },
            })
          }
        >
          <Ionicons name="home-outline" size={22} color="#8F99AA" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        {userRole === "admin" && (
          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              router.push({
                pathname: "/",
                params: { token: userToken, role: userRole },
              })
            }
          >
            <Ionicons name="add-outline" size={24} color="#8F99AA" />
            <Text style={styles.navText}>Add</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.navItem} onPress={() => goToProductPage("")}>
          <MaterialIcons name="inventory-2" size={22} color="#8F99AA" />
          <Text style={styles.navText}>Products</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="folder" size={22} color={COLORS.primary} />
          <Text style={[styles.navText, styles.activeNavText]}>Categories</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL สินค้าในแบรนด์ */}
      <Modal
        visible={detailModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Brand: {selectedBrand?.brandName} ({selectedBrand?.itemCount})
              </Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#E5E7F0" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {selectedBrand?.products.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.productRowCard}
                  onPress={() => goToProductPage(p.productName)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{
                      uri:
                        p.image && p.image.startsWith("http")
                          ? p.image
                          : "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600&auto=format&fit=crop",
                    }}
                    style={styles.productRowImage}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.productRowTitle}>{p.productName}</Text>
                    <Text style={styles.productRowSub}>
                      Stock: {p.stock ?? 0} | Category: {p.category || "-"}
                    </Text>
                    <Text style={styles.productRowPrice}>
                      ฿{Number(p.price ?? 0).toLocaleString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA6B8" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080A12" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#111522",
    borderBottomWidth: 1,
    borderBottomColor: "#2A3142",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#8B5CF6" },
  refreshBtn: { padding: 4 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16 },
  brandCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111522",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A3142",
  },
  brandInfo: { gap: 4 },
  brandNameText: { fontSize: 16, fontWeight: "700", color: "#E5E7F0" },
  itemCountText: { fontSize: 13, color: "#8F99AA" },
  arrowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#241A3A",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#111522",
    borderTopWidth: 1,
    borderTopColor: "#2A3142",
    paddingVertical: 8,
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: { flex: 1, alignItems: "center" },
  navText: { marginTop: 3, fontSize: 12, color: "#8F99AA" },
  activeNavText: { color: "#8B5CF6", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
    backgroundColor: "#111522",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3142",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#E5E7F0" },
  productRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#080A12",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A3142",
  },
  productRowImage: { width: 50, height: 50, borderRadius: 8, resizeMode: "contain" },
  productRowTitle: { fontSize: 14, fontWeight: "700", color: "#E5E7F0" },
  productRowSub: { fontSize: 12, color: "#8F99AA", marginTop: 2 },
  productRowPrice: { fontSize: 14, fontWeight: "700", color: "#8B5CF6", marginTop: 2 },
  closeBtn: {
    margin: 16,
    height: 42,
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: { color: "#FFFFFF", fontWeight: "700" },
});