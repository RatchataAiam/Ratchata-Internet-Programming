import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { useAuth } from "../context-auth";
import { useCart } from "../context-cart";

/* =========================================================
 * CONFIGURATION
 * ========================================================= */

const API = "http://119.59.102.161:3099/api";

/**
 * สีหลักของระบบ
 */
const C = {
  bg: "#FFF8FA",
  white: "#FFFFFF",
  ink: "#2D2025",
  muted: "#7E6870",
  pink: "#E75480",
  pinkDark: "#C83D68",
  soft: "#FFF0F4",
  border: "#EBCFD8",
  green: "#3E8F68",
};

/* =========================================================
 * TYPES
 * ========================================================= */

type Breed = {
  breed_id: number;
  breed_name: string;
  description?: string | null;
  image_url?: string | null;
};

type Product = {
  product_id: number;
  product_name: string;
  category?: string | null;
  price: number;
  stock_quantity: number;
  description?: string | null;
  image_url?: string | null;
  priceTier?: "High" | "Medium" | "Low";
};

type Cat = {
  cat_id: number;
  breed_id: number;
  breed_name?: string | null;
  name: string;
  gender?: string | null;
  price: number;
  is_available: 0 | 1;
  description?: string | null;
  image_url?: string | null;
};

type SearchType = "All" | "Products" | "Breeds" | "Cats";

/* =========================================================
 * HELPER FUNCTIONS
 * ========================================================= */

/**
 * แสดง Notification / Alert
 *
 * Web     -> window.alert()
 * Mobile  -> React Native Alert
 */
const notify = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

/* =========================================================
 * MAIN COMPONENT
 * ========================================================= */

