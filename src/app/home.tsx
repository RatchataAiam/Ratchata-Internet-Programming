import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";

const API_BASE_URL = "http://119.59.102.161:3099/api/products";

const COLORS = {
  primary: "#22D3EE",
  purpleHeader: "#9B6CFF",
  background: "#080A12",
  surface: "#111522",
  border: "#2A3142",
  text: "#F8FAFC",
  textSecondary: "#8F99AA",
  danger: "#FB7185",
  cardBg: "#111522",
};

interface Product {
  id: number;
  productName: string;
  brand: string;
  price: number;
  image: string;
  description: string;
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const params = useLocalSearchParams();
  const userRole = (params.role as "admin" | "user") || "user";
  const userToken = (params.token as string) || "";

  const [menuVisible, setMenuVisible] = useState(false);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLatestProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (response.ok) {
        const data: Product[] = await response.json();
        setLatestProducts(data.slice(-4).reverse());
      }
    } catch (error) {
      console.error("Fetch latest products error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestProducts();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu" size={24} color={COLORS.text} />
          </TouchableOpacity>

          {userRole === "admin" && !isSmallScreen && (
  <TouchableOpacity
    style={styles.brandContainer}
    onPress={() =>
      router.push({
        pathname: "/dashboard" as any,
        params: { token: userToken, role: userRole },
      })
    }
  >
    <View style={styles.logoIconContainer}>
      <Ionicons name="layers" size={18} color="#E5E7F0" />
    </View>
    <View style={styles.brandTextContainer}>
      <Text style={styles.brandTitle}>STOCK</Text>
      <Text style={styles.brandSubtitle}>MANAGER</Text>
    </View>
  </TouchableOpacity>
)}
        </View>

        <Text style={styles.headerTitle}>Home</Text>

        <TouchableOpacity
          style={styles.logoutContainer}
          onPress={() => router.replace("/login")}
        >
          {!isSmallScreen && (
            <Text style={styles.logoutLabel}>
              {userRole ? `${userRole.toUpperCase()} - LOGOUT` : "LOGOUT"}
            </Text>
          )}
          <View style={styles.profileButton}>
            <Ionicons name="log-out-outline" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* MAIN HOME SCROLL CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HERO BANNER */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroPreorder}>PRE-ORDER NOW</Text>
            <Text style={styles.heroTitle}>The New iPhone 16 Series</Text>
            <Text style={styles.heroDescription} numberOfLines={2}>
              Titanium design. Next-generation A17 Pro chip.
            </Text>
            <TouchableOpacity
              style={styles.shopNowBtn}
              onPress={() =>
                router.push({
                  pathname: "/pre-order" as any,
                  params: { token: userToken, role: userRole },
                })
              }
            >
              <Text style={styles.shopNowText}>Shop Now</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Image
            source={{
              uri: "https://www.notebookcheck.net/fileadmin/Notebooks/News/_nc4/iphone-16-series-batteries.jpg",
            }}
            style={styles.heroImage}
          />
        </View>

        {/* FEATURED BRANDS */}
        <Text style={styles.sectionTitle}>Featured Brands</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandsContainer}
        >
          {["Apple", "Samsung", "Realme", "Xiaomi", "Oppo", "Vivo", "Infinix"].map((brand, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.brandCard}
              onPress={() =>
                router.push({
                  pathname: "/" as any,
                  params: { search: brand, token: userToken, role: userRole },
                })
              }
            >
              <Text style={styles.brandCardText}>{brand}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LATEST ARRIVALS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Latest Arrivals</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/" as any,
                params: { token: userToken, role: userRole },
              })
            }
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.purpleHeader} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.gridRow}>
            {latestProducts.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.productCard,
                  { width: width < 360 ? "100%" : "48%" },
                ]}
              >
                <View style={styles.imageWrapper}>
                  <Text style={styles.newBadge}>New</Text>
                  <Image
                    source={{
                      uri:
                        item.image && item.image.startsWith("http")
                          ? item.image
                          : "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=500&auto=format&fit=crop",
                    }}
                    style={styles.productCardImage}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardBrand}>{(item.brand || "BRAND").toUpperCase()}</Text>
                  <Text style={styles.cardName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.cardSpec} numberOfLines={1}>
                    {item.description || "Fresh Stock Arrived"}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>From ฿{Number(item.price ?? 0).toLocaleString()}</Text>
                    <TouchableOpacity
                      style={styles.addCircleBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/" as any,
                          params: { search: item.productName, token: userToken, role: userRole },
                        })
                      }
                    >
                      <Ionicons name="arrow-up" size={14} color="#fff" style={{ transform: [{ rotate: "45deg" }] }} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TRADE-IN BANNER */}
        <View style={styles.tradeInBanner}>
          <View style={styles.tradeInHeader}>
            <Ionicons name="sync-outline" size={16} color="#22D3EE" />
            <Text style={styles.tradeInTag}>TRADE-IN PROGRAM</Text>
          </View>
          <Text style={styles.tradeInTitle}>Upgrade Your Tech</Text>
          <Text style={styles.tradeInDesc}>
            Get credit toward a new device when you trade in your old smartphone in perfect condition.
          </Text>
          <TouchableOpacity
            style={styles.estimateBtn}
            onPress={() =>
              router.push({
                pathname: "/upgrade" as any,
                params: { token: userToken, role: userRole },
              })
            }
          >
            <Text style={styles.estimateBtnText}>Estimate Value</Text>
          </TouchableOpacity>

          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?q=80&w=800&auto=format&fit=crop",
            }}
            style={styles.tradeInImage}
          />
        </View>
      </ScrollView>

      {/* ======================================
          BOTTOM NAVIGATION 
          (ซ่อนปุ่ม Add สำหรับ user, และแก้ปุ่ม Products ให้ชี้ไปที่หน้า "/" แทน)
      ====================================== */}
      <View style={styles.bottomNav}>
        {/* Home */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push({
              pathname: "/home" as any,
              params: { token: userToken, role: userRole },
            })
          }
        >
          <Ionicons name="home" size={20} color={COLORS.purpleHeader} />
          <Text style={[styles.navText, { color: COLORS.purpleHeader, fontWeight: "600" }]}>Home</Text>
        </TouchableOpacity>

        {/* Add (แสดงเฉพาะ admin เท่านั้น) */}
        {userRole === "admin" && (
  <TouchableOpacity
    style={styles.navItem}
    onPress={() =>
      router.push({
        pathname: "/" as any,
        params: { token: userToken, role: userRole, openAdd: "true" },
      })
    }
  >
    <Ionicons name="add-circle-outline" size={20} color={COLORS.textSecondary} />
    <Text style={styles.navText}>Add</Text>
  </TouchableOpacity>
)}

        {/* Products (แก้ pathname ให้ชี้มาที่ "/" ซึ่งเป็นหน้า Products หลัก) */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push({
              pathname: "/" as any,
              params: { token: userToken, role: userRole },
            })
          }
        >
          <MaterialIcons name="inventory-2" size={20} color={COLORS.textSecondary} />
          <Text style={styles.navText}>Products</Text>
        </TouchableOpacity>

        {/* Categories */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.push({
              pathname: "/categories" as any,
              params: { token: userToken, role: userRole },
            })
          }
        >
          <Ionicons name="folder-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.navText}>Categories</Text>
        </TouchableOpacity>
      </View>

      {/* SIDE MENU MODAL */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.menuDrawer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <View>
                <Text style={styles.menuUserRole}>
                  {userRole ? userRole.toUpperCase() : "GUEST"}
                </Text>
                <Text style={styles.menuSubTitle}>Navigation Menu</Text>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuList}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setMenuVisible(false)}
              >
                <Ionicons name="home-outline" size={20} color={COLORS.purpleHeader} />
                <Text style={[styles.menuItemText, { color: COLORS.purpleHeader }]}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push({
                    pathname: "/" as any,
                    params: { token: userToken, role: userRole },
                  });
                }}
              >
                <MaterialIcons name="inventory-2" size={20} color={COLORS.text} />
                <Text style={styles.menuItemText}>Products</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push({
                    pathname: "/categories" as any,
                    params: { token: userToken, role: userRole },
                  });
                }}
              >
                <Ionicons name="folder-outline" size={20} color={COLORS.text} />
                <Text style={styles.menuItemText}>Categories</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push({
                    pathname: "/price-clusters" as any,
                    params: { token: userToken, role: userRole },
                  });
                }}
              >
                <Ionicons name="analytics-outline" size={20} color={COLORS.text} />
                <Text style={styles.menuItemText}>AI Price Clusters</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.menuLogoutBtn}
              onPress={() => {
                setMenuVisible(false);
                router.replace("/login");
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
              <Text style={styles.menuLogoutText}>Logout</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#111522",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 54,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  iconButton: { padding: 4 },
  brandContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoIconContainer: { padding: 2 },
  brandTextContainer: { justifyContent: "center" },
  brandTitle: { fontSize: 12, fontWeight: "800", color: "#E5E7F0", lineHeight: 13 },
  brandSubtitle: { fontSize: 8, fontWeight: "700", color: "#8F99AA", lineHeight: 9 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.purpleHeader,
    textAlign: "center",
    flexShrink: 1,
  },
  logoutContainer: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  logoutLabel: { fontSize: 11, fontWeight: "700", color: COLORS.text },
  profileButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { padding: 12, paddingBottom: 70 },

  /* HERO BANNER */
  heroBanner: {
    backgroundColor: "#101522",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A3142",
    flexDirection: "row",
    minHeight: 160,
    marginBottom: 16,
  },
  heroTextContainer: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },
  heroPreorder: {
    fontSize: 9,
    fontWeight: "700",
    color: "#38BDF8",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: 10,
    color: "#9CA6B8",
    lineHeight: 14,
    marginBottom: 10,
  },
  shopNowBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  shopNowText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  heroImage: {
    width: "40%",
    height: "100%",
    resizeMode: "cover",
  },

  /* SECTION TITLES */
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },

  /* FEATURED BRANDS */
  brandsContainer: {
    gap: 8,
    paddingBottom: 12,
  },
  brandCard: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#111522",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A3142",
    justifyContent: "center",
    alignItems: "center",
  },
  brandCardText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A7AFBF",
  },

  /* LATEST ARRIVALS GRID */
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: "#111522",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A3142",
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: 100,
    backgroundColor: "#070910",
    position: "relative",
  },
  productCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  newBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: COLORS.primary,
    color: "#FFF",
    fontSize: 8,
    fontWeight: "800",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    zIndex: 10,
  },
  cardInfo: {
    padding: 8,
  },
  cardBrand: {
    fontSize: 8,
    fontWeight: "700",
    color: "#A7AFBF",
  },
  cardName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F8FAFC",
    marginVertical: 1,
  },
  cardSpec: {
    fontSize: 9,
    color: "#A7AFBF",
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPrice: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  addCircleBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7C5CFF",
    justifyContent: "center",
    alignItems: "center",
  },

  /* TRADE-IN BANNER */
  tradeInBanner: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  tradeInHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  tradeInTag: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
  },
  tradeInTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  tradeInDesc: {
    fontSize: 10,
    color: "#CBD2E0",
    lineHeight: 14,
    marginBottom: 10,
  },
  estimateBtn: {
    backgroundColor: "#1B2130",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  estimateBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tradeInImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    resizeMode: "cover",
  },

  /* BOTTOM NAV */
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#111522",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 6,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navItem: { flex: 1, alignItems: "center" },
  navText: { marginTop: 2, fontSize: 10, color: COLORS.textSecondary },

  /* SIDE MENU DRAWER */
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    flexDirection: "row",
  },
  menuDrawer: {
    width: 250,
    height: "100%",
    backgroundColor: "#111522",
    paddingTop: Platform.OS === "ios" ? 40 : 16,
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuUserRole: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.purpleHeader,
  },
  menuSubTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  menuList: { flex: 1, marginTop: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  menuLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  menuLogoutText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.danger,
  },
});