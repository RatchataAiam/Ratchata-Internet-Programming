import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from "../context-auth";

const API = "http://119.59.102.161:3099/api/products";
const COLORS = {
  primary: "#E75480",
  background: "#FFF8FA",
  surface: "#FFFFFF",
  border: "#EBCFD8",
  text: "#2D2025",
};

const notify = (title: string, message: string) =>
  Platform.OS === "web"
    ? window.alert(`${title}\n\n${message}`)
    : Alert.alert(title, message);

export default function AddScreen() {
  const { token } = useAuth();
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // ฟิลด์เหล่านี้ตรงกับคอลัมน์ในตาราง Products ตาม SQL
  const saveProduct = async () => {
    if (!productName.trim() || !category.trim() || price === "") {
      notify("ข้อมูลไม่ครบ", "กรุณากรอกชื่อสินค้า หมวดหมู่ และราคา");
      return;
    }
    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_name: productName.trim(),
          category: category.trim(),
          price: Number(price),
          stock_quantity: Number(stockQuantity || 0),
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "เพิ่มสินค้าไม่สำเร็จ");

      notify("สำเร็จ", "เพิ่มสินค้าเรียบร้อยแล้ว");
      router.back();
    } catch (error) {
      notify(
        "เกิดข้อผิดพลาด",
        error instanceof Error ? error.message : "ไม่สามารถเพิ่มสินค้าได้",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>เพิ่มสินค้า</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.sectionTitle}>ข้อมูลสินค้า</Text>
        <Text style={styles.label}>ชื่อสินค้า</Text>
        <TextInput
          style={styles.input}
          placeholder="Royal Canin Persian Adult"
          placeholderTextColor="#B49BA4"
          value={productName}
          onChangeText={setProductName}
        />
        <Text style={styles.label}>หมวดหมู่</Text>
        <TextInput
          style={styles.input}
          placeholder="Cat Food"
          placeholderTextColor="#B49BA4"
          value={category}
          onChangeText={setCategory}
        />
        <Text style={styles.label}>ราคา</Text>
        <TextInput
          style={styles.input}
          placeholder="850"
          placeholderTextColor="#B49BA4"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        <Text style={styles.label}>จำนวนสต็อก</Text>
        <TextInput
          style={styles.input}
          placeholder="20"
          placeholderTextColor="#B49BA4"
          keyboardType="numeric"
          value={stockQuantity}
          onChangeText={setStockQuantity}
        />
        <Text style={styles.label}>รายละเอียด</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Complete food for adult cats"
          placeholderTextColor="#B49BA4"
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <Text style={styles.label}>Image URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor="#B49BA4"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={saveProduct}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>บันทึกสินค้า</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerSpacer: { width: 26 },
  title: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  form: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 50,
  },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  label: {
    marginTop: 16,
    marginBottom: 7,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontSize: 14,
  },
  textArea: { minHeight: 100, paddingTop: 14, textAlignVertical: "top" },
  button: {
    height: 50,
    marginTop: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
});
