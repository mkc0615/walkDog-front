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
import MapView, { Polyline, UrlTile } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGuestWalk } from "../guest-walk-context";
import { formatDistance, formatDuration } from "../utils/walk-utils";

export default function GuestWalkSummaryScreen() {
  const { pendingWalk, updatePendingWalk, clearPendingWalk } = useGuestWalk();
  const [title, setTitle] = useState(pendingWalk?.title || "");
  const [notes, setNotes] = useState(pendingWalk?.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!pendingWalk) {
    // No pending walk, go back to home
    router.replace("/(public)/home");
    return null;
  }

  // Calculate route bounds for map
  const getMapRegion = () => {
    const coords = pendingWalk.routeCoordinates;
    if (coords.length === 0) {
      return {
        latitude: pendingWalk.startLatitude,
        longitude: pendingWalk.startLongitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    let minLat = coords[0].latitude;
    let maxLat = coords[0].latitude;
    let minLon = coords[0].longitude;
    let maxLon = coords[0].longitude;

    coords.forEach((coord) => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLon = Math.min(minLon, coord.longitude);
      maxLon = Math.max(maxLon, coord.longitude);
    });

    const latDelta = (maxLat - minLat) * 1.5 || 0.01;
    const lonDelta = (maxLon - minLon) * 1.5 || 0.01;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(latDelta, 0.005),
      longitudeDelta: Math.max(lonDelta, 0.005),
    };
  };

  const handleSaveWalk = async () => {
    setIsSaving(true);
    try {
      // Update the pending walk with any edited title/notes
      await updatePendingWalk({
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Navigate to login to save the walk
      router.push("/(auth)/login");
    } catch (error) {
      console.error("Error saving walk:", error);
      Alert.alert("Error", "Failed to save walk data. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Walk",
      "Are you sure you want to discard this walk? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await clearPendingWalk();
            router.replace("/(public)/home");
          },
        },
      ]
    );
  };

  const calculateSpeed = () => {
    if (pendingWalk.duration === 0) return "0.0";
    return (pendingWalk.distance / (pendingWalk.duration / 3600)).toFixed(1);
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
            <Text style={styles.headerTitle}>Walk Complete!</Text>
            <Text style={styles.headerSubtitle}>Great job! Here's your summary.</Text>
          </View>

          {/* Map Preview */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={getMapRegion()}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <UrlTile
                urlTemplate={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${process.env.EXPO_PUBLIC_MAP_TILER_KEY}`}
                maximumZ={22}
                flipY={false}
              />
              {pendingWalk.routeCoordinates.length > 1 && (
                <Polyline
                  coordinates={pendingWalk.routeCoordinates}
                  strokeColor="#660033"
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </MapView>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>
                {formatDuration(pendingWalk.duration)}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📍</Text>
              <Text style={styles.statValue}>
                {formatDistance(pendingWalk.distance)}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>{calculateSpeed()} km/h</Text>
              <Text style={styles.statLabel}>Avg Speed</Text>
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Walk Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Give your walk a name..."
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>

          {/* Notes Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
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

          {/* Save Prompt Card */}
          <View style={styles.savePromptCard}>
            <Text style={styles.savePromptIcon}>💾</Text>
            <View style={styles.savePromptContent}>
              <Text style={styles.savePromptTitle}>Want to keep this walk?</Text>
              <Text style={styles.savePromptText}>
                Log in or create an account to save your walk and track your history.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveWalk}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save Walk"}
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
    padding: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  mapContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#660033",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  input: {
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
  savePromptCard: {
    backgroundColor: "#FFF5F7",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#660033",
  },
  savePromptIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  savePromptContent: {
    flex: 1,
  },
  savePromptTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#660033",
    marginBottom: 4,
  },
  savePromptText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  bottomActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: "#EDE8D0",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  discardButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#660033",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
