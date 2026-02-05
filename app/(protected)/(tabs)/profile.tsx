import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";

interface Dog {
  dogId: number;
  name: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
}

export default function ProfileScreen() {
  const { user, logout, token } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setDogs(data);
    } catch (err) {
      console.error('Error fetching dogs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dogs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDogs();
  }, [token]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const handleEditProfile = () => {
    router.push("/(protected)/editProfile");
  };

  const handleEditDog = (dogId: string) => {
    // TODO: Navigate to edit dog screen with dogId
    console.log("Edit dog:", dogId);
  };

  const handleAddDog = () => {
    router.push("/(protected)/addDog");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Information</Text>
            <TouchableOpacity onPress={handleEditProfile}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user?.username || "Not set"}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || "Not set"}</Text>
            </View>
          </View>
        </View>

        {/* Dogs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Dogs</Text>
            <TouchableOpacity onPress={handleAddDog}>
              <Text style={styles.editButton}>Add Dog</Text>
            </TouchableOpacity>
          </View>

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
                onPress={fetchDogs}
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
            </View>
          ) : (
            dogs.map((dog, index) => (
              <View key={dog.dogId} style={[styles.dogCard, index > 0 && styles.dogCardSpacing]}>
                <View style={styles.dogAvatar}>
                  <Text style={styles.dogAvatarEmoji}>🐕</Text>
                </View>

                <View style={styles.dogInfoContainer}>
                  <View style={styles.dogHeader}>
                    <Text style={styles.dogName}>{dog.name}</Text>
                    <TouchableOpacity onPress={() => handleEditDog(dog.dogId.toString())}>
                      <Text style={styles.dogEditButton}>Edit</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dogDetails}>
                    <View style={styles.dogDetailItem}>
                      <Text style={styles.dogDetailLabel}>Breed:</Text>
                      <Text style={styles.dogDetailValue}>{dog.breed}</Text>
                    </View>
                    <View style={styles.dogDetailItem}>
                      <Text style={styles.dogDetailLabel}>Age:</Text>
                      <Text style={styles.dogDetailValue}>{dog.age} years</Text>
                    </View>
                    <View style={styles.dogDetailItem}>
                      <Text style={styles.dogDetailLabel}>Weight:</Text>
                      <Text style={styles.dogDetailValue}>{dog.weight} kg</Text>
                    </View>
                    <View style={styles.dogDetailItem}>
                      <Text style={styles.dogDetailLabel}>Gender:</Text>
                      <Text style={styles.dogDetailValue}>{dog.gender}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          {/* <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>🔔</Text>
            <Text style={styles.actionButtonText}>Notifications</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity> */}

          {/* <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>⚙️</Text>
            <Text style={styles.actionButtonText}>Settings</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>❓</Text>
            <Text style={styles.actionButtonText}>Help & Support</Text>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  editButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#660033",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#660033",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
  },
  dogCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dogCardSpacing: {
    marginTop: 12,
  },
  dogAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  dogAvatarEmoji: {
    fontSize: 30,
  },
  dogInfoContainer: {
    flex: 1,
  },
  dogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dogName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  dogEditButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#660033",
  },
  dogDetails: {
    gap: 4,
  },
  dogDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dogDetailLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 6,
  },
  dogDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  actionButton: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  actionButtonArrow: {
    fontSize: 24,
    color: "#CCC",
    fontWeight: "300",
  },
  logoutButton: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#660033",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#660033",
  },
  bottomSpacer: {
    height: 32,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
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
    borderRadius: 16,
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
    borderRadius: 16,
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
  },
});
