import { Ionicons } from "@expo/vector-icons";
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

const API = "http://119.59.102.161:3099/api/products";
const COLORS = {
  primary: "#E75480",
  background: "#FFF8FA",
  card: "#FFFFFF",
  border: "#EBCFD8",
  text: "#2D2025",
  muted: "#7E6870",
};

type Product = {
  product_id: number;
  product_name: string;
  category?: string | null;
  price: number;
  stock_quantity: number;
  image_url?: string | null;
};

type CategoryGroup = {
  categoryName: string;
  products: Product[];
};

export default function CategoriesScreen() {
  const params = useLocalSearchParams();
  const userRole = (params.role as "admin" | "user") || null;
  const userToken = (params.token as string) || "";
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CategoryGroup | null>(
    null,
  );

  // จัดกลุ่ม Products ตามหมวดหมู่ เพื่อให้ข้อมูลตรงกับฐานข้อมูลเสมอ
  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("โหลดข้อมูลสินค้าไม่สำเร็จ");
      const products: Product[] = await response.json();
      const grouped = new Map<string, Product[]>();

      products.forEach((product) => {
        const category = product.category?.trim() || "ไม่ระบุหมวดหมู่";
        const current = grouped.get(category) || [];
        grouped.set(category, [...current, product]);
      });

      setGroups(
        Array.from(grouped, ([categoryName, categoryProducts]) => ({
          categoryName,
          products: categoryProducts,
        })),
      );
    } catch (error) {
      console.error("Error loading product categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const goToProducts = (search = "") => {
    router.push({
      pathname: "/",
      params: { token: userToken, role: userRole, search },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>หมวดหมู่สินค้า</Text>
        <TouchableOpacity onPress={loadCategories}>
          <Ionicons name="refresh" size={21} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.categoryName}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => setSelectedGroup(item)}
            >
              <View>
                <Text style={styles.categoryName}>{item.categoryName}</Text>
                <Text style={styles.categoryCount}>
                  {item.products.length} รายการ
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => goToProducts()}>
          <Ionicons name="cube-outline" size={22} color={COLORS.primary} />
          <Text style={styles.navText}>สินค้า</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/cart")}
        >
          <Ionicons name="cart-outline" size={22} color={COLORS.muted} />
          <Text style={styles.navText}>ตะกร้า</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={Boolean(selectedGroup)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedGroup(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedGroup?.categoryName}
              </Text>
              <TouchableOpacity onPress={() => setSelectedGroup(null)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedGroup?.products.map((product) => (
                <TouchableOpacity
                  key={product.product_id}
                  style={styles.productRow}
                  onPress={() => goToProducts(product.product_name)}
                >
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.productImageEmpty}>
                      <Ionicons
                        name="cube-outline"
                        size={25}
                        color={COLORS.primary}
                      />
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {product.product_name}
                    </Text>
                    <Text style={styles.productMeta}>
                      เหลือ {product.stock_quantity} ชิ้น
                    </Text>
                    <Text style={styles.productPrice}>
                      ฿{Number(product.price).toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    height: 68,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 20, paddingBottom: 90 },
  categoryCard: {
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryName: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  categoryCount: { marginTop: 5, fontSize: 12, color: COLORS.muted },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 68,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navItem: { alignItems: "center", gap: 3 },
  navText: { fontSize: 12, color: COLORS.muted },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(45, 32, 37, 0.35)",
  },
  modal: {
    maxHeight: "85%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  modalHeader: {
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  modalContent: { padding: 16 },
  productRow: {
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImage: { width: 64, height: 64, backgroundColor: "#FFF0F4" },
  productImageEmpty: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F4",
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  productMeta: { marginTop: 4, fontSize: 12, color: COLORS.muted },
  productPrice: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
  },
});
