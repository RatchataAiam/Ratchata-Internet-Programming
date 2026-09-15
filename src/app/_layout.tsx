import { DarkTheme, Slot, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Platform } from "react-native";
import { AuthProvider, useAuth } from "../context-auth";
import { CartProvider } from "../context-cart";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

// ธีมกลางสำหรับให้ทุกหน้าใช้โทนสีเดียวกัน
const PinkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#E75480",
    background: "#FFF8FA",
    card: "#FFFFFF",
    text: "#2D2025",
    border: "#EBCFD8",
    notification: "#E75480",
  },
};

function RouteGuard() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const publicRoutes = ["/login", "/register", "/forgot-password"];

  // ก่อนเข้าสู่ระบบ อนุญาตให้เปิดได้เฉพาะหน้าที่เกี่ยวกับการยืนยันตัวตน
  useEffect(() => {
    if (!user && !publicRoutes.includes(pathname)) router.replace("/login");
  }, [user, pathname]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <PinkThemeProvider>
          <RouteGuard />
        </PinkThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}

function PinkThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>
        {Platform.OS === "web"
          ? `html,body,#root{background:#FFF8FA!important;color:#2D2025}*{box-sizing:border-box}::selection{background:#F6B6C8;color:#2D2025}`
          : ""}
      </style>
      <AnimatedSplashOverlay />
      {children}
    </>
  );
}
