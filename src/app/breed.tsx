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
import { useCart } from "../context-cart";

const API = "http://119.59.102.161:3099/api";
const C = {
  bg: "#FFF8FA",
  white: "#FFF",
  ink: "#2D2025",
  muted: "#7E6870",
  pink: "#E75480",
  pinkDark: "#C83D68",
  border: "#EBCFD8",
  soft: "#FFF0F4",
  green: "#3E8F68",
};

// เลือกใช้ระบบแจ้งเตือนให้เหมาะกับแพลตฟอร์มและการทำงานของหน้านี้
const notify = (t: string, m: string) =>
  Platform.OS === "web" ? window.alert(`${t}\n\n${m}`) : Alert.alert(t, m);
type Breed = {
  breed_id: number;
  breed_name: string;
  description?: string | null;
  image_url?: string | null;
};
type Cat = {
  cat_id: number;
  breed_id: number;
  breed_name?: string | null;
  name: string;
  gender?: string | null;
  birth_date?: string | null;
  price: number;
  is_available: 0 | 1;
  description?: string | null;
  image_url?: string | null;
};

export default function BreedScreen() {
  const { breedId } = useLocalSearchParams();
  const { addItem } = useCart();
  const [breed, setBreed] = useState<Breed | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลสายพันธุ์ที่เลือกพร้อมแมวที่อยู่ในสายพันธุ์นั้น
  useEffect(() => {
    (async () => {
      try {
        const id = Number(breedId);
        const [b, c] = await Promise.all([
          fetch(`${API}/breeds/${id}`),
          fetch(`${API}/breeds/${id}/cats`),
        ]);
        if (!b.ok || !c.ok) throw new Error("โหลดข้อมูลสายพันธุ์ไม่สำเร็จ");
        setBreed(await b.json());
        setCats(await c.json());
      } catch (e) {
        notify("ผิดพลาด", e instanceof Error ? e.message : "เชื่อมต่อไม่ได้");
      } finally {
        setLoading(false);
      }
    })();
  }, [breedId]);
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={25} color={C.pink} />
        </TouchableOpacity>
        <Text style={s.title}>แมวสายพันธุ์นี้</Text>
        <View style={{ width: 25 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {loading ? (
          <View style={s.loading}>
            <ActivityIndicator size="large" color={C.pink} />
            <Text style={s.muted}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : (
          <>
            {breed && (
              <View style={s.breedCard}>
                {breed.image_url ? (
                  <Image
                    source={{ uri: breed.image_url }}
                    style={s.breedImage}
                  />
                ) : (
                  <View style={s.breedImageEmpty}>
                    <Ionicons name="paw" size={48} color={C.pink} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.breedName}>{breed.breed_name}</Text>
                  <Text style={s.description}>
                    {breed.description || "ไม่มีรายละเอียด"}
                  </Text>
                </View>
              </View>
            )}
            <View style={s.sectionHead}>
              <View>
                <Text style={s.sectionTitle}>
                  แมวที่ขายในสายพันธุ์ {breed?.breed_name || ""}
                </Text>
                <Text style={s.muted}>เลือกแมวที่ต้องการเพิ่มลงตะกร้า</Text>
              </View>
              <Text style={s.count}>
                {cats.filter((c) => c.is_available).length} ตัว
              </Text>
            </View>
            {cats.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="paw-outline" size={38} color={C.muted} />
                <Text style={s.muted}>ยังไม่มีแมวในสายพันธุ์นี้</Text>
              </View>
            ) : (
              <View>
                {cats.map((c) => (
                  <View key={c.cat_id} style={s.catCard}>
                    {c.image_url ? (
                      <Image source={{ uri: c.image_url }} style={s.catImage} />
                    ) : (
                      <View style={s.catImageEmpty}>
                        <Ionicons name="paw" size={35} color={C.pink} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={s.catName}>{c.name}</Text>
                      <Text style={s.meta}>
                        {c.gender || "ไม่ระบุเพศ"}
                        {c.birth_date ? ` · ${c.birth_date}` : ""}
                      </Text>
                      <Text style={s.desc} numberOfLines={2}>
                        {c.description || "แมวพร้อมย้ายบ้าน"}
                      </Text>
                      <Text style={s.price}>
                        ฿{Number(c.price).toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      disabled={!c.is_available}
                      style={[s.add, !c.is_available && { opacity: 0.4 }]}
                      onPress={() => {
                        addItem({
                          item_type: "Cat",
                          cat_id: c.cat_id,
                          name: c.name,
                          price: Number(c.price),
                          image_url: c.image_url,
                          quantity: 1,
                        });
                        notify(
                          "เพิ่มลงตะกร้าแล้ว",
                          `${c.name} ถูกเพิ่มลงตะกร้า`,
                        );
                      }}
                    >
                      <Ionicons name="cart-outline" size={18} color="#fff" />
                      <Text style={s.addText}>
                        {c.is_available ? "เพิ่ม" : "ขายแล้ว"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    height: 68,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  title: { fontSize: 19, fontWeight: "900", color: C.ink },
  content: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 50,
  },
  loading: { padding: 70, alignItems: "center" },
  breedCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  breedImage: { width: 130, height: 130, backgroundColor: C.soft },
  breedImageEmpty: {
    width: 130,
    height: 130,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  breedName: { fontSize: 25, fontWeight: "900", color: C.ink },
  description: { fontSize: 13, color: C.muted, lineHeight: 20, marginTop: 8 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: C.ink },
  count: { fontSize: 12, fontWeight: "800", color: C.pinkDark },
  catCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  catImage: { width: 95, height: 95, backgroundColor: C.soft },
  catImageEmpty: {
    width: 95,
    height: 95,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: { fontSize: 16, fontWeight: "900", color: C.ink },
  meta: { fontSize: 11, color: C.muted, marginTop: 4 },
  desc: { fontSize: 12, color: C.muted, marginTop: 7 },
  price: { fontSize: 17, fontWeight: "900", color: C.pinkDark, marginTop: 8 },
  add: {
    height: 40,
    paddingHorizontal: 13,
    backgroundColor: C.pink,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  empty: { padding: 45, alignItems: "center" },
  muted: { fontSize: 13, color: C.muted, marginTop: 5 },
});
