import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context-auth";

const API_BASE_URL = "http://119.59.102.161:3099/api/products";

const COLORS = {
  primary: "#E75480",
  primaryDark: "#C83D68",
  background: "#FFF8FA",
  soft: "#FFF0F4",
  border: "#EBCFD8",
  text: "#2D2025",
  textSecondary: "#7E6870",
  danger: "#B93859",
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

const notify = (title: string, message?: string) =>
  Platform.OS === "web" ? window.alert(message ? `${title}\n\n${message}` : title) : Alert.alert(title, message);

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const { user, token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // สิทธิ์การใช้งานอ้างอิงจากผู้ใช้ที่ล็อกอินอยู่จริง (ไม่ใช่พารามิเตอร์ที่ส่งต่อกันมา)
  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/${id}`);
      if (!r.ok) throw new Error("ไม่พบสินค้า หรือโหลดข้อมูลไม่สำเร็จ");
      setProduct(await r.json());
    } catch (e) {
      notify("เกิดข้อผิดพลาด", e instanceof Error ? e.message : "ไม่สามารถโหลดข้อมูลสินค้าได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const handleDelete = () => {
    if (!isAdmin || !product) return;
    const message = `Are you sure you want to delete "${product.product_name}"?`;
    const run = async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/${product.product_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || `HTTP ${r.status}`);
        notify("สำเร็จ", "ลบสินค้าเรียบร้อยแล้ว");
        router.back();
      } catch (e) {
        notify("เกิดข้อผิดพลาด", e instanceof Error ? e.message : "ไม่สามารถลบสินค้าได้");
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm(message)) run();
    } else {
      Alert.alert("Delete product", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: run },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Product Detail</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !product ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={32} color={COLORS.danger} />
          <Text style={styles.muted}>ไม่พบข้อมูลสินค้านี้</Text>
        </View>
      ) : (
        <ScrollView>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} />
          ) : (
            <View style={styles.imageEmpty}>
              <Ionicons name="cube-outline" size={48} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.content}>
            {!!product.category && <Text style={styles.category}>{product.category}</Text>}
            <Text style={styles.name}>{product.product_name}</Text>
            <Text style={styles.price}>฿{Number(product.price).toLocaleString()}</Text>
            <Text style={[styles.stock, { color: product.stock_quantity > 0 ? "#3E8F68" : COLORS.danger }]}>
              {product.stock_quantity > 0 ? `เหลือ ${product.stock_quantity} ชิ้น` : "สินค้าหมด"}
            </Text>

            <Text style={styles.description}>
              {product.description || "ยังไม่มีรายละเอียดเพิ่มเติมสำหรับสินค้านี้"}
            </Text>

            {isAdmin && (
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => router.push({ pathname: "/manage-products" } as any)}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Edit Product</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Delete Product</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  muted: { color: COLORS.textSecondary, fontSize: 14 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: "#FFFFFF",
  },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },

  image: { width: "100%", height: 300, resizeMode: "contain", backgroundColor: COLORS.soft },
  imageEmpty: { width: "100%", height: 300, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center" },

  content: { padding: 20 },
  category: { fontSize: 12, fontWeight: "900", letterSpacing: 0.8, color: COLORS.primary },
  name: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginTop: 6 },
  price: { marginTop: 12, fontSize: 28, fontWeight: "900", color: COLORS.primaryDark },
  stock: { marginTop: 4, fontSize: 13, fontWeight: "700" },
  description: { marginTop: 20, lineHeight: 22, fontSize: 15, color: COLORS.textSecondary },

  buttonGroup: { flexDirection: "row", gap: 12, marginTop: 28 },
  editButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    gap: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
