import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function ActiveWalkScreen() {
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0); // in seconds
  const [distance, setDistance] = useState(0); // in km

  // TODO: Get walk data from route params or context
  const walkingDogs = ["Buddy", "Luna"];

  // Timer for duration
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
        // TODO: Update distance based on GPS coordinates
        setDistance((prev) => prev + 0.001); // Simulated distance increase
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPaused]);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleEndWalk = () => {
    // TODO: Show confirmation dialog
    // TODO: Save walk data to backend
    console.log("Ending walk");
    console.log("Duration:", duration, "seconds");
    console.log("Distance:", distance.toFixed(2), "km");

    // Navigate to My Walk tab
    router.replace("/(protected)/(tabs)/walks");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>
            GPS tracking active
          </Text>
          <View style={styles.coordinatesBox}>
            <Text style={styles.coordinatesText}>
              📍 Lat: 37.7749, Long: -122.4194
            </Text>
          </View>
        </View>

        {/* Overlay Stats */}
        <View style={styles.topOverlay}>
          <View style={styles.dogsCard}>
            <Text style={styles.dogsIcon}>🐕</Text>
            <Text style={styles.dogsText}>
              Walking with {walkingDogs.join(", ")}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📍</Text>
          <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Kilometers</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statValue}>
            {duration > 0 ? ((distance / (duration / 3600)).toFixed(1)) : "0.0"}
          </Text>
          <Text style={styles.statLabel}>km/h</Text>
        </View>
      </View>

      {/* Status Indicator */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, isPaused && styles.statusDotPaused]} />
        <Text style={styles.statusText}>
          {isPaused ? "Paused" : "Recording..."}
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.pauseButton, isPaused && styles.resumeButton]}
          onPress={handlePauseResume}
        >
          <Text style={styles.pauseButtonIcon}>
            {isPaused ? "▶️" : "⏸️"}
          </Text>
          <Text style={styles.pauseButtonText}>
            {isPaused ? "Resume" : "Pause"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endButton} onPress={handleEndWalk}>
          <Text style={styles.endButtonIcon}>⏹️</Text>
          <Text style={styles.endButtonText}>End Walk</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDE8D0",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  mapIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  mapText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 16,
    color: "#999",
    marginBottom: 16,
  },
  coordinatesBox: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coordinatesText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  topOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
  },
  dogsCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dogsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  dogsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
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
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#660033",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    marginRight: 8,
  },
  statusDotPaused: {
    backgroundColor: "#F59E0B",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  controls: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: "#F59E0B",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resumeButton: {
    backgroundColor: "#22C55E",
    shadowColor: "#22C55E",
  },
  pauseButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  endButton: {
    flex: 1,
    backgroundColor: "#660033",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#660033",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  endButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
