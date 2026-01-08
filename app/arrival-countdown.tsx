import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

// Color system (strict) + subtle index tinge
const COLORS = {
  primary: "#0D1B2A",
  background: "#FFFFFF",
  neutral: "#C4C4C4",
  indexGreen: "#10B981",
  indexMuted: "#6B7280",
};

export default function ArrivalCountdown() {
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(60); // 1 minute in seconds (test replacement for 1 hour)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const hasTimedOutRef = useRef(false);

  // Countdown timer (single interval)
  useEffect(() => {
    if (timeLeft <= 0) return;

    const id = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [timeLeft]);

  // Handle timeout
  useEffect(() => {
    if (timeLeft > 0) return;
    if (hasTimedOutRef.current) return;
    hasTimedOutRef.current = true;

    if (!isSimulated) {
      Alert.alert(
        "Time Expired",
        "You did not reach in time. Your booking has been cancelled and the initial payment will be refunded.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace('/');
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [timeLeft, isSimulated, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancelClick = () => setShowCancelModal(true);

  const confirmCancel = () => {
    setShowCancelModal(false);
    Alert.alert("Booking Cancelled", "Your booking has been cancelled and the initial payment will be refunded.", [
      { text: "OK", onPress: () => router.replace('/') }
    ]);
  };

  const dismissModal = () => setShowCancelModal(false);

  const handleSimulateANPR = () => {
    setIsSimulated(true);

    Alert.alert(
      "Vehicle Detected",
      "ANPR detected your vehicle. Live parking timer will start.",
      [
        {
          text: "Start Session",
          onPress: () => {
            // pass a placeholder locationName; real app should pass booking/location info
            router.push({
              pathname: '/live-parking',
              params: { locationName: 'Market Square' } as any
            } as any);
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.inner}>
        <Text style={styles.title}>Reach Location</Text>

        <View style={styles.timerCard}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.timerLabel}>REMAINING</Text>
        </View>

        <Text style={styles.subText}>
          Reach the parking location within the time limit. If you fail to arrive the reservation will be cancelled.
        </Text>

        <View style={styles.actions}>
          <Pressable
            onPress={handleSimulateANPR}
            style={({ pressed }) => [styles.simulateBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.simulateBtnText}>Simulate ANPR (Vehicle Arrived)</Text>
          </Pressable>

          <Pressable
            onPress={handleCancelClick}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </Pressable>
        </View>
      </View>

      {/* Confirmation Modal */}
      {showCancelModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel booking?</Text>
            <Text style={styles.modalBody}>You will be returned to Home and the initial payment will be refunded.</Text>

            <View style={styles.modalActions}>
              <Pressable onPress={confirmCancel} style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.9 }]}>
                <Text style={styles.confirmBtnText}>Yes, Cancel Booking</Text>
              </Pressable>

              <Pressable onPress={dismissModal} style={styles.dismissBtn}>
                <Text style={styles.dismissBtnText}>No, Continue</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, padding: 24, alignItems: 'center' },
  title: { marginTop: 6, fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  timerCard: {
    marginTop: 28,
    width: '86%',
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: COLORS.background,
    // subtle elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  timerText: { fontSize: 64, color: COLORS.primary, fontWeight: '800' },
  timerLabel: { marginTop: 8, color: COLORS.indexMuted, fontSize: 12, letterSpacing: 1 },
  subText: { marginTop: 18, color: COLORS.indexMuted, textAlign: 'center', paddingHorizontal: 12 },
  actions: { marginTop: 28, width: '86%', gap: 12 },
  simulateBtn: {
    backgroundColor: COLORS.indexGreen,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  simulateBtnText: { color: COLORS.background, fontWeight: '700', fontSize: 16 },
  cancelBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neutral,
    backgroundColor: COLORS.background,
  },
  cancelBtnText: { color: COLORS.neutral, fontWeight: '700', fontSize: 16 },

  modalOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 20
  },
  modalContent: {
    width: '92%', backgroundColor: COLORS.background, borderRadius: 14, padding: 20, alignItems: 'center'
  },
  modalTitle: { fontSize: 18, color: COLORS.primary, fontWeight: '800', marginBottom: 6 },
  modalBody: { color: COLORS.indexMuted, textAlign: 'center', marginBottom: 18 },
  modalActions: { width: '100%', gap: 10 },
  confirmBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center', width: '100%' },
  confirmBtnText: { color: COLORS.background, fontWeight: '700' },
  dismissBtn: { paddingVertical: 12, alignItems: 'center', width: '100%' },
  dismissBtnText: { color: COLORS.neutral, fontWeight: '700' },
});