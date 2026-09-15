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
import { Ionicons } from "@expo/vector-icons";

// ⚠️ ปรับ URL นี้ให้ตรงกับ endpoint สมัครสมาชิกจริงของ backend
// (สมมติฐานจากรูปแบบเดียวกับ /api/login ที่มีอยู่แล้ว)
const API_REGISTER_URL = "http://119.59.102.161:3099/api/register";

// 📱 ธีมสีเดียวกับหน้า Product List / Login (Tech Cyan / Dark Titanium)
const COLORS = {
  primary: "#E75480",
  primaryDark: "#C83D68",
  background: "#FFF8FA",
  cardBg: "#FFFFFF",
  border: "#EBCFD8",
  text: "#2D2025",
  textSecondary: "#7E6870",
  danger: "#B93859",
};

// react-native-web ไม่มีการแสดงผล Alert.alert() จริงบนเบราว์เซอร์ (ปุ่ม/callback ข้างในจะไม่ทำงานเลย)
// ฟังก์ชันนี้จึงสลับไปใช้ window.alert() บนเว็บแทน และไม่ผูก navigation ไว้กับปุ่มของ Alert
const notify = (title: string, message?: string, onDismiss?: () => void) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    onDismiss?.();
  } else {
    Alert.alert(
      title,
      message,
      onDismiss ? [{ text: "OK", onPress: onDismiss }] : undefined
    );
  }
};

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const emptyForm: FormState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterScreen() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): string | null => {
    if (!form.username.trim()) return "กรุณากรอก Username";
    if (form.username.trim().length < 3) return "Username ต้องมีอย่างน้อย 3 ตัวอักษร";
    if (!form.email.trim()) return "กรุณากรอกอีเมล";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim())) return "รูปแบบอีเมลไม่ถูกต้อง";
    if (!form.password) return "กรุณากรอกรหัสผ่าน";
    if (form.password.length < 6) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (form.password !== form.confirmPassword) return "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
    return null;
  };

  const handleRegister = async () => {
    const errorMessage = validate();
    if (errorMessage) {
      notify("ข้อมูลไม่ถูกต้อง", errorMessage);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "สมัครสมาชิกไม่สำเร็จ");
      }

      // นำทางไป login ทันที ไม่ผูกกับปุ่มของ Alert (บนเว็บ Alert.alert ไม่แสดงผล ปุ่มจะไม่ถูกกดเลย)
      notify("สมัครสมาชิกสำเร็จ", "กรุณาเข้าสู่ระบบด้วยบัญชีที่สร้างใหม่");
      router.replace("/login");
    } catch (error) {
      notify(
        "เกิดข้อผิดพลาด",
        error instanceof Error ? error.message : "ไม่สามารถสมัครสมาชิกได้"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.brandBlock}>
            <View style={styles.logoCircle}>
              <Ionicons name="person-add-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>สมัครสมาชิกเพื่อเริ่มใช้งานระบบ</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.username}
                  onChangeText={(v) => updateForm("username", v)}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.email}
                  onChangeText={(v) => updateForm("email", v)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.password}
                  onChangeText={(v) => updateForm("password", v)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.confirmPassword}
                  onChangeText={(v) => updateForm("confirmPassword", v)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginRowText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={styles.loginRowLink}> Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingVertical: 40,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#FFF0F4",
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: COLORS.text,
  },
  button: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  loginRowText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  loginRowLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
  },
});
