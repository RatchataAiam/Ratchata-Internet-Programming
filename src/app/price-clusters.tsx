import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context-auth";

const API_URL = "http://119.59.102.161:3099/api";

type PriceTier = "High" | "Medium" | "Low";

type Product = {
  product_id: number;
  product_name: string;
  category: string;
  price: number;
  stock_quantity: number;
  image_url?: string | null;
  priceTier?: PriceTier;
};

type ClustersResponse = {
  tiers: Record<PriceTier, Product[]>;
  counts: Record<PriceTier, number>;
  centroids: Partial<Record<PriceTier, number>>;
  clusterCount: number;
  totalProducts: number;
};

const COLORS = {
  primary: "#E75480",
  background: "#FFF8FA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFF0F4",
  border: "#EBCFD8",
  text: "#2D2025",
  textSecondary: "#7E6870",
  textMuted: "#7E6870",
  danger: "#B93859",
};

const TIER_META: Record<
  PriceTier,
  { fg: string; bg: string; icon: keyof typeof Ionicons.glyphMap; hint: string }
> = {
  High: {
    fg: "#B93859",
    bg: "rgba(251, 113, 133, 0.14)",
    icon: "trending-up",
    hint: "Premium-priced items",
  },
  Medium: {
    fg: "#B45309",
    bg: "rgba(251, 191, 36, 0.14)",
    icon: "remove",
    hint: "Mid-range priced items",
  },
  Low: {
    fg: "#3E8F68",
    bg: "rgba(52, 211, 153, 0.14)",
    icon: "trending-down",
    hint: "Budget-friendly items",
  },
};

const TIER_ORDER: PriceTier[] = ["High", "Medium", "Low"];

export default function PriceClustersScreen() {
  const { user, token: userToken } = useAuth();
  const userRole = user?.role || "";

  const [data, setData] = useState<ClustersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedTier, setExpandedTier] = useState<PriceTier | null>("High");

  // backend คำนวณระดับราคาจากราคาปัจจุบันของ Products
  const loadClusters = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/products/clusters`);
      if (!response.ok) throw new Error("โหลดผลการจัดกลุ่มราคาไม่สำเร็จ");
      const json: ClustersResponse = await response.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ไม่สามารถเชื่อมต่อ Server ได้",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, []);

  if (!user || user.role !== "admin") return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>AI Price Clusters</Text>
          <Text style={styles.headerSubtitle}>
            Automatic High / Medium / Low grouping
          </Text>
        </View>
        <TouchableOpacity onPress={loadClusters} hitSlop={10}>
          <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.mutedText}>Running clustering model...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={32}
            color={COLORS.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadClusters}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoCard}>
            <Ionicons
              name="sparkles-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.infoText}>
              Prices are grouped into tiers with an unsupervised k-means model,
              run fresh on every refresh so new products are re-clustered
              automatically — no manual price bands needed.
            </Text>
          </View>

          <View style={styles.summaryRow}>
            {TIER_ORDER.map((tier) => {
              const meta = TIER_META[tier];
              const count = data?.counts?.[tier] ?? 0;
              const centroid = data?.centroids?.[tier];
              return (
                <View
                  key={tier}
                  style={[styles.summaryCard, { borderColor: meta.fg }]}
                >
                  <View
                    style={[
                      styles.summaryIconWrap,
                      { backgroundColor: meta.bg },
                    ]}
                  >
                    <Ionicons name={meta.icon} size={16} color={meta.fg} />
                  </View>
                  <Text style={[styles.summaryTier, { color: meta.fg }]}>
                    {tier}
                  </Text>
                  <Text style={styles.summaryCount}>{count} items</Text>
                  {typeof centroid === "number" && (
                    <Text style={styles.summaryAvg}>
                      avg ฿{centroid.toLocaleString()}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {TIER_ORDER.map((tier) => {
            const meta = TIER_META[tier];
            const items = data?.tiers?.[tier] ?? [];
            const expanded = expandedTier === tier;
            return (
              <View key={tier} style={styles.section}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setExpandedTier(expanded ? null : tier)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <View
                      style={[styles.tierDot, { backgroundColor: meta.fg }]}
                    />
                    <Text style={styles.sectionTitle}>{tier} price</Text>
                    <Text style={styles.sectionHint}>· {meta.hint}</Text>
                  </View>
                  <View style={styles.sectionHeaderRight}>
                    <Text style={styles.sectionCount}>{items.length}</Text>
                    <Ionicons
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.sectionBody}>
                    {items.length === 0 ? (
                      <Text style={styles.emptyTierText}>
                        ไม่มีสินค้าในกลุ่มนี้
                      </Text>
                    ) : (
                      items.map((item) => (
                        <TouchableOpacity
                          key={item.product_id}
                          style={styles.productRow}
                          onPress={() =>
                            router.push({
                              pathname: "/detail" as any,
                              params: {
                                id: item.product_id,
                                name: item.product_name,
                                price: item.price,
                                image: item.image_url || "",
                                token: userToken,
                                role: userRole,
                              },
                            })
                          }
                        >
                          {item.image_url ? (
                            <Image
                              source={{ uri: item.image_url }}
                              style={styles.productImage}
                            />
                          ) : (
                            <View style={styles.productImagePlaceholder}>
                              <Ionicons
                                name="cube-outline"
                                size={18}
                                color={COLORS.textMuted}
                              />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.productName} numberOfLines={1}>
                              {item.product_name}
                            </Text>
                            <Text style={styles.productCategory}>
                              {item.category}
                            </Text>
                          </View>
                          <Text
                            style={[styles.productPrice, { color: meta.fg }]}
                          >
                            ฿{Number(item.price).toLocaleString()}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  headerSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  scrollContent: { padding: 18, paddingBottom: 40 },

  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "flex-start",
    gap: 4,
  },
  summaryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  summaryTier: { fontSize: 13, fontWeight: "800" },
  summaryCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  summaryAvg: { fontSize: 11, color: COLORS.textMuted },

  section: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  tierDot: { width: 9, height: 9, borderRadius: 5 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  sectionHint: { fontSize: 11, color: COLORS.textMuted, flexShrink: 1 },
  sectionHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  sectionBody: { borderTopWidth: 1, borderColor: COLORS.border, padding: 8 },
  emptyTierText: {
    color: COLORS.textMuted,
    fontSize: 12,
    padding: 10,
    textAlign: "center",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
    borderRadius: 10,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  productCategory: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  productPrice: { fontSize: 13, fontWeight: "800" },

  mutedText: { color: COLORS.textSecondary, fontSize: 13 },
  errorText: {
    color: COLORS.danger,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: "#FFFFFF", fontWeight: "800" },
});
