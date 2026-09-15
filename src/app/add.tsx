import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
  primary: "#7C5CFF",
  background: "#080A12",
  surface: "#111522",
  border: "#1B2130",
  text: "#F8FAFC",
  textSecondary: "#8F99AA",
};

export default function AddScreen() {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  
  // เพิ่ม State สำหรับ Category, Storage และ RAM แบบเลือกได้
  const [category, setCategory] = useState("Smartphone");
  const [storage, setStorage] = useState("128GB");
  const [ram, setRam] = useState("8GB");

  const categoryOptions = ["Smartphone", "Tablet"];
  const storageOptions = ["64GB", "128GB", "256GB", "512GB", "1TB"];
  const ramOptions = ["4GB", "8GB", "12GB", "16GB"];

  const saveProduct = () => {
    Alert.alert(
      "สำเร็จ",
      `เพิ่มสินค้าเรียบร้อย\nCategory: ${category}\nStorage: ${storage}\nRAM: ${ram}\n(ตัวอย่าง UI ภายหลังสามารถเชื่อม API ได้)`
    );

    setName("");
    setBrand("");
    setPrice("");
    setImage("");
    setCategory("Smartphone");
    setStorage("128GB");
    setRam("8GB");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080A12" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={28}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Add Product
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Product Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Product name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Brand</Text>
        <TextInput
          style={styles.input}
          placeholder="Apple / Samsung"
          value={brand}
          onChangeText={setBrand}
        />

        {/* Category Selection */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {categoryOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, category === item && styles.selectedChip]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.chipText, category === item && styles.selectedChipText]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Storage Selection */}
        <Text style={styles.label}>Storage</Text>
        <View style={styles.chipRow}>
          {storageOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, storage === item && styles.selectedChip]}
              onPress={() => setStorage(item)}
            >
              <Text style={[styles.chipText, storage === item && styles.selectedChipText]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* RAM Selection */}
        <Text style={styles.label}>RAM</Text>
        <View style={styles.chipRow}>
          {ramOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, ram === item && styles.selectedChip]}
              onPress={() => setRam(item)}
            >
              <Text style={[styles.chipText, ram === item && styles.selectedChipText]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          placeholder="3900"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={styles.label}>Image URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          value={image}
          onChangeText={setImage}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={saveProduct}
        >
          <Text style={styles.buttonText}>
            Save Product
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
  },
  form: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
    color: COLORS.text,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: "#080A12",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#111522",
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  selectedChipText: {
    color: "#FFFFFF",
  },
  button: {
    backgroundColor: COLORS.primary,
    marginTop: 30,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
});