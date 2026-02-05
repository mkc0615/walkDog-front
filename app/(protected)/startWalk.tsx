import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useAuth } from "@/lib/auth-context";

interface Dog {
  dogId: number;
  name: string;
}

export default function StartWalkScreen() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDogs, setSelectedDogs] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    const fetchDogs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiUrl = process.env.EXPO_PUBLIC_API_SERVICE_URL || 'http://localhost:9010';
        const response = await fetch(`${apiUrl}/api/v1/dogs`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched dogs from backend:', data);
        console.log('First dog:', data[0]);
        setDogs(data);
      } catch (err) {
        console.error('Error fetching dogs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dogs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDogs();
  }, [token]);

  const toggleDogSelection = (dogId: number) => {
    console.log('Toggling dog with ID:', dogId, 'Type:', typeof dogId);
    setSelectedDogs((prev) =>
      prev.includes(dogId)
        ? prev.filter((id) => id !== dogId)
        : [...prev, dogId]
    );
  };

  const handleStartWalk = async () => {
    if (selectedDogs.length === 0) {
      Alert.alert("No Dogs Selected", "Please select at least one dog to start the walk.");
      return;
    }

    setIsStarting(true);

    try {
      // Get current location
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access to start tracking your walk."
        );
        setIsStarting(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Prepare walk data
      const walkData = {
        title: title.trim() || '',
        dogIds: selectedDogs,
        description: notes.trim() || '',
        startLatitude: location.coords.latitude,
        startLongitude: location.coords.longitude
      };

      // Send to backend
      const apiUrl = process.env.EXPO_PUBLIC_API_SERVICE_URL || 'http://localhost:9010';
      const response = await fetch(`${apiUrl}/api/v1/walks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(walkData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Verify the walk was started successfully
      if (result.status === 'STARTED' && result.walkId) {

        // Debug: Log the selected dogs before navigation
        console.log('Selected dogs before navigation:', selectedDogs);
        console.log('Stringified dogIds:', JSON.stringify(selectedDogs));

        // Navigate to active walk tracking screen with walk ID and selected dogs
        router.push({
          pathname: "/(protected)/activeWalk",
          params: {
            walkId: result.walkId,
            dogIds: JSON.stringify(selectedDogs),
          },
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error('Error starting walk:', err);
      Alert.alert(
        "Failed to Start Walk",
        err instanceof Error ? err.message : "An error occurred while starting the walk. Please try again."
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

          {/* Select Dogs Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Select Dogs <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.sectionSubtitle}>
              Choose which dog(s) to walk
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#660033" />
                <Text style={styles.loadingText}>Loading your dogs...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => window.location.reload()}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : dogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🐕</Text>
                <Text style={styles.emptyText}>No dogs added yet</Text>
                <Text style={styles.emptySubtext}>
                  Add a dog to your profile to start tracking walks
                </Text>
                <TouchableOpacity
                  style={styles.addDogButton}
                  onPress={() => router.push("/(protected)/addDog")}
                >
                  <Text style={styles.addDogButtonText}>Add Dog</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.dogsContainer}>
                {dogs.map((dog) => (
                  <TouchableOpacity
                    key={dog.dogId}
                    style={[
                      styles.dogOption,
                      selectedDogs.includes(dog.dogId) && styles.dogOptionSelected,
                    ]}
                    onPress={() => toggleDogSelection(dog.dogId)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selectedDogs.includes(dog.dogId) && styles.checkboxSelected,
                      ]}
                    >
                      {selectedDogs.includes(dog.dogId) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <View style={styles.dogOptionAvatar}>
                      <Text style={styles.dogOptionEmoji}>🐕</Text>
                    </View>
                    <Text style={styles.dogOptionText}>{dog.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
            style={[
              styles.startButton,
              (selectedDogs.length === 0 || isStarting) &&
                styles.startButtonDisabled,
            ]}
            onPress={handleStartWalk}
            disabled={selectedDogs.length === 0 || isStarting}
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  required: {
    color: "#660033",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  dogsContainer: {
    gap: 12,
  },
  dogOption: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dogOptionSelected: {
    borderColor: "#660033",
    backgroundColor: "#FFF5F7",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#660033",
    borderColor: "#660033",
  },
  checkmark: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  dogOptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dogOptionEmoji: {
    fontSize: 20,
  },
  dogOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
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
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#660033",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  addDogButton: {
    backgroundColor: "#660033",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addDogButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
