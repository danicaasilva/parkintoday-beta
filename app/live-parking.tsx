import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Live Parking Timer
 *
 * - Starts when page mounts (simulates ANPR entry).
 * - Billing buckets:
 *    0–0:59  -> ₹50
 *    1–1:59  -> ₹100
 *    2–2:59  -> ₹150
 * - Displays elapsed time and current amount prominently.
 * - "Simulate Exit (ANPR)" navigates to final-payment page with details.
 */

const COLORS = {
  primary: "#0D1B2A",
  background: "#FFFFFF",
  neutral: "#C4C4C4",
  indexGreen: "#10B981",
  indexMuted: "#6B7280",
};

function formatTime(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function LiveParking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // locationName is optional param passed from arrival countdown
  const locationName = (params?.locationName as string) ?? "Market Square";

  const [elapsed, setElapsed] = useState(0); // seconds since parking started
  const intervalRef = useRef<number | null>(null);

  // Start timer on mount
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000) as unknown as number;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Compute amount: bucket index = floor(elapsed / 60), amount = (bucket + 1) * 50
  const minuteBucket = Math.floor(elapsed / 60);
  const amount = (minuteBucket + 1) * 50;

  const handleSimulateExit = () => {
    const initialPaid = 50;
    const finalAmount = amount;
    const due = Math.max(0, finalAmount - initialPaid);

    // Navigate to final payment/receipt page with params
    router.push({
      pathname: "/final-payment",
      params: {
        locationName,
        elapsed: elapsed.toString(),
        totalAmount: finalAmount.toString(),
        initialPaid: initialPaid.toString(),
      } as any,
    } as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.statusBadge}><Text style={{color: COLORS.indexGreen}}>●</Text> LIVE SESSION</Text>

        <Text style={styles.locationTitle}>{locationName}</Text>
        <Text style={styles.subtitle}>Parking in progress</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>DURATION</Text>
          <Text style={styles.durationText}>{formatTime(elapsed)}</Text>

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>ESTIMATED COST</Text>
          <Text style={styles.costText}>₹{amount}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Your time is being tracked. Payment will be deducted automatically upon exit or you can pay manually.</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={handleSimulateExit} style={({pressed}) => [styles.exitBtn, pressed && { opacity: 0.9 }]}>
            <Text style={styles.exitBtnText}>Simulate Vehicle Exit</Text>
          </Pressable>

          <Pressable onPress={() => {
            Alert.alert("End Session", "End parking session and return to Home?", [
              { text: "No", style: "cancel" },
              { text: "Yes", onPress: () => router.replace("/") }
            ]);
          }} style={({pressed}) => [styles.endBtn, pressed && { opacity: 0.9 }]}>
            <Text style={styles.endBtnText}>End Session</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 24, alignItems: 'center' },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    color: COLORS.indexMuted,
    fontWeight: '700',
    alignSelf: 'flex-start'
  },
  locationTitle: { marginTop: 12, fontSize: 22, color: COLORS.primary, fontWeight: '800' },
  subtitle: { color: COLORS.indexMuted, marginBottom: 18 },

  card: {
    width: '100%',
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLabel: { color: COLORS.indexMuted, fontSize: 12, marginBottom: 8 },
  durationText: { fontSize: 48, color: COLORS.primary, fontWeight: '800', marginBottom: 12 },
  divider: { height: 1, alignSelf: 'stretch', backgroundColor: '#F3F3F3', marginVertical: 12 },
  costText: { fontSize: 26, color: COLORS.primary, fontWeight: '800' },

  infoBox: {
    width: '100%',
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2FF'
  },
  infoText: { color: COLORS.indexMuted, textAlign: 'center' },

  actions: { width: '100%', marginTop: 22 },
  exitBtn: { backgroundColor: COLORS.indexGreen, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  exitBtnText: { color: COLORS.background, fontWeight: '800', fontSize: 16 },
  endBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EFEFEF' },
  endBtnText: { color: COLORS.indexMuted, fontWeight: '700' },
});