import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth-context";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  // TODO: Replace with data from your backend
  const [dogs] = useState([
    {
      id: "1",
      name: "Buddy",
      breed: "Golden Retriever",
      age: 3,
      weight: 30,
      gender: "Male",
    },
    {
      id: "2",
      name: "Luna",
      breed: "Labrador",
      age: 2,
      weight: 25,
      gender: "Female",
    },
  ]);

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
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user?.name || "Not set"}</Text>
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

          {dogs.map((dog, index) => (
            <View key={dog.id} style={[styles.dogCard, index > 0 && styles.dogCardSpacing]}>
              <View style={styles.dogAvatar}>
                <Text style={styles.dogAvatarEmoji}>🐕</Text>
              </View>

              <View style={styles.dogInfoContainer}>
                <View style={styles.dogHeader}>
                  <Text style={styles.dogName}>{dog.name}</Text>
                  <TouchableOpacity onPress={() => handleEditDog(dog.id)}>
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
          ))}
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
});
