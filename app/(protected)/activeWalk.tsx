import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
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
import { useAuth } from "../auth-context";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface CoordinateWithTimestamp extends Coordinate {
  timestamp: number;
  accuracy?: number;
}

export default function ActiveWalkScreen() {
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0); // in seconds
  const [distance, setDistance] = useState(0); // in km
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [coordinateBatch, setCoordinateBatch] = useState<CoordinateWithTimestamp[]>([]);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    walkId: string;
    dogIds: string;
  }>();

  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const batchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parse dog IDs from route params
  const walkingDogs = params.dogIds ? JSON.parse(params.dogIds) : [];

  // Debug: Log the dog IDs
  console.log('Route params.dogIds:', params.dogIds);
  console.log('Parsed walkingDogs:', walkingDogs);

  // Send coordinate batch to backend
  const sendCoordinateBatch = async () => {
    if (coordinateBatch.length === 0) {
      console.log('No coordinates to send');
      return;
    }

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_SERVICE_URL || 'http://localhost:9010';
      const response = await fetch(`${apiUrl}/api/v1/walks/${params.walkId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          coordinates: coordinateBatch
        })
      });

      if (response.ok) {
        console.log(`Sent ${coordinateBatch.length} coordinates to backend`);
        // Clear the batch after successful send
        setCoordinateBatch([]);
      } else {
        console.error('Failed to send coordinates:', response.status);
        // Keep coordinates in batch to retry later
      }
    } catch (error) {
      console.error('Error sending coordinates:', error);
      // Keep coordinates in batch to retry later
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.latitude * Math.PI) / 180) *
        Math.cos((coord2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check location permissions and start tracking
  useEffect(() => {
    let isMounted = true;

    (async () => {
      // Check if permission is already granted
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access in your device settings to track your walks.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Location.requestForegroundPermissionsAsync() }
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

        // Start watching location
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5, // Update every 5 meters
            timeInterval: 1000, // Update every second
          },
          (newLocation) => {
            const newCoord = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            };

            setCurrentLocation(newCoord);

            if (!isPaused) {
              // Add to route coordinates for map display
              setRouteCoordinates((prev) => {
                const lastCoord = prev[prev.length - 1];
                if (lastCoord) {
                  const additionalDistance = calculateDistance(lastCoord, newCoord);
                  setDistance((prevDistance) => prevDistance + additionalDistance);
                }
                return [...prev, newCoord];
              });

              // Add to batch with timestamp and accuracy for backend
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

    // Set up 5-minute interval to send coordinate batches
    batchIntervalRef.current = setInterval(() => {
      sendCoordinateBatch();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (batchIntervalRef.current) {
        clearInterval(batchIntervalRef.current);
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

  const handlePauseResume = async () => {
    if (!isPaused) {
      // About to pause - send any unsent coordinates
      await sendCoordinateBatch();
    }
    setIsPaused(!isPaused);
  };

  const handleEndWalk = async () => {
    Alert.alert(
      "End Walk",
      "Are you sure you want to end this walk?",
      [
        {
          text: "Cancel",
          style: "cancel"
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

              // Stop the batch interval
              if (batchIntervalRef.current) {
                clearInterval(batchIntervalRef.current);
                batchIntervalRef.current = null;
              }

              // Send any remaining coordinates before ending
              await sendCoordinateBatch();

              // Prepare walk result data
              const walkResultData = {
                dogIds: walkingDogs,
                duration: duration,
                distance: parseFloat(distance.toFixed(2))
              };

              // Debug: Log what we're sending
              console.log('Sending to backend:', walkResultData);

              // Send to backend
              const apiUrl = process.env.EXPO_PUBLIC_API_SERVICE_URL || 'http://localhost:9010';
              const response = await fetch(`${apiUrl}/api/v1/walks/${params.walkId}/stop`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(walkResultData)
              });

              if (response.ok) {
                // Success - show success message
                Alert.alert(
                  "Success",
                  "Your walk is saved",
                  [
                    {
                      text: "OK",
                      onPress: () => router.replace("/(protected)/(tabs)/walks")
                    }
                  ]
                );
              } else {
                // Failed - show error message
                Alert.alert(
                  "Error",
                  "Walk save failed!",
                  [
                    {
                      text: "OK",
                      onPress: () => router.replace("/(protected)/(tabs)/walks")
                    }
                  ]
                );
              }
            } catch (error) {
              console.error('Error ending walk:', error);
              Alert.alert(
                "Failed to End Walk",
                error instanceof Error ? error.message : "An error occurred while ending the walk. Please try again."
              );
            }
          }
        }
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
            showsUserLocation={true}
            followsUserLocation={true}
            showsMyLocationButton={false}
          >
            {/* MapTiler Tiles */}
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
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={styles.mapText}>Loading Map...</Text>
            <Text style={styles.mapSubtext}>
              Requesting location permissions
            </Text>
          </View>
        )}

        {/* Overlay Stats */}
        <View style={styles.topOverlay}>
          <View style={styles.dogsCard}>
            <Text style={styles.dogsIcon}>🐕</Text>
            <Text style={styles.dogsText}>
              Walking with {walkingDogs.join(", ")}
            </Text>
          </View>
        </View>

        {/* Map Attribution */}
        <View style={styles.attributionOverlay}>
          <Text style={styles.attributionText}>
            © MapTiler © OpenStreetMap contributors
          </Text>
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
  map: {
    flex: 1,
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
