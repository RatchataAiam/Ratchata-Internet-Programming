import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context-auth";

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
const notify = (t: string, m: string) =>
  Platform.OS === "web" ? window.alert(`${t}\n\n${m}`) : Alert.alert(t, m);
export default function Payment() {
  const { token } = useAuth();
  const { orderId, total } = useLocalSearchParams();
  const [method, setMethod] = useState("QR Payment");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // ตอนนี้ช่องทางชำระเงินใช้เพื่อแสดงผล ส่วน API จะเปลี่ยนคำสั่งซื้อเป็น Paid
  const pay = async () => {
    if (!token) return router.replace("/login");
    setLoading(true);
    try {
      const r = await fetch(`${API}/orders/${orderId}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "ชำระเงินไม่สำเร็จ");
      setDone(true);
    } catch (e) {
      notify(
        "ชำระเงินไม่สำเร็จ",
        e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
      );
    } finally {
      setLoading(false);
    }
  };
  if (done)
    return (
      <SafeAreaView style={s.container}>
        <View style={s.success}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark" size={44} color={C.green} />
          </View>
          <Text style={s.successTitle}>ชำระเงินสำเร็จ</Text>
          <Text style={s.muted}>คำสั่งซื้อ #{orderId} ได้รับการยืนยันแล้ว</Text>
          <Text style={s.amount}>฿{Number(total || 0).toLocaleString()}</Text>
          <TouchableOpacity
            style={s.button}
            onPress={() => router.replace("/")}
          >
            <Text style={s.buttonText}>กลับหน้าสินค้า</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={25} color={C.pink} />
        </TouchableOpacity>
        <Text style={s.title}>ชำระเงิน</Text>
        <View style={{ width: 25 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.step}>
          <View style={s.doneStep}>
            <Text style={s.stepNum}>✓</Text>
          </View>
          <Text style={s.stepMuted}>ข้อมูลจัดส่ง</Text>
          <View style={s.stepLine} />
          <View style={s.activeStep}>
            <Text style={s.activeNum}>2</Text>
          </View>
          <Text style={s.activeText}>ชำระเงิน</Text>
        </View>
        <View style={s.card}>
          <Text style={s.section}>คำสั่งซื้อ #{orderId}</Text>
          <View style={s.total}>
            <Text style={s.totalLabel}>ยอดที่ต้องชำระ</Text>
            <Text style={s.totalValue}>
              ฿{Number(total || 0).toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={s.card}>
          <Text style={s.section}>เลือกช่องทางชำระเงิน</Text>
          {["QR Payment", "โอนผ่านธนาคาร", "ชำระเงินปลายทาง"].map((x) => (
            <TouchableOpacity
              key={x}
              style={[s.method, method === x && s.methodActive]}
              onPress={() => setMethod(x)}
            >
              <View style={[s.radio, method === x && s.radioActive]}>
                {method === x && <View style={s.radioDot} />}
              </View>
              <Ionicons
                name={
                  x === "QR Payment"
                    ? "qr-code-outline"
                    : x === "โอนผ่านธนาคาร"
                      ? "business-outline"
                      : "cash-outline"
                }
                size={22}
                color={C.pink}
              />
              <Text style={s.methodText}>{x}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.notice}>
          <Ionicons name="shield-checkmark-outline" size={20} color={C.pink} />
          <Text style={s.noticeText}>
            หน้านี้เป็นระบบชำระเงินของโปรเจกต์
            ตัวเลือกเป็นตัวอย่างและจะเปลี่ยนสถานะคำสั่งซื้อเป็น Paid หลังยืนยัน
          </Text>
        </View>
        <TouchableOpacity
          style={[s.button, loading && { opacity: 0.6 }]}
          onPress={pay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>ยืนยันการชำระเงิน</Text>
          )}
        </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  title: { fontSize: 20, fontWeight: "900", color: C.ink },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 50,
  },
  step: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  doneStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  activeStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { color: C.green, fontWeight: "900" },
  activeNum: { color: "#fff", fontWeight: "900" },
  stepMuted: { fontSize: 12, color: C.muted, marginLeft: 7 },
  activeText: { fontSize: 12, fontWeight: "900", color: C.pink, marginLeft: 7 },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 10,
  },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 14,
  },
  section: { fontSize: 17, fontWeight: "900", color: C.ink, marginBottom: 14 },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: C.border,
    paddingTop: 14,
  },
  totalLabel: { fontWeight: "800", color: C.muted },
  totalValue: { fontSize: 24, fontWeight: "900", color: C.pinkDark },
  method: {
    height: 54,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 9,
  },
  methodActive: { borderColor: C.pink, backgroundColor: C.soft },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: C.pink },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.pink },
  methodText: { fontSize: 13, fontWeight: "800", color: C.ink },
  notice: {
    padding: 14,
    backgroundColor: C.soft,
    borderLeftWidth: 3,
    borderLeftColor: C.pink,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, color: C.muted },
  button: {
    height: 52,
    backgroundColor: C.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  success: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#EAF7F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: { fontSize: 25, fontWeight: "900", color: C.ink },
  muted: { fontSize: 13, color: C.muted, marginTop: 6 },
  amount: {
    fontSize: 30,
    fontWeight: "900",
    color: C.pinkDark,
    marginVertical: 20,
  },
});
