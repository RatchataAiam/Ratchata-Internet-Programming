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

// ⚠️ ปรับ URL เหล่านี้ให้ตรงกับ endpoint จริงของ backend
// (สมมติฐานจากรูปแบบเดียวกับ /api/login ที่มีอยู่แล้ว)
// ขั้นที่ 1: ขอรหัส OTP / ลิงก์รีเซ็ตส่งไปที่อีเมล
const API_FORGOT_PASSWORD_URL =
  "http://119.59.102.161:3099/api/forgot-password";
// ขั้นที่ 2: ยืนยันรหัส OTP พร้อมตั้งรหัสผ่านใหม่
const API_RESET_PASSWORD_URL = "http://119.59.102.161:3099/api/reset-password";

// 📱 ธีมสีเดียวกับหน้า Product List / Login / Register
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

type Step = "request" | "reset";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("request");

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      notify("กรุณากรอกข้อมูล", "กรุณากรอกอีเมลหรือ Username ที่ใช้สมัคร");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_FORGOT_PASSWORD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถส่งรหัสยืนยันได้");
      }

      // 🧪 โหมดเดโม่: ไม่มีการส่งอีเมลจริง backend จะคืนรหัส OTP กลับมาให้แสดงบนหน้าจอโดยตรง
      if (data.demoOtp) {
        setOtpCode(data.demoOtp);
        notify(
          "รหัส OTP ของคุณ (โหมดเดโม่)",
          `เนื่องจากยังไม่ได้เชื่อมต่ออีเมลจริง ระบบจึงแสดงรหัสให้ที่นี่แทน:\n\n${data.demoOtp}\n\n(กรอกให้อัตโนมัติแล้ว)`
        );
      } else {
        notify(
          "ส่งรหัสยืนยันแล้ว",
          "กรุณาตรวจสอบอีเมลของคุณเพื่อรับรหัส OTP สำหรับตั้งรหัสผ่านใหม่"
        );
      }
      setStep("reset");
    } catch (error) {
      notify(
        "เกิดข้อผิดพลาด",
        error instanceof Error ? error.message : "ไม่สามารถส่งรหัสยืนยันได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpCode.trim()) {
      notify("กรุณากรอกข้อมูล", "กรุณากรอกรหัส OTP ที่ได้รับทางอีเมล");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      notify("ข้อมูลไม่ถูกต้อง", "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      notify("ข้อมูลไม่ถูกต้อง", "รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_RESET_PASSWORD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ไม่สามารถตั้งรหัสผ่านใหม่ได้");
      }

      // นำทางไป login ทันที ไม่ผูกกับปุ่มของ Alert (บนเว็บ Alert.alert ไม่แสดงผล ปุ่มจะไม่ถูกกดเลย)
      notify("ตั้งรหัสผ่านใหม่สำเร็จ", "กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      router.replace("/login");
    } catch (error) {
      notify(
        "เกิดข้อผิดพลาด",
        error instanceof Error ? error.message : "ไม่สามารถตั้งรหัสผ่านใหม่ได้"
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (step === "reset" ? setStep("request") : router.back())}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.brandBlock}>
            <View style={styles.logoCircle}>
              <Ionicons
                name={step === "request" ? "key-outline" : "shield-checkmark-outline"}
                size={28}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.brandTitle}>
              {step === "request" ? "Forgot Password" : "Reset Password"}
            </Text>
            <Text style={styles.brandSubtitle}>
              {step === "request"
                ? "กรอกอีเมลที่ใช้สมัคร เพื่อรับรหัสยืนยัน"
                : `กรอกรหัส OTP ที่ส่งไปยัง ${email || "อีเมลของคุณ"} พร้อมรหัสผ่านใหม่`}
            </Text>
          </View>

          <View style={styles.card}>
            {/* Step indicator */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, styles.stepDotActive]}>
                <Text style={styles.stepDotText}>1</Text>
              </View>
              <View
                style={[
                  styles.stepLine,
                  step === "reset" && { backgroundColor: COLORS.primary },
                ]}
              />
              <View
                style={[styles.stepDot, step === "reset" && styles.stepDotActive]}
              >
                <Text style={styles.stepDotText}>2</Text>
              </View>
            </View>

            {step === "request" ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Send Verification Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>OTP Code</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="keypad-outline" size={18} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter the 6-digit code"
                      placeholderTextColor={COLORS.textSecondary}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                    />
                  </View>
                  <Text style={styles.demoHint}>
                    🧪 โหมดเดโม่: ยังไม่ได้เชื่อมต่ออีเมลจริง รหัสจะถูกกรอกให้อัตโนมัติจากขั้นตอนก่อนหน้า
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="At least 6 characters"
                      placeholderTextColor={COLORS.textSecondary}
                      value={newPassword}
                      onChangeText={setNewPassword}
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
                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter new password"
                      placeholderTextColor={COLORS.textSecondary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendLink}
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  <Text style={styles.resendLinkText}>Didn't get a code? Resend</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.loginRow}>
              <Text style={styles.loginRowText}>Remember your password?</Text>
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
    paddingHorizontal: 20,
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
    textAlign: "center",
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
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 6,
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
  demoHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
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
  resendLink: {
    alignSelf: "center",
    marginTop: 14,
  },
  resendLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
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
