import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Polyline, UrlTile } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGuestWalk } from "@/lib/guest-walk-context";
import {
  calculateDistance,
  Coordinate,
  CoordinateWithTimestamp,
  formatDuration,
} from "@/lib/utils/walk-utils";

export default function GuestActiveWalkScreen() {
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [coordinateBatch, setCoordinateBatch] = useState<CoordinateWithTimestamp[]>([]);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const { activeWalk, endWalk } = useGuestWalk();
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Check location permissions and start tracking
  useEffect(() => {
    if (!activeWalk) {
      // No active walk, go back
      router.replace("/(public)/home");
      return;
    }

    let isMounted = true;

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access in your device settings to track your walks.",
          [
            { text: "Cancel", style: "cancel", onPress: () => router.back() },
            {
              text: "Open Settings",
              onPress: () => Location.requestForegroundPermissionsAsync(),
            },
          ]
        );
        return;
      }

      if (isMounted) {
        setHasLocationPermission(true);

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const initialCoord = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCurrentLocation(initialCoord);
        setRouteCoordinates([initialCoord]);

        // Add initial coordinate to batch
        const initialCoordWithTimestamp: CoordinateWithTimestamp = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy || undefined,
        };
        setCoordinateBatch([initialCoordWithTimestamp]);

        // Start watching location
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 1000,
          },
          (newLocation) => {
            const newCoord = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            };

            setCurrentLocation(newCoord);

            if (!isPaused) {
              setRouteCoordinates((prev) => {
                const lastCoord = prev[prev.length - 1];
                if (lastCoord) {
                  const additionalDistance = calculateDistance(lastCoord, newCoord);
                  setDistance((prevDistance) => prevDistance + additionalDistance);
                }
                return [...prev, newCoord];
              });

              const coordWithTimestamp: CoordinateWithTimestamp = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                timestamp: newLocation.timestamp,
                accuracy: newLocation.coords.accuracy || undefined,
              };
              setCoordinateBatch((prev) => [...prev, coordWithTimestamp]);
            }
          }
        );
      }
    })();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Timer for duration
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPaused]);

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleEndWalk = () => {
    Alert.alert(
      "End Walk",
      "Are you sure you want to end this walk?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "End Walk",
          style: "destructive",
          onPress: async () => {
            try {
              // Stop location tracking
              if (locationSubscription.current) {
                locationSubscription.current.remove();
                locationSubscription.current = null;
              }

              // Save walk to context
              await endWalk(duration, parseFloat(distance.toFixed(2)), coordinateBatch);

              // Navigate to summary
              router.replace("/(public)/guestWalkSummary");
            } catch (error) {
              console.error("Error ending walk:", error);
              Alert.alert(
                "Failed to End Walk",
                error instanceof Error
                  ? error.message
                  : "An error occurred while ending the walk. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        {hasLocationPermission && currentLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            mapType="none"
            showsUserLocation={true}
            followsUserLocation={true}
            showsMyLocationButton={false}
          >
            {/* MapTiler OpenStreetMap Tiles */}
            <UrlTile
              urlTemplate={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${process.env.EXPO_PUBLIC_MAP_TILER_KEY}`}
              maximumZ={22}
              flipY={false}
            />
            {/* Route Polyline */}
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#660033"
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={styles.mapText}>Loading...</Text>
            <Text style={styles.mapSubtext}>Getting your location</Text>
          </View>
        )}

        {/* Overlay - Guest Mode Indicator */}
        <View style={styles.topOverlay}>
          <View style={styles.guestCard}>
            <Text style={styles.guestIcon}>
              {activeWalk?.guestUserInfo?.dogName ? "🐕" : "🚶"}
            </Text>
            <Text style={styles.guestText}>
              {activeWalk?.guestUserInfo?.dogName
                ? `Walking with ${activeWalk.guestUserInfo.dogName}`
                : "Guest Walk"}
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
            {duration > 0 ? (distance / (duration / 3600)).toFixed(1) : "0.0"}
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
          <Text style={styles.pauseButtonIcon}>{isPaused ? "▶️" : "⏸️"}</Text>
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
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  locationDisplay: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  locationIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#166534",
    marginBottom: 8,
  },
  coordsText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
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
  topOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
  },
  guestCard: {
    backgroundColor: "#FFF5F7",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#660033",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  guestIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  guestText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#660033",
  },
  attributionOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attributionText: {
    fontSize: 10,
    color: "#333",
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
