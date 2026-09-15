import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

const C = {
  pink: "#E75480",
  pinkDark: "#C83D68",
  bg: "#FFF8FA",
  white: "#FFFFFF",
  ink: "#2D2025",
  muted: "#7E6870",
  border: "#EBCFD8",
  soft: "#FFF0F4",
};

// ทำให้การแจ้งเตือนทำงานสม่ำเสมอทั้งบนเว็บและมือถือ
const notify = (title: string, msg: string) =>
  Platform.OS === "web"
    ? window.alert(`${title}\n\n${msg}`)
    : Alert.alert(title, msg);

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!username.trim() || !password) {
      notify("ข้อมูลไม่ครบ", "กรุณากรอก Username และ Password");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace("/");
    } catch (e) {
      notify(
        "เข้าสู่ระบบไม่สำเร็จ",
        e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.wrap}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.brand}>
            <View style={s.logo}>
              <Ionicons name="paw" size={30} color={C.pink} />
            </View>
            <Text style={s.brandTitle}>Paw & Pet Shop</Text>
            <Text style={s.subtitle}>เข้าสู่ระบบเพื่อเลือกแมวและสินค้า</Text>
          </View>
          <View style={s.card}>
            <Text style={s.title}>เข้าสู่ระบบ</Text>
            <Text style={s.help}>กรุณาเข้าสู่ระบบก่อนใช้งานทุกครั้ง</Text>
            <Text style={s.label}>Username</Text>
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={19} color={C.muted} />
              <TextInput
                style={s.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor="#B49BA4"
                autoCapitalize="none"
              />
            </View>
            <Text style={s.label}>Password</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={19} color={C.muted} />
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#B49BA4"
                secureTextEntry={!show}
              />
              <TouchableOpacity onPress={() => setShow(!show)}>
                <Ionicons
                  name={show ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color={C.muted}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={s.forgot}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={s.link}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.button, loading && { opacity: 0.6 }]}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
            <View style={s.divider}>
              <View style={s.line} />
              <Text style={s.or}>or</Text>
              <View style={s.line} />
            </View>
            <TouchableOpacity
              style={s.outline}
              onPress={() => router.push("/register")}
            >
              <Text style={s.outlineText}>Create a new account</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.footer}>
            © {new Date().getFullYear()} Paw & Pet Shop
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  wrap: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  brand: { alignItems: "center", marginBottom: 24 },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: C.soft,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandTitle: { fontSize: 24, fontWeight: "900", color: C.ink },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 5 },
  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    padding: 26,
    shadowColor: "#9A536B",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  title: { fontSize: 23, fontWeight: "900", color: C.ink, textAlign: "center" },
  help: {
    textAlign: "center",
    fontSize: 13,
    color: C.muted,
    marginTop: 5,
    marginBottom: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: C.ink,
    marginBottom: 7,
    marginTop: 12,
  },
  inputWrap: {
    height: 50,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: "#FFFBFC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 9,
  },
  input: { flex: 1, color: C.ink, fontSize: 14 },
  forgot: { alignSelf: "flex-end", marginTop: 10, marginBottom: 16 },
  link: { color: C.pinkDark, fontWeight: "800", fontSize: 13 },
  button: {
    height: 50,
    backgroundColor: C.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  or: { color: C.muted, fontWeight: "700" },
  outline: {
    height: 50,
    borderWidth: 1.5,
    borderColor: C.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: { color: C.pinkDark, fontWeight: "900" },
  footer: { marginTop: 20, color: C.muted, fontSize: 12 },
});