export default function Index() {
  /* -------------------------------------------------------
   * Authentication & Cart
   * ------------------------------------------------------- */

  const { user, token, logout } = useAuth();
  const { count, addItem } = useCart();

  /* -------------------------------------------------------
   * Responsive Layout
   * ------------------------------------------------------- */

  const { width } = useWindowDimensions();

  // กำหนดว่าหน้าจอเป็น Mobile หรือไม่
  const isMobile = width < 600;

  // Card บน Mobile แสดงครั้งละ 3 ชิ้น
  const mobileCardWidth = Math.max(112, (width - 36) / 3);

  /* -------------------------------------------------------
   * Data State
   * ------------------------------------------------------- */

  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);

  /* -------------------------------------------------------
   * Search & Filter State
   * ------------------------------------------------------- */

  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("All");

  const [groupFilter, setGroupFilter] = useState("All");

  /* -------------------------------------------------------
   * Loading State
   * ------------------------------------------------------- */

  const [loading, setLoading] = useState(true);

  /* =======================================================
   * API
   * ======================================================= */

  /**
   * โหลดข้อมูลทั้งหมดจาก API พร้อมกัน
   *
   * - Breeds
   * - Products
   * - Cats
   */
  const load = async () => {
    setLoading(true);

    try {
      const [breedsResponse, productsResponse, catsResponse] =
        await Promise.all([
          fetch(`${API}/breeds`),
          fetch(`${API}/products`),
          fetch(`${API}/cats`),
        ]);

      // ตรวจสอบ Response จาก API
      if (!breedsResponse.ok || !productsResponse.ok || !catsResponse.ok) {
        throw new Error("โหลดข้อมูลไม่สำเร็จ");
      }

      // แปลง JSON และเก็บลง State
      setBreeds(await breedsResponse.json());
      setProducts(await productsResponse.json());
      setCats(await catsResponse.json());
    } catch (error) {
      notify(
        "เชื่อมต่อไม่ได้",
        error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * โหลดข้อมูลเมื่อ User Login แล้ว
   */
  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  /* =======================================================
   * SEARCH
   * ======================================================= */

  /**
   * เตรียมข้อความค้นหา
   * เพื่อให้ค้นหาแบบไม่สนใจตัวพิมพ์เล็ก/ใหญ่
   */
  const query = search.trim().toLowerCase();

  /* =======================================================
   * BREED LOOKUP
   * ======================================================= */

  /**
   * สร้าง Map สำหรับค้นหา Breed Name จาก Breed ID
   *
   * ตัวอย่าง:
   * 1 -> Himalayan Cat
   * 2 -> Kinkalow Cat
   */
  const breedNameById = useMemo(
    () =>
      Object.fromEntries(
        breeds.map((breed) => [String(breed.breed_id), breed.breed_name]),
      ),
    [breeds],
  );

  /* =======================================================
   * GROUP FILTER OPTIONS
   * ======================================================= */

  /**
   * สร้างตัวเลือก Filter ตามประเภทที่ User เลือก
   *
   * Products -> Category
   * Cats     -> Breed
   * Breeds   -> Breed
   */
  const groupOptions = useMemo(() => {
    /* ---------------- สินค้า ---------------- */

    if (searchType === "Products") {
      return [
        "All",
        ...Array.from(
          new Set(
            products.map((product) => product.category || "ไม่ระบุหมวดหมู่"),
          ),
        ),
      ];
    }

    /* ---------------- แมว ---------------- */

    if (searchType === "Cats") {
      return [
        "All",
        ...Array.from(new Set(cats.map((cat) => String(cat.breed_id)))).map(
          (id) => {
            const breedName = breedNameById[id] || `Breed ID ${id}`;

            return `${breedName} · ID ${id}`;
          },
        ),
      ];
    }

    /* ---------------- สายพันธุ์ ---------------- */

    if (searchType === "Breeds") {
      return [
        "All",
        ...breeds.map((breed) => `${breed.breed_name} · ID ${breed.breed_id}`),
      ];
    }

    /* ---------------- ทั้งหมด ---------------- */

    return ["All"];
  }, [searchType, products, cats, breeds, breedNameById]);

  /**
   * แปลงค่าที่เลือกจาก Filter
   *
   * ตัวอย่าง:
   * "Himalayan Cat · ID 1"
   * -> "1"
   */
  const selectedGroupValue = groupFilter.includes(" · ID ")
    ? groupFilter.split(" · ID ").pop()!
    : groupFilter;

  /* =======================================================
   * FILTERED PRODUCTS
   * ======================================================= */

  /**
   * กรองสินค้า
   *
   * รองรับ:
   * - Product ID
   * - Product Name
   * - Category
   * - Description
   */
  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const matchesType = searchType === "All" || searchType === "Products";

        const matchesGroup =
          groupFilter === "All" || product.category === groupFilter;

        const searchableText = `
          ${product.product_id}
          ${product.product_name}
          ${product.category || ""}
          ${product.description || ""}
        `.toLowerCase();

        const matchesSearch = !query || searchableText.includes(query);

        return matchesType && matchesGroup && matchesSearch;
      }),
    [products, query, searchType, groupFilter],
  );

  /* =======================================================
   * FILTERED CATS
   * ======================================================= */

  /**
   * กรองแมว
   *
   * รองรับ:
   * - Cat ID
   * - Breed ID
   * - Cat Name
   * - Breed Name
   * - Description
   */
  const filteredCats = cats.filter((cat) => {
    const matchesType = searchType === "All" || searchType === "Cats";

    const matchesGroup =
      groupFilter === "All" || String(cat.breed_id) === selectedGroupValue;

    const searchableText = `
      ${cat.cat_id}
      ${cat.breed_id}
      ${cat.name}
      ${cat.breed_name || ""}
      ${cat.description || ""}
    `.toLowerCase();

    const matchesSearch = !query || searchableText.includes(query);

    return matchesType && matchesGroup && matchesSearch;
  });

  /* =======================================================
   * FILTERED BREEDS
   * ======================================================= */

  /**
   * กรองสายพันธุ์
   *
   * รองรับ:
   * - Breed ID
   * - Breed Name
   * - Description
   */
  const filteredBreeds = breeds.filter((breed) => {
    const matchesType = searchType === "All" || searchType === "Breeds";

    const matchesGroup =
      groupFilter === "All" || String(breed.breed_id) === selectedGroupValue;

    const searchableText = `
      ${breed.breed_id}
      ${breed.breed_name}
      ${breed.description || ""}
    `.toLowerCase();

    const matchesSearch = !query || searchableText.includes(query);

    return matchesType && matchesGroup && matchesSearch;
  });

  /* =======================================================
   * RESET GROUP FILTER
   * ======================================================= */

  /**
   * เมื่อเปลี่ยน Search Type
   * ให้ Reset Group Filter กลับเป็น All
   */
  useEffect(() => {
    setGroupFilter("All");
  }, [searchType]);

  /* =======================================================
   * CART ACTIONS
   * ======================================================= */

  /**
   * เพิ่ม Product ลงตะกร้า
   */
  const addProduct = (product: Product) => {
    addItem({
      item_type: "Product",
      product_id: product.product_id,
      name: product.product_name,
      price: Number(product.price),
      image_url: product.image_url,
      quantity: 1,
      stock_quantity: Number(product.stock_quantity),
    });

    notify("เพิ่มลงตะกร้าแล้ว", `${product.product_name} ถูกเพิ่มลงตะกร้า`);
  };

  /**
   * เพิ่ม Cat ลงตะกร้า
   */
  const addCat = (cat: Cat) => {
    addItem({
      item_type: "Cat",
      cat_id: cat.cat_id,
      name: cat.name,
      price: Number(cat.price),
      image_url: cat.image_url,
      quantity: 1,
    });

    notify("เพิ่มลงตะกร้าแล้ว", `${cat.name} ถูกเพิ่มลงตะกร้า`);
  };

  /* =======================================================
   * CARD: CAT
   * ======================================================= */

  /**
   * Render Card สำหรับแมว
   *
   * compact = true
   * ใช้สำหรับ Mobile Carousel
   */
  const renderCatCard = (cat: Cat, compact = false) => (
    <View
      key={cat.cat_id}
      style={[
        s.productCard,
        compact && s.carouselCard,
        {
          width: compact ? mobileCardWidth : undefined,
        },
      ]}
    >
      {/* รูปภาพแมว */}
      {cat.image_url ? (
        <Image
          source={{ uri: cat.image_url }}
          style={[s.productImage, compact && s.carouselImage]}
        />
      ) : (
        <View style={[s.productImageEmpty, compact && s.carouselImageEmpty]}>
          <Ionicons name="paw" size={compact ? 26 : 32} color={C.pink} />
        </View>
      )}

      <View style={[s.productBody, compact && s.carouselBody]}>
        {/* สายพันธุ์ */}
        <Text style={s.category} numberOfLines={1}>
          {cat.breed_name || "Cat"}
        </Text>

        {/* ชื่อแมว */}
        <Text style={s.productName} numberOfLines={compact ? 1 : 2}>
          {cat.name}
        </Text>

        {/* รายละเอียด */}
        <Text style={s.productDesc} numberOfLines={2}>
          {cat.description || "แมวสุขภาพดี พร้อมย้ายบ้านใหม่"}
        </Text>

        {/* ส่วนท้ายแบบย่อสำหรับมือถือ */}
        {compact ? (
          <View style={s.productBottomMobile}>
            <View>
              <Text style={s.priceSmall}>
                ฿{Number(cat.price).toLocaleString()}
              </Text>

              <Text
                style={[
                  s.stock,
                  {
                    color: cat.is_available ? C.green : C.pinkDark,
                  },
                ]}
              >
                {cat.is_available ? "พร้อมย้ายบ้าน" : "ขายแล้ว"}
              </Text>
            </View>

            <TouchableOpacity
              disabled={!cat.is_available}
              style={[
                s.iconBuyBtn,
                !cat.is_available && {
                  opacity: 0.45,
                },
              ]}
              onPress={() => addCat(cat)}
            >
              <Ionicons name="cart-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          /* ส่วนท้ายสำหรับหน้าจอขนาดใหญ่ */
          <View style={s.productBottom}>
            <View>
              <Text style={s.price}>฿{Number(cat.price).toLocaleString()}</Text>

              <Text
                style={[
                  s.stock,
                  {
                    color: cat.is_available ? C.green : C.pinkDark,
                  },
                ]}
              >
                {cat.is_available ? "พร้อมย้ายบ้าน" : "ถูกจองแล้ว"}
              </Text>
            </View>

            <TouchableOpacity
              disabled={!cat.is_available}
              style={[
                s.buyBtn,
                !cat.is_available && {
                  opacity: 0.45,
                },
              ]}
              onPress={() => addCat(cat)}
            >
              <Ionicons name="cart-outline" size={18} color="#fff" />

              <Text style={s.buyText}>
                {cat.is_available ? "เพิ่มลงตะกร้า" : "ขายแล้ว"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  /* =======================================================
   * CARD: PRODUCT
   * ======================================================= */

  /**
   * Render Card สำหรับสินค้า
   *
   * compact = true
   * ใช้สำหรับ Mobile Carousel
   */
  const renderProductCard = (product: Product, compact = false) => (
    <View
      key={product.product_id}
      style={[
        s.productCard,
        compact && s.carouselCard,
        {
          width: compact ? mobileCardWidth : undefined,
        },
      ]}
    >
      {/* รูปภาพสินค้า */}
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={[s.productImage, compact && s.carouselImage]}
        />
      ) : (
        <View style={[s.productImageEmpty, compact && s.carouselImageEmpty]}>
          <Ionicons
            name="cube-outline"
            size={compact ? 26 : 32}
            color={C.pink}
          />
        </View>
      )}

      <View style={[s.productBody, compact && s.carouselBody]}>
        {/* หมวดหมู่ */}
        <Text style={s.category} numberOfLines={1}>
          {product.category || "Product"}
        </Text>

        {/* ชื่อสินค้า */}
        <Text style={s.productName} numberOfLines={compact ? 1 : 2}>
          {product.product_name}
        </Text>

        {/* รายละเอียด */}
        <Text style={s.productDesc} numberOfLines={2}>
          {product.description || "สินค้าสำหรับแมวคุณภาพดี"}
        </Text>

        {/* ส่วนท้ายแบบย่อสำหรับมือถือ */}
        {compact ? (
          <View style={s.productBottomMobile}>
            <View>
              <Text style={s.priceSmall}>
                ฿{Number(product.price).toLocaleString()}
              </Text>

              <Text
                style={[
                  s.stock,
                  {
                    color: product.stock_quantity > 0 ? C.green : C.pinkDark,
                  },
                ]}
              >
                {product.stock_quantity > 0
                  ? `เหลือ ${product.stock_quantity}`
                  : "หมด"}
              </Text>
            </View>

            <TouchableOpacity
              disabled={product.stock_quantity <= 0}
              style={[
                s.iconBuyBtn,
                product.stock_quantity <= 0 && {
                  opacity: 0.45,
                },
              ]}
              onPress={() => addProduct(product)}
            >
              <Ionicons name="cart-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          /* ส่วนท้ายสำหรับหน้าจอขนาดใหญ่ */
          <View style={s.productBottom}>
            <View>
              <Text style={s.price}>
                ฿{Number(product.price).toLocaleString()}
              </Text>

              <Text
                style={[
                  s.stock,
                  {
                    color: product.stock_quantity > 0 ? C.green : C.pinkDark,
                  },
                ]}
              >
                {product.stock_quantity > 0
                  ? `เหลือ ${product.stock_quantity} ชิ้น`
                  : "สินค้าหมด"}
              </Text>
            </View>

            <TouchableOpacity
              disabled={product.stock_quantity <= 0}
              style={[
                s.buyBtn,
                product.stock_quantity <= 0 && {
                  opacity: 0.45,
                },
              ]}
              onPress={() => addProduct(product)}
            >
              <Ionicons name="cart-outline" size={18} color="#fff" />

              <Text style={s.buyText}>
                {product.stock_quantity > 0 ? "เพิ่มลงตะกร้า" : "สินค้าหมด"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  /* =======================================================
   * LOGOUT
   * ======================================================= */

  const doLogout = () => {
    logout();
    router.replace("/login");
  };

  /* =======================================================
   * AUTH CHECK
   * ======================================================= */

  if (!user) {
    return null;
  }

  /* =======================================================
   * MAIN UI
   * ======================================================= */

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ===================================================
       * HEADER
       * =================================================== */}

      <View style={s.header}>
        {/* โลโก้ */}
        <View>
          <Text style={s.logoText}>Paw & Pet</Text>

          <Text style={s.headerSub}>Cat Store</Text>
        </View>

        {/* ปุ่มการทำงานบนส่วนหัว */}
        <View style={s.headerActions}>
          {/* ตะกร้าสินค้า */}
          <TouchableOpacity
            style={s.headerBtn}
            onPress={() => router.push("/cart")}
          >
            <Ionicons name="cart-outline" size={20} color={C.pink} />

            {count > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{count > 99 ? "99+" : count}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* แดชบอร์ดผู้ดูแลระบบ */}
          {user.role === "admin" && (
            <TouchableOpacity
              style={s.headerBtn}
              onPress={() =>
                router.push({
                  pathname: "/dashboard",
                  params: {
                    token: token || "",
                    role: user.role,
                  },
                } as any)
              }
            >
              <Ionicons name="grid-outline" size={20} color={C.pink} />
            </TouchableOpacity>
          )}

          {/* ออกจากระบบ */}
          <TouchableOpacity style={s.headerBtn} onPress={doLogout}>
            <Ionicons name="log-out-outline" size={20} color={C.pink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===================================================
       * PAGE CONTENT
       * =================================================== */}

      <ScrollView
        contentContainerStyle={[s.content, isMobile && s.contentMobile]}
        keyboardShouldPersistTaps="handled"
      >
        {/* =================================================
         * HERO
         * ================================================= */}

        <View style={[s.hero, isMobile && s.heroMobile]}>
          <View style={{ flex: 1 }}>
            <Text style={s.kicker}>WELCOME, {user.username.toUpperCase()}</Text>

            <Text style={[s.heroTitle, isMobile && s.heroTitleMobile]}>
              Everything your cat needs.
            </Text>

            <Text style={s.heroDesc}>
              ค้นหาแมวสายพันธุ์และสินค้า สำหรับแมวในที่เดียว
            </Text>
          </View>

          <Ionicons name="paw" size={isMobile ? 38 : 54} color={C.pink} />
        </View>

        {/* =================================================
         * SEARCH BAR
         * ================================================= */}

        <View style={[s.search, isMobile && s.searchMobile]}>
          <Ionicons name="search" size={19} color={C.muted} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              searchType === "Products"
                ? "ค้นหาสินค้า / Category / ID"
                : searchType === "Cats"
                  ? "ค้นหาชื่อแมว / Breed / ID"
                  : searchType === "Breeds"
                    ? "ค้นหาชื่อ Breed / ID"
                    : "ค้นหา Products, Cats หรือ Breeds..."
            }
            placeholderTextColor="#B49BA4"
            style={s.searchInput}
          />

          {/* ล้างคำค้นหา */}
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* =================================================
         * SEARCH TYPE FILTER
         * ================================================= */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {(["All", "Products", "Breeds", "Cats"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[s.filterBtn, searchType === type && s.filterBtnActive]}
              onPress={() => setSearchType(type)}
            >
              <Text
                style={[
                  s.filterText,
                  searchType === type && s.filterTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* =================================================
         * GROUP FILTER
         * ================================================= */}

        {searchType !== "All" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
          >
            {groupOptions.map((group) => (
              <TouchableOpacity
                key={group}
                style={[s.groupBtn, groupFilter === group && s.groupBtnActive]}
                onPress={() => setGroupFilter(group)}
              >
                <Text
                  style={[
                    s.groupText,
                    groupFilter === group && s.groupTextActive,
                  ]}
                >
                  {group === "All" ? "ทั้งหมด" : group}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* =================================================
         * LOADING / CONTENT
         * ================================================= */}

        {loading ? (
          <View style={s.loading}>
            <ActivityIndicator size="large" color={C.pink} />

            <Text style={s.muted}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : (
          <>
            {/* =============================================
             * BREEDS SECTION
             * ============================================= */}

            <View style={s.sectionHead}>
              <View>
                <Text style={s.sectionTitle}>แมว</Text>

                <Text style={s.sectionSub}>Breeds จากฐานข้อมูล</Text>
              </View>

              <Text style={s.count}>{breeds.length} breeds</Text>
            </View>

            {/* รายการสายพันธุ์แบบเลื่อนแนวนอน */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.breedRow}
            >
              {filteredBreeds
                .filter(
                  (breed) =>
                    !query ||
                    `
                      ${breed.breed_id}
                      ${breed.breed_name}
                      ${breed.description || ""}
                    `
                      .toLowerCase()
                      .includes(query),
                )
                .map((breed) => (
                  <TouchableOpacity
                    key={breed.breed_id}
                    activeOpacity={0.8}
                    style={[
                      s.breedCard,
                      isMobile && {
                        width: mobileCardWidth,
                      },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/breed",
                        params: {
                          breedId: String(breed.breed_id),
                        },
                      } as any)
                    }
                  >
                    {/* รูปภาพสายพันธุ์ */}
                    {breed.image_url ? (
                      <Image
                        source={{
                          uri: breed.image_url,
                        }}
                        style={s.breedImage}
                      />
                    ) : (
                      <View style={s.breedImageEmpty}>
                        <Ionicons name="paw" size={30} color={C.pink} />
                      </View>
                    )}

                    {/* ชื่อสายพันธุ์ */}
                    <Text style={s.breedName}>{breed.breed_name}</Text>

                    {/* รายละเอียด */}
                    <Text style={s.breedDesc} numberOfLines={3}>
                      {breed.description || "Cat breed"}
                    </Text>

                    {/* ไปหน้ารายละเอียดสายพันธุ์ */}
                    <Text style={s.viewBreed}>ดูแมวสายพันธุ์นี้ ›</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            {/* =============================================
             * CATS SECTION
             * ============================================= */}

            <View style={[s.sectionHead, { marginTop: 28 }]}>
              <View>
                <Text style={s.sectionTitle}>แมวที่ขาย</Text>

                <Text style={s.sectionSub}>Cats จากฐานข้อมูล</Text>
              </View>

              <Text style={s.count}>
                {cats.filter((cat) => cat.is_available).length} available
              </Text>
            </View>

            {/* No Cats */}
            {cats.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="paw-outline" size={34} color={C.muted} />

                <Text style={s.muted}>ยังไม่มีแมวสำหรับขาย</Text>
              </View>
            ) : isMobile ? (
              /* มือถือ: รายการเลื่อนแนวนอน */
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.carouselRow}
              >
                {filteredCats.map((cat) => renderCatCard(cat, true))}
              </ScrollView>
            ) : (
              /* หน้าจอใหญ่: แสดงเป็นตาราง */
              <View style={s.productGrid}>
                {filteredCats.map((cat) => renderCatCard(cat))}
              </View>
            )}

            {/* =============================================
             * PRODUCTS SECTION
             * ============================================= */}

            <View style={[s.sectionHead, { marginTop: 28 }]}>
              <View>
                <Text style={s.sectionTitle}>สินค้า</Text>

                <Text style={s.sectionSub}>Products สำหรับแมวและการดูแล</Text>
              </View>

              <Text style={s.count}>{filtered.length} items</Text>
            </View>

            {/* No Products */}
            {filtered.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="search-outline" size={34} color={C.muted} />

                <Text style={s.muted}>ไม่พบสินค้าที่ค้นหา</Text>
              </View>
            ) : isMobile ? (
              /* มือถือ: รายการเลื่อนแนวนอน */
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.carouselRow}
              >
                {filtered.map((product) => renderProductCard(product, true))}
              </ScrollView>
            ) : (
              /* หน้าจอใหญ่: แสดงเป็นตาราง */
              <View style={s.productGrid}>
                {filtered.map((product) => renderProductCard(product))}
              </View>
            )}
          </>
        )}

        {/* =================================================
         * ADMIN TOOLS
         * ================================================= */}

        {user.role === "admin" && (
          <View style={[s.adminTools, isMobile && s.adminToolsMobile]}>
            {/* จัดการสินค้า */}
            <TouchableOpacity
              style={s.toolBtn}
              onPress={() =>
                router.push({
                  pathname: "/manage-products",
                  params: {
                    token: token || "",
                    role: user.role,
                  },
                } as any)
              }
            >
              <Ionicons name="add-circle-outline" size={19} color={C.pink} />

              <Text style={s.toolText}>จัดการสินค้า</Text>
            </TouchableOpacity>

            {/* จัดการสายพันธุ์ */}
            <TouchableOpacity
              style={s.toolBtn}
              onPress={() =>
                router.push({
                  pathname: "/manage-breeds",
                  params: {
                    token: token || "",
                    role: user.role,
                  },
                } as any)
              }
            >
              <Ionicons name="paw-outline" size={19} color={C.pink} />

              <Text style={s.toolText}>จัดการสายพันธุ์</Text>
            </TouchableOpacity>

            {/* จัดการแมว */}
            <TouchableOpacity
              style={s.toolBtn}
              onPress={() =>
                router.push({
                  pathname: "/manage-cats",
                  params: {
                    token: token || "",
                    role: user.role,
                  },
                } as any)
              }
            >
              <Ionicons name="paw" size={19} color={C.pink} />

              <Text style={s.toolText}>จัดการแมวที่ขาย</Text>
            </TouchableOpacity>

            {/* จัดกลุ่มตามราคา */}
            <TouchableOpacity
              style={s.toolBtn}
              onPress={() =>
                router.push({
                  pathname: "/price-clusters",
                  params: {
                    token: token || "",
                    role: user.role,
                  },
                } as any)
              }
            >
              <Ionicons name="analytics-outline" size={19} color={C.pink} />

              <Text style={s.toolText}>AI/ML Price Clustering</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===========================================================
 * STYLES
 * =========================================================== */

const s = StyleSheet.create({
  /* ---------------------------------------------------------
   * Layout
   * --------------------------------------------------------- */

  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    padding: 20,
    paddingBottom: 50,
    maxWidth: 1180,
    width: "100%",
    alignSelf: "center",
  },

  contentMobile: {
    padding: 12,
    paddingBottom: 36,
  },

  /* ---------------------------------------------------------
   * Header
   * --------------------------------------------------------- */

  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },

  logoText: {
    fontSize: 20,
    fontWeight: "900",
    color: C.pinkDark,
  },

  headerSub: {
    fontSize: 10,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 1,
  },

  headerActions: {
    flexDirection: "row",
    gap: 7,
  },

  headerBtn: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  badge: {
    position: "absolute",
    right: -5,
    top: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.pinkDark,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },

  /* ---------------------------------------------------------
   * Hero
   * --------------------------------------------------------- */

  hero: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  heroMobile: {
    padding: 16,
    minHeight: 118,
  },

  kicker: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    color: C.pink,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: C.ink,
    marginTop: 6,
  },

  heroTitleMobile: {
    fontSize: 22,
    lineHeight: 27,
  },

  heroDesc: {
    fontSize: 14,
    color: C.muted,
    marginTop: 7,
    lineHeight: 20,
  },

  /* ---------------------------------------------------------
   * Search
   * --------------------------------------------------------- */

  search: {
    height: 48,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  searchMobile: {
    height: 46,
  },

  searchInput: {
    flex: 1,
    color: C.ink,
    fontSize: 14,
  },

  /* ---------------------------------------------------------
   * Section Header
   * --------------------------------------------------------- */

  sectionHead: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.ink,
  },

  sectionSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },

  count: {
    fontSize: 11,
    fontWeight: "800",
    color: C.pinkDark,
  },

  /* ---------------------------------------------------------
   * Filter
   * --------------------------------------------------------- */

  filterRow: {
    gap: 7,
    paddingVertical: 10,
  },

  filterBtn: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },

  filterBtnActive: {
    backgroundColor: C.pink,
    borderColor: C.pink,
  },

  filterText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.pinkDark,
  },

  filterTextActive: {
    color: "#fff",
  },

  groupBtn: {
    maxWidth: 230,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },

  groupBtnActive: {
    backgroundColor: C.soft,
    borderColor: C.pink,
  },

  groupText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.pinkDark,
  },

  groupTextActive: {
    color: C.pinkDark,
  },

  /* ---------------------------------------------------------
   * Breed
   * --------------------------------------------------------- */

  breedRow: {
    gap: 10,
    paddingBottom: 3,
  },

  breedCard: {
    width: 230,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 12,
  },

  breedImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    resizeMode: "cover",
    backgroundColor: C.soft,
  },

  breedImageEmpty: {
    height: 120,
    borderRadius: 10,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
  },

  breedName: {
    fontSize: 15,
    fontWeight: "900",
    color: C.ink,
    marginTop: 10,
  },

  breedDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: C.muted,
    marginTop: 4,
  },

  viewBreed: {
    fontSize: 11,
    fontWeight: "900",
    color: C.pinkDark,
    marginTop: 7,
  },

  /* ---------------------------------------------------------
   * Product / Cat Cards
   * --------------------------------------------------------- */

  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  productCard: {
    width: "31.8%",
    minWidth: 270,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    overflow: "hidden",
  },

  productCardMobile: {
    width: "100%",
    minWidth: 0,
  },

  productImage: {
    width: "100%",
    height: 175,
    resizeMode: "cover",
    backgroundColor: C.soft,
  },

  productImageEmpty: {
    width: "100%",
    height: 175,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
  },

  productBody: {
    padding: 13,
  },

  category: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: C.pink,
  },

  productName: {
    fontSize: 15,
    fontWeight: "900",
    color: C.ink,
    marginTop: 4,
  },

  productDesc: {
    fontSize: 11,
    color: C.muted,
    lineHeight: 16,
    marginTop: 4,
    minHeight: 32,
  },

  /* ---------------------------------------------------------
   * Desktop Card Footer
   * --------------------------------------------------------- */

  productBottom: {
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  price: {
    fontSize: 18,
    fontWeight: "900",
    color: C.pinkDark,
  },

  stock: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },

  buyBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: C.pink,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  buyText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 11,
  },

  /* ---------------------------------------------------------
   * Mobile Carousel
   * --------------------------------------------------------- */

  carouselRow: {
    gap: 9,
    paddingBottom: 4,
  },

  carouselCard: {
    minWidth: 0,
  },

  carouselImage: {
    height: 92,
  },

  carouselImageEmpty: {
    height: 92,
  },

  carouselBody: {
    padding: 9,
  },

  productBottomMobile: {
    marginTop: 7,
    paddingTop: 7,
    borderTopWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 3,
  },

  priceSmall: {
    fontSize: 12,
    fontWeight: "900",
    color: C.pinkDark,
  },

  iconBuyBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: C.pink,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ---------------------------------------------------------
   * Loading / Empty
   * --------------------------------------------------------- */

  loading: {
    padding: 50,
    alignItems: "center",
    gap: 10,
  },

  empty: {
    padding: 30,
    alignItems: "center",
    gap: 8,
  },

  muted: {
    fontSize: 13,
    color: C.muted,
  },

  /* ---------------------------------------------------------
   * Admin Tools
   * --------------------------------------------------------- */

  adminTools: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 24,
  },

  adminToolsMobile: {
    flexDirection: "column",
    gap: 8,
  },

  toolBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  toolText: {
    fontWeight: "800",
    fontSize: 12,
    color: C.ink,
  },
});
