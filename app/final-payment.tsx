import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

/**
 * Final Payment / Receipt Page
 *
 * Shows session summary, duration, amounts, and a final CTA.
 * If balance payable is zero -> show a green "Fully Paid" card.
 * Otherwise show the balance and a "Pay Balance" button.
 *
 * Expects params:
 * - locationName (string)
 * - elapsed (seconds as string)
 * - totalAmount (string)
 * - initialPaid (string)
 */

const COLORS = {
  primary: "#0D1B2A",
  background: "#FFFFFF",
  neutral: "#C4C4C4",
  indexGreen: "#10B981",
  indexMuted: "#6B7280",
};

function formatDurationSeconds(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  // display "0h 1m" style like the inspiration
  return `${h}h ${m}m`;
}

export default function FinalPayment() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const locationName = (params?.locationName as string) ?? "Parking Location";
  const elapsed = parseInt((params?.elapsed as string) ?? "0", 10);
  const totalAmount = parseInt((params?.totalAmount as string) ?? "0", 10);
  const initialPaid = parseInt((params?.initialPaid as string) ?? "50", 10);

  const balance = Math.max(0, totalAmount - initialPaid);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Session Summary</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.location}>{locationName}</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Duration</Text>
            <Text style={styles.rowValue}>{formatDurationSeconds(elapsed)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Amount</Text>
            <Text style={styles.rowValue}>₹{totalAmount}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Initial Payment</Text>
            <Text style={[styles.rowValue, { color: COLORS.indexGreen }]}>- ₹{initialPaid}</Text>
          </View>

          <View style={styles.divider} />

          <View style={{ marginTop: 8 }}>
            <Text style={styles.balanceLabel}>Balance Payable</Text>
            <Text style={styles.balanceValue}>₹{balance}</Text>
          </View>
        </View>

        {balance <= 0 ? (
          <View style={styles.paidCard}>
            <Text style={styles.paidIcon}>✓</Text>
            <Text style={styles.paidTitle}>Fully Paid</Text>
            <Text style={styles.paidSubtitle}>No additional payment required.</Text>
          </View>
        ) : (
          <View style={styles.paidCardPending}>
            <Text style={styles.paidTitlePending}>Payment Pending</Text>
            <Text style={styles.paidSubtitlePending}>Please complete the remaining payment to finish the session.</Text>
          </View>
        )}

        <View style={styles.actions}>
          {balance > 0 ? (
            <Pressable
              onPress={() => {
                // For testing we simulate payment success and return home
                // In real app you would start payment flow for balance
                AlertAndReturn(router);
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.primaryBtnText}>Pay Balance ₹{balance}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.replace("/")}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.primaryBtnText}>Complete & Exit</Text>
            </Pressable>
          )}

          <Pressable onPress={() => router.replace("/")} style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function AlertAndReturn(router: any) {
  // simple simulation
  // eslint-disable-next-line no-alert
  // use native alert to show success and return
  // but avoid importing Alert at top to keep code small
  (global as any).alert = (msg: string) => {
    // fallback
    console.log(msg);
  };
  // use router to go back
  router.replace("/");
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 20, alignItems: 'center' },
  header: { fontSize: 18, color: COLORS.primary, fontWeight: '800', marginTop: 8, marginBottom: 16 },

  summaryCard: {
    width: '100%',
    borderRadius: 14,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2F4F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  location: { fontSize: 20, color: COLORS.primary, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { color: COLORS.indexMuted },
  rowValue: { color: COLORS.primary, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F3F3', marginVertical: 6 },

  balanceLabel: { color: COLORS.indexMuted, fontSize: 13 },
  balanceValue: { color: COLORS.primary, fontWeight: '900', fontSize: 22, marginTop: 6 },

  paidCard: {
    marginTop: 18,
    width: '100%',
    backgroundColor: '#ECFDF5',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  paidIcon: { fontSize: 28, color: COLORS.indexGreen, marginBottom: 8 },
  paidTitle: { fontSize: 18, color: COLORS.indexGreen, fontWeight: '800' },
  paidSubtitle: { marginTop: 6, color: COLORS.indexMuted, textAlign: 'center' },

  paidCardPending: {
    marginTop: 18,
    width: '100%',
    backgroundColor: '#FFF7ED',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEEDD5',
  },
  paidTitlePending: { fontSize: 16, color: '#D97706', fontWeight: '800' },
  paidSubtitlePending: { marginTop: 6, color: COLORS.indexMuted, textAlign: 'center' },

  actions: { marginTop: 22, width: '100%', alignItems: 'center' },
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: COLORS.background, fontWeight: '800' },
  linkBtn: { marginTop: 12, paddingVertical: 12 },
  linkBtnText: { color: COLORS.indexMuted, fontWeight: '700' },
});