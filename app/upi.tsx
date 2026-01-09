import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Confirm Parking / Initial Payment Page
 *
 * - Single "Pay Now" flow using the initial payment link (first link).
 * - After the user visits the link, show a confirmation popup:
 *     "Did you complete the payment successfully?"
 *     - Yes -> save local state "confirmed" and navigate to arrival-countdown.
 *     - No  -> stay on this page (allow refresh/check later).
 *
 * - Displays professional-looking booking details card and a clean CTA.
 * - Shows "₹50 per hour" (note: for testing arrival countdown uses 1 minute).
 *
 * Color system:
 * - Primary / Accent: #0D1B2A
 * - Background: #FFFFFF
 * - Neutral: #C4C4C4
 *
 * Notes:
 * - In production this should verify payment using a backend/webhook. This is a test-friendly UX.
 */

const INITIAL_PAYMENT_URL = "https://rzp.io/rzp/KCcEu6nd";

const COLORS = {
  primary: "#0D1B2A",
  background: "#FFFFFF",
  neutral: "#C4C4C4",
  success: "#10B981", // subtle green tinge from index
  border: "#E9EDF1",
};

const PAYMENT_STATE_KEY = "@parking_payment_state";

export default function UpiScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const spotName = (params?.spotName as string) ?? "Selected Parking";
  const availability = (params?.spotOccupied as string) === "true" ? "Occupied" : "Available";
  const temp = params?.spotTemperature ?? "";
  const humidity = params?.spotHumidity ?? "";

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentState, setPaymentState] = useState<string | null>(null);

  useEffect(() => {
    loadSavedState();
  }, []);

  const loadSavedState = async () => {
    try {
      const s = await AsyncStorage.getItem(PAYMENT_STATE_KEY);
      setPaymentState(s);
    } catch (e) {
      console.warn("Failed to read payment state", e);
    }
  };

  const saveState = async (state: "initial" | "confirmed" | "completed") => {
    try {
      await AsyncStorage.setItem(PAYMENT_STATE_KEY, state);
      setPaymentState(state);
    } catch (e) {
      console.warn("Failed to save payment state", e);
    }
  };

  const handlePayNow = async () => {
    setIsProcessing(true);

    try {
      // Mark that user started payment flow locally
      await saveState("initial");

      // Open the initial payment link in external browser
      await WebBrowser.openBrowserAsync(INITIAL_PAYMENT_URL);

      // After the browser is opened (and user returns), ask for confirmation.
      // In production rely on server/webhook verification instead.
      setTimeout(() => {
        Alert.alert(
          "Payment Confirmation",
          "Did you complete the payment successfully?",
          [
            {
              text: "No",
              style: "cancel",
              onPress: () => {
                // stay on page; user can refresh status later
              },
            },
            {
              text: "Yes",
              onPress: async () => {
                setIsProcessing(true);
                try {
                  await saveState("confirmed");
                  // Navigate to arrival countdown to start initial timer
                  router.push({
                    pathname: "/arrival-countdown",
                    params: { spotName } as any,
                  } as any);
                } finally {
                  setIsProcessing(false);
                }
              },
            },
          ],
          { cancelable: false }
        );
      }, 700);
    } catch (error) {
      console.error("Failed to open payment link:", error);
      Alert.alert("Error", "Could not open payment link. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = async () => {
    setIsProcessing(true);
    await loadSavedState();
    setTimeout(() => {
      setIsProcessing(false);
    }, 400);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </Pressable>        
        </View>

        <Text style={styles.pageTitle}>Parking Slot Booking</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Spot</Text>
            <Text style={styles.infoValue}>{spotName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Availability</Text>
            <Text style={[styles.infoValue, availability === "Available" ? styles.available : styles.occupied]}>
              {availability}
            </Text>
          </View>

          {temp !== "" && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Temp</Text>
              <Text style={styles.infoValue}>{temp}°C</Text>
            </View>
          )}

          {humidity !== "" && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Humidity</Text>
              <Text style={styles.infoValue}>{humidity}%</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.smallMuted}>Initial Amount</Text>
              <Text style={styles.largeAmount}>₹50</Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.smallMuted}>Rate</Text>
              <View style={styles.rateRow}>
                <Text style={styles.rateText}>₹50 / hour</Text>
                <View style={styles.testTag}>
                  <Text style={styles.testTagText}>Test: 1min = 1hr</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.hint}>
            Initial payment reserves the slot for the arrival countdown. In production the server will verify payments —
            this test flow asks for manual confirmation after visiting the payment page.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handlePayNow}
            style={({ pressed }) => [
              styles.payBtn,
              pressed && { opacity: 0.9 },
              paymentState === "confirmed" && styles.payBtnConfirmed,
            ]}
            disabled={isProcessing || availability !== "Available"}
          >
            {isProcessing ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.payBtnText}>
                {paymentState === "confirmed" ? "Payment Confirmed — Start Arrival" : "Pay Initial ₹50"}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={handleRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>Refresh State</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              // cancel and go back
              router.back();
            }}
            style={styles.cancelLink}
          >
            <Text style={styles.cancelText}>Cancel and Go Back</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerMuted}>Device state & payment status are stored locally for this demo.</Text>
          <Text style={styles.footerMuted}>Saved state: {paymentState ?? "none"}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: {
    padding: 20,
    backgroundColor: COLORS.background,
    minHeight: "100%",
    alignItems: "stretch",
  },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  backText: { color: COLORS.primary, fontSize: 18 },
  headerTitle: { fontSize: 18, color: COLORS.primary, fontWeight: "600" },

  pageTitle: { marginTop: 6, fontSize: 28, color: COLORS.primary, fontWeight: "800", marginBottom: 12 },

  infoCard: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  infoLabel: { color: COLORS.neutral, fontSize: 13 },
  infoValue: { color: COLORS.primary, fontSize: 15, fontWeight: "700" },
  available: { color: COLORS.primary },
  occupied: { color: "#EF4444" },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },

  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smallMuted: { color: COLORS.neutral, fontSize: 12, marginBottom: 6 },
  largeAmount: { fontSize: 28, color: COLORS.primary, fontWeight: "900" },
  rateRow: { flexDirection: "row", alignItems: "center" },
  rateText: { color: COLORS.primary, fontWeight: "700" },
  testTag: {
    marginLeft: 8,
    backgroundColor: "#ECFDF5",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  testTagText: { color: COLORS.success, fontSize: 11, fontWeight: "700" },

  hint: { color: COLORS.neutral, marginTop: 12, fontSize: 13, lineHeight: 18 },

  actions: { marginTop: 20, alignItems: "center" },
  payBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  payBtnConfirmed: {
    backgroundColor: COLORS.success,
  },
  payBtnText: { color: COLORS.background, fontSize: 16, fontWeight: "800" },

  refreshBtn: {
    marginTop: 12,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  refreshText: { color: COLORS.primary, fontWeight: "700" },

  cancelLink: { marginTop: 18, alignItems: "center" },
  cancelText: { color: COLORS.neutral, fontWeight: "700" },

  footer: { marginTop: 18, alignItems: "center" },
  footerMuted: { color: COLORS.neutral, fontSize: 12 },
});