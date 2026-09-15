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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../context-auth";

const API = "http://119.59.102.161:3099/api/cats";
const BREEDS_API = "http://119.59.102.161:3099/api/breeds";

const C = {
  bg: "#FFF8FA",
  white: "#fff",
  ink: "#2D2025",
  muted: "#7E6870",
  pink: "#E75480",
  pinkDark: "#C83D68",
  border: "#EBCFD8",
  soft: "#FFF0F4",
  danger: "#B93859",
  green: "#3E8F68",
};

type Breed = {
  breed_id: number;
  breed_name: string;
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

const empty = {
  breed_id: 0,
  name: "",
  gender: "",
  birth_date: "",
  price: "",
  description: "",
  image_url: "",
};

const notify = (t: string, m: string) =>
  Platform.OS === "web" ? window.alert(`${t}\n\n${m}`) : Alert.alert(t, m);

/* แปลงวันที่ให้เป็นรูปแบบที่ MySQL DATE รองรับ */
const formatMySQLDate = (value?: string | null) => {
  if (!value) return null;
  return String(value).split("T")[0];
};

export default function ManageCats() {
  const { user, token } = useAuth();

  const [items, setItems] = useState<Cat[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [breedFilter, setBreedFilter] = useState("All");

  // ต้องโหลดข้อมูล Breeds คู่กับ Cats เพื่อแสดงความสัมพันธ์ของสายพันธุ์
  const load = async () => {
    setLoading(true);

    try {
      const [c, b] = await Promise.all([fetch(API), fetch(BREEDS_API)]);

      if (!c.ok || !b.ok) throw new Error("โหลดข้อมูลแมวไม่สำเร็จ");

      setItems(await c.json());
      setBreeds(await b.json());
    } catch (e) {
      notify("ผิดพลาด", e instanceof Error ? e.message : "เชื่อมต่อไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user]);

  if (!user || user.role !== "admin") return null;

  // แมวขายได้ครั้งเดียว จึงเปลี่ยนสถานะ is_available แทนการลดสต็อก
  const save = async () => {
    if (!form.breed_id || !form.name.trim() || form.price === "") {
      notify("ข้อมูลไม่ครบ", "กรุณาเลือกสายพันธุ์ กรอกชื่อ และราคา");
      return;
    }

    const body = {
      breed_id: form.breed_id,
      name: form.name.trim(),
      gender: form.gender || null,

      // แก้ตรงนี้ให้เป็น YYYY-MM-DD
      birth_date: formatMySQLDate(form.birth_date),

      price: Number(form.price),
      description: form.description || null,
      image_url: form.image_url || null,
    };

    try {
      const r = await fetch(editing ? `${API}/${editing.cat_id}` : API, {
        method: editing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(
          editing
            ? {
                ...body,
                is_available: editing.is_available,
              }
            : body,
        ),
      });

      const d = await r.json();

      if (!r.ok) throw new Error(d.message || "บันทึกไม่สำเร็จ");

      setEditing(null);
      setForm(empty);

      await load();

      notify("สำเร็จ", editing ? "แก้ไขข้อมูลแมวแล้ว" : "เพิ่มแมวแล้ว");
    } catch (e) {
      notify("ผิดพลาด", e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  };

  const edit = (c: Cat) => {
    setEditing(c);

    setForm({
      breed_id: c.breed_id,
      name: c.name,
      gender: c.gender || "",

      birth_date: c.birth_date || "",

      price: String(c.price),
      description: c.description || "",
      image_url: c.image_url || "",
    });
  };

  const toggleAvailable = async (c: Cat) => {
    try {
      const r = await fetch(`${API}/${c.cat_id}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          breed_id: c.breed_id,
          name: c.name,
          gender: c.gender,

          // แก้ตรงนี้เช่นกัน
          birth_date: formatMySQLDate(c.birth_date),

          price: c.price,
          description: c.description,
          image_url: c.image_url,
          is_available: !c.is_available,
        }),
      });

      if (!r.ok) throw new Error((await r.json()).message || "อัปเดตไม่สำเร็จ");

      await load();
    } catch (e) {
      notify("ผิดพลาด", e instanceof Error ? e.message : "อัปเดตไม่สำเร็จ");
    }
  };

  const del = (c: Cat) => {
    const run = async () => {
      try {
        const r = await fetch(`${API}/${c.cat_id}`, {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!r.ok) throw new Error((await r.json()).message || "ลบไม่สำเร็จ");

        await load();
      } catch (e) {
        notify("ผิดพลาด", e instanceof Error ? e.message : "ลบไม่สำเร็จ");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`ลบ ${c.name} ?`)) run();
    } else {
      Alert.alert("ยืนยันการลบ", c.name, [
        {
          text: "ยกเลิก",
        },
        {
          text: "ลบ",
          style: "destructive",
          onPress: run,
        },
      ]);
    }
  };

  const breedNameById = useMemo(
    () =>
      Object.fromEntries(breeds.map((b) => [String(b.breed_id), b.breed_name])),
    [breeds],
  );
  const breedGroups = useMemo(
    () => ["All", ...Array.from(new Set(items.map((c) => String(c.breed_id))))],
    [items],
  );
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (c) =>
        (breedFilter === "All" || String(c.breed_id) === breedFilter) &&
        (!q ||
          `${c.cat_id} ${c.name} ${c.breed_name || breedNameById[String(c.breed_id)] || ""} ${c.breed_id} ${c.gender || ""} ${c.description || ""}`
            .toLowerCase()
            .includes(q)),
    );
  }, [items, search, breedFilter, breedNameById]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.pink} />
        </TouchableOpacity>

        <View>
          <Text style={s.title}>จัดการแมวที่ขาย</Text>

          <Text style={s.sub}>Cats ตามโครงสร้าง SQL</Text>
        </View>

        <TouchableOpacity onPress={load}>
          <Ionicons name="refresh" size={21} color={C.pink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.form}>
          <Text style={s.section}>
            {editing ? "แก้ไขข้อมูลแมว" : "เพิ่มแมว"}
          </Text>

          <Text style={s.label}>สายพันธุ์</Text>

          <View style={s.chipsRow}>
            {breeds.map((b) => (
              <TouchableOpacity
                key={b.breed_id}
                style={[s.chip, form.breed_id === b.breed_id && s.chipActive]}
                onPress={() =>
                  setForm({
                    ...form,
                    breed_id: b.breed_id,
                  })
                }
              >
                <Text
                  style={[
                    s.chipText,
                    form.breed_id === b.breed_id && s.chipTextActive,
                  ]}
                >
                  {b.breed_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>ชื่อแมว</Text>

          <TextInput
            style={s.input}
            value={form.name}
            onChangeText={(v) =>
              setForm({
                ...form,
                name: v,
              })
            }
            placeholder="Mochi"
            placeholderTextColor="#B49BA4"
          />

          <Text style={s.label}>เพศ</Text>

          <View style={s.chipsRow}>
            {["Male", "Female"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[s.chip, form.gender === g && s.chipActive]}
                onPress={() =>
                  setForm({
                    ...form,
                    gender: g,
                  })
                }
              >
                <Text
                  style={[s.chipText, form.gender === g && s.chipTextActive]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>วันเกิด (YYYY-MM-DD)</Text>

          <TextInput
            style={s.input}
            value={form.birth_date}
            onChangeText={(v) =>
              setForm({
                ...form,
                birth_date: v,
              })
            }
            placeholder="2025-03-12"
            placeholderTextColor="#B49BA4"
          />

          <Text style={s.label}>ราคา</Text>

          <TextInput
            style={s.input}
            value={form.price}
            onChangeText={(v) =>
              setForm({
                ...form,
                price: v,
              })
            }
            placeholder="18500"
            placeholderTextColor="#B49BA4"
            keyboardType="numeric"
          />

          <Text style={s.label}>Image URL</Text>

          <TextInput
            style={s.input}
            value={form.image_url}
            onChangeText={(v) =>
              setForm({
                ...form,
                image_url: v,
              })
            }
            placeholder="https://..."
            placeholderTextColor="#B49BA4"
          />

          <Text style={s.label}>รายละเอียด</Text>

          <TextInput
            style={[s.input, s.area]}
            value={form.description}
            onChangeText={(v) =>
              setForm({
                ...form,
                description: v,
              })
            }
            placeholder="Description"
            placeholderTextColor="#B49BA4"
            multiline
          />

          <View style={s.formBtns}>
            {editing && (
              <TouchableOpacity
                style={s.cancel}
                onPress={() => {
                  setEditing(null);
                  setForm(empty);
                }}
              >
                <Text style={s.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.save} onPress={save}>
              <Text style={s.saveText}>
                {editing ? "บันทึกการแก้ไข" : "เพิ่มแมว"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.section}>
          รายการแมว ({filteredItems.length}/{items.length})
        </Text>

        <View style={s.search}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ค้นหาชื่อแมว / Breed / ID"
            placeholderTextColor="#B49BA4"
            style={s.searchInput}
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {breedGroups.map((id) => (
            <TouchableOpacity
              key={id}
              style={[s.filterBtn, breedFilter === id && s.filterBtnActive]}
              onPress={() => setBreedFilter(id)}
            >
              <Text
                style={[s.filterText, breedFilter === id && s.filterTextActive]}
              >
                {id === "All"
                  ? "ทุกสายพันธุ์"
                  : `${breedNameById[id] || `Breed ID ${id}`} · ID ${id}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={C.pink} />
        ) : filteredItems.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={30} color={C.muted} />
            <Text style={s.muted}>ไม่พบแมวที่ค้นหา</Text>
          </View>
        ) : (
          breedGroups
            .slice(1)
            .filter((id) => breedFilter === "All" || id === breedFilter)
            .map((id) => (
              <View key={id}>
                <View style={s.groupHeader}>
                  <View>
                    <Text style={s.groupTitle}>
                      {breedNameById[id] || `Breed ID ${id}`}
                    </Text>
                    <Text style={s.groupSub}>Breed ID {id}</Text>
                  </View>
                  <Text style={s.groupCount}>
                    {
                      filteredItems.filter((c) => String(c.breed_id) === id)
                        .length
                    }{" "}
                    ตัว
                  </Text>
                </View>
                {filteredItems
                  .filter((c) => String(c.breed_id) === id)
                  .map((c) => (
                    <View key={c.cat_id} style={s.card}>
                      {c.image_url ? (
                        <Image source={{ uri: c.image_url }} style={s.image} />
                      ) : (
                        <View style={s.imageEmpty}>
                          <Ionicons name="paw" size={28} color={C.pink} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.name}>{c.name}</Text>
                        <Text style={s.meta}>
                          {c.breed_name ||
                            breedNameById[String(c.breed_id)] ||
                            "—"}
                          {c.gender ? ` · ${c.gender}` : ""}
                        </Text>
                        <Text style={s.price}>
                          ฿{Number(c.price).toLocaleString()}
                        </Text>
                      </View>
                      <View style={s.actions}>
                        <TouchableOpacity onPress={() => toggleAvailable(c)}>
                          <Ionicons
                            name={
                              c.is_available
                                ? "checkmark-circle"
                                : "close-circle"
                            }
                            size={22}
                            color={c.is_available ? C.green : C.danger}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => edit(c)}>
                          <Ionicons
                            name="create-outline"
                            size={21}
                            color={C.pink}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => del(c)}>
                          <Ionicons
                            name="trash-outline"
                            size={21}
                            color={C.danger}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  header: {
    height: 68,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },

  title: {
    fontSize: 19,
    fontWeight: "900",
    color: C.ink,
  },

  sub: {
    fontSize: 10,
    color: C.muted,
  },

  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 50,
  },

  form: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 20,
  },

  section: {
    fontSize: 18,
    fontWeight: "900",
    color: C.ink,
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: C.ink,
    marginTop: 10,
    marginBottom: 5,
  },

  input: {
    height: 45,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#FFFBFC",
    paddingHorizontal: 11,
    color: C.ink,
    fontSize: 13,
  },

  area: {
    height: 80,
    paddingTop: 11,
    textAlignVertical: "top",
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#FFFBFC",
    alignItems: "center",
    justifyContent: "center",
  },

  chipActive: {
    backgroundColor: C.pink,
    borderColor: C.pink,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.ink,
  },

  chipTextActive: {
    color: "#fff",
  },

  formBtns: {
    flexDirection: "row",
    gap: 9,
    marginTop: 15,
  },

  save: {
    height: 45,
    backgroundColor: C.pink,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "900",
  },

  cancel: {
    height: 45,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    color: C.ink,
    fontWeight: "800",
  },

  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  image: {
    width: 65,
    height: 65,
    resizeMode: "cover",
    backgroundColor: C.soft,
  },

  imageEmpty: {
    width: 65,
    height: 65,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
  },

  name: {
    fontSize: 14,
    fontWeight: "900",
    color: C.ink,
  },

  meta: {
    fontSize: 11,
    color: C.muted,
    marginTop: 4,
  },

  price: {
    fontSize: 15,
    fontWeight: "900",
    color: C.pinkDark,
    marginTop: 4,
  },

  actions: {
    gap: 12,
    paddingHorizontal: 4,
  },
  search: {
    height: 45,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: C.ink, fontSize: 13 },
  filterRow: { gap: 8, paddingVertical: 8 },
  filterBtn: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  filterBtnActive: { backgroundColor: C.pink, borderColor: C.pink },
  filterText: { fontSize: 11, fontWeight: "800", color: C.pinkDark },
  filterTextActive: { color: "#fff" },
  groupHeader: {
    marginTop: 12,
    marginBottom: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: C.soft,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupTitle: { fontSize: 14, fontWeight: "900", color: C.ink },
  groupSub: { fontSize: 10, color: C.muted, marginTop: 2 },
  groupCount: { fontSize: 11, fontWeight: "800", color: C.pinkDark },
  empty: { padding: 35, alignItems: "center", gap: 8 },
  muted: { fontSize: 13, color: C.muted },
});
