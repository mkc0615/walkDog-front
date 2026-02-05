import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGuestWalk } from "@/lib/guest-walk-context";

export default function GuestStartWalkScreen() {
  const [userName, setUserName] = useState("");
  const [dogName, setDogName] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const { startWalk, guestUserInfo } = useGuestWalk();

  // Pre-fill with saved guest info if available
  React.useEffect(() => {
    if (guestUserInfo) {
      if (guestUserInfo.name) setUserName(guestUserInfo.name);
      if (guestUserInfo.dogName) setDogName(guestUserInfo.dogName);
    }
  }, [guestUserInfo]);

  const handleStartWalk = async () => {
    setIsStarting(true);

    try {
      // Get current location (permission already granted from home screen)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const startCoord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Start walk in context with guest user info
      const guestInfo = {
        name: userName.trim() || undefined,
        dogName: dogName.trim() || undefined,
      };
      startWalk(startCoord, title.trim() || undefined, notes.trim() || undefined, guestInfo);

      // Navigate to active walk screen
      router.push("/(public)/guestActiveWalk");
    } catch (err) {
      console.error("Error starting walk:", err);
      Alert.alert(
        "Failed to Start Walk",
        err instanceof Error
          ? err.message
          : "An error occurred while starting the walk. Please try again."
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Start a Walk</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Guest Info Card */}
          <View style={styles.guestInfoCard}>
            <Text style={styles.guestInfoIcon}>🚶</Text>
            <View style={styles.guestInfoContent}>
              <Text style={styles.guestInfoTitle}>Walking as Guest</Text>
              <Text style={styles.guestInfoText}>
                Your walk will be saved locally. Log in after to keep it forever.
              </Text>
            </View>
          </View>

          {/* Your Name Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Name (Optional)</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Enter your name..."
              placeholderTextColor="#999"
              value={userName}
              onChangeText={setUserName}
              maxLength={50}
              autoCapitalize="words"
            />
          </View>

          {/* Dog Name Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dog's Name (Optional)</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Enter your dog's name..."
              placeholderTextColor="#999"
              value={dogName}
              onChangeText={setDogName}
              maxLength={50}
              autoCapitalize="words"
            />
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Starting Location</Text>
            <View style={styles.locationCard}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>Current Location</Text>
                <Text style={styles.locationSubtext}>
                  GPS tracking will start automatically
                </Text>
              </View>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Walk Title (Optional)</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="e.g., Morning Walk, Park Adventure..."
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about this walk..."
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Once you start, we'll track your route, distance, and duration
              automatically using GPS.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isStarting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.startButton, isStarting && styles.startButtonDisabled]}
            onPress={handleStartWalk}
            disabled={isStarting}
          >
            <Text style={styles.startButtonText}>
              {isStarting ? "Starting..." : "Start Walk"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDE8D0",
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backIcon: {
    fontSize: 24,
    color: "#1A1A1A",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  placeholder: {
    width: 40,
  },
  guestInfoCard: {
    backgroundColor: "#FFF5F7",
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#660033",
  },
  guestInfoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  guestInfoContent: {
    flex: 1,
  },
  guestInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#660033",
    marginBottom: 4,
  },
  guestInfoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  locationSubtext: {
    fontSize: 14,
    color: "#666",
  },
  titleInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  notesInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    minHeight: 100,
  },
  infoCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1976D2",
    lineHeight: 20,
  },
  bottomActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: "#EDE8D0",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  startButton: {
    flex: 1,
    backgroundColor: "#660033",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
