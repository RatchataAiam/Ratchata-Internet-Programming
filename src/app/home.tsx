import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const API = "http://119.59.102.161:3099/api/products";
const COLORS = {
  primary: "#E75480",
  primaryDark: "#C83D68",
  background: "#FFF8FA",
  surface: "#FFFFFF",
  border: "#EBCFD8",
  text: "#2D2025",
  muted: "#7E6870",
  green: "#3E8F68",
};

type Product = {
  product_id: number;
  product_name: string;
  category?: string | null;
  price: number;
  stock_quantity: number;
  description?: string | null;
  image_url?: string | null;
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const userRole = (params.role as "admin" | "user") || "user";
  const userToken = (params.token as string) || "";
  const [menuVisible, setMenuVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // หน้าแรกแสดงสินค้าแถวล่าสุดจากตาราง Products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("โหลดข้อมูลสินค้าไม่สำเร็จ");
      const data: Product[] = await response.json();
      setProducts(data.slice(-6).reverse());
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const goToProducts = (search = "") => {
    router.push({
      pathname: "/",
      params: { search, token: userToken, role: userRole },
    });
  };

  // สร้างหมวดหมู่จากค่าที่ API ส่งกลับมาในขณะนั้น
  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean)),
  ) as string[];
  const cardWidth = width < 650 ? "100%" : "48%";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={25} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Paw & Pet Shop</Text>
          <Text style={styles.headerSubtitle}>สินค้าและอุปกรณ์สำหรับแมว</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/cart")}>
          <Ionicons name="cart-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>CAT CARE COLLECTION</Text>
            <Text style={styles.heroTitle}>
              ดูแลแมวของคุณด้วยสินค้าที่เลือกสรร
            </Text>
            <Text style={styles.heroDescription}>
              อาหาร ขนม ของเล่น และอุปกรณ์สำหรับแมวจากฐานข้อมูล Products
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => goToProducts()}
            >
              <Text style={styles.primaryButtonText}>ดูสินค้าทั้งหมด</Text>
              <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=800&auto=format&fit=crop",
            }}
            style={styles.heroImage}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>หมวดหมู่สินค้า</Text>
            <Text style={styles.sectionSubtitle}>
              อ้างอิงจาก category ใน Products
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/categories")}>
            <Text style={styles.linkText}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.categoryChip}
              onPress={() => goToProducts(category)}
            >
              <Ionicons
                name="pricetag-outline"
                size={17}
                color={COLORS.primary}
              />
              <Text style={styles.categoryChipText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>สินค้าแนะนำล่าสุด</Text>
            <Text style={styles.sectionSubtitle}>ข้อมูลจากตาราง Products</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/")}>
            <Text style={styles.linkText}>ดูสินค้า</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : (
          <View style={styles.grid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.product_id}
                style={[styles.productCard, { width: cardWidth }]}
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
                      size={42}
                      color={COLORS.primary}
                    />
                  </View>
                )}
                <View style={styles.productBody}>
                  <Text style={styles.productCategory} numberOfLines={1}>
                    {product.category || "ไม่ระบุหมวดหมู่"}
                  </Text>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.product_name}
                  </Text>
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {product.description || "สินค้าสำหรับแมวคุณภาพดี"}
                  </Text>
                  <View style={styles.productFooter}>
                    <View>
                      <Text style={styles.price}>
                        ฿{Number(product.price).toLocaleString()}
                      </Text>
                      <Text
                        style={[
                          styles.stock,
                          {
                            color:
                              product.stock_quantity > 0
                                ? COLORS.green
                                : COLORS.primaryDark,
                          },
                        ]}
                      >
                        {product.stock_quantity > 0
                          ? `เหลือ ${product.stock_quantity} ชิ้น`
                          : "สินค้าหมด"}
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward-circle"
                      size={26}
                      color={COLORS.primary}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={21} color={COLORS.primary} />
          <Text style={[styles.navText, styles.activeNavText]}>หน้าหลัก</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => goToProducts()}>
          <Ionicons name="cube-outline" size={21} color={COLORS.muted} />
          <Text style={styles.navText}>สินค้า</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/categories")}
        >
          <Ionicons name="folder-outline" size={21} color={COLORS.muted} />
          <Text style={styles.navText}>หมวดหมู่</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              <View>
                <Text style={styles.menuTitle}>เมนูหลัก</Text>
                <Text style={styles.menuSubtitle}>
                  {userRole.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                goToProducts();
              }}
            >
              <Ionicons name="cube-outline" size={21} color={COLORS.primary} />
              <Text style={styles.menuItemText}>สินค้าทั้งหมด</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/categories");
              }}
            >
              <Ionicons
                name="folder-outline"
                size={21}
                color={COLORS.primary}
              />
              <Text style={styles.menuItemText}>หมวดหมู่สินค้า</Text>
            </TouchableOpacity>
            {userRole === "admin" && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push("/manage-products");
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={21}
                  color={COLORS.primary}
                />
                <Text style={styles.menuItemText}>จัดการสินค้า</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => router.replace("/login")}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color={COLORS.primaryDark}
              />
              <Text style={styles.logoutText}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    minHeight: 68,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleWrap: { alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  headerSubtitle: { marginTop: 2, fontSize: 11, color: COLORS.muted },
  content: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    padding: 18,
    paddingBottom: 100,
  },
  hero: {
    minHeight: 220,
    marginBottom: 24,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: COLORS.primaryDark,
  },
  heroCopy: { flex: 1, padding: 22, justifyContent: "center" },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#FFE5EC",
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 25,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#FFF1F5",
  },
  heroImage: { width: "38%", minWidth: 130, resizeMode: "cover" },
  primaryButton: {
    alignSelf: "flex-start",
    marginTop: 16,
    paddingHorizontal: 14,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  sectionSubtitle: { marginTop: 3, fontSize: 12, color: COLORS.muted },
  linkText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: "900" },
  categoryChip: {
    marginRight: 10,
    paddingHorizontal: 14,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipText: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  loader: { marginVertical: 45 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  productCard: {
    marginBottom: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImage: { width: "100%", height: 150, backgroundColor: "#FFF0F4" },
  productImageEmpty: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F4",
  },
  productBody: { padding: 14 },
  productCategory: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: "900",
  },
  productName: {
    marginTop: 5,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  productDescription: {
    minHeight: 34,
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  productFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  price: { color: COLORS.primaryDark, fontSize: 17, fontWeight: "900" },
  stock: { marginTop: 3, fontSize: 11, fontWeight: "800" },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 68,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navItem: { alignItems: "center", gap: 3 },
  navText: { color: COLORS.muted, fontSize: 11 },
  activeNavText: { color: COLORS.primary, fontWeight: "900" },
  menuOverlay: { flex: 1, backgroundColor: "rgba(45, 32, 37, 0.35)" },
  menu: {
    width: "82%",
    maxWidth: 360,
    height: "100%",
    padding: 20,
    paddingTop: 54,
    backgroundColor: COLORS.background,
  },
  menuHeader: {
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuTitle: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  menuSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  menuItem: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  logoutButton: {
    height: 48,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  logoutText: { color: COLORS.primaryDark, fontWeight: "900" },
});
