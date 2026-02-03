import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PublicHomeScreen() {
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleStartWalk = async () => {
    if (isRequestingPermission) return;

    setIsRequestingPermission(true);

    try {
      // Check current permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();

      if (currentStatus === "granted") {
        // Already have permission, proceed
        router.push("/(public)/guestStartWalk");
        return;
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        // Permission granted, proceed
        router.push("/(public)/guestStartWalk");
      } else {
        // Permission denied
        Alert.alert(
          "Location Permission Required",
          "WalkDog needs access to your location to track your walks. Please enable location access in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Location.requestForegroundPermissionsAsync(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
      Alert.alert(
        "Error",
        "Something went wrong while requesting location permission. Please try again."
      );
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const handleSignUp = () => {
    router.push("/(auth)/register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pawIcon}>🐾</Text>
          <Text style={styles.title}>WalkDog</Text>
          <Text style={styles.subtitle}>
            Track every adventure with your pup
          </Text>
        </View>

        {/* Main Action */}
        <View style={styles.mainAction}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartWalk}
          >
            <Text style={styles.startButtonIcon}>🚶‍♂️</Text>
            <View style={styles.startButtonTextContainer}>
              <Text style={styles.startButtonTitle}>Start Walking</Text>
              <Text style={styles.startButtonSubtitle}>No account needed</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Prompt */}
        <View style={styles.statsPromptCard}>
          <Text style={styles.statsPromptTitle}>Check your Walk Stats</Text>
          <Text style={styles.statsPromptText}>
            Start a walk right away. Create an account later to save your walks
            and track your history and more.
          </Text>
        </View>

        {/* Auth Links */}
        <View style={styles.authSection}>
          <View style={styles.authButtons}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
            >
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  pawIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#660033",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  mainAction: {
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#660033",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    shadowColor: "#660033",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  startButtonTextContainer: {
    flex: 1,
  },
  startButtonTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  startButtonSubtitle: {
    fontSize: 14,
    color: "#E0E7FF",
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  statsPromptCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsPromptIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  statsPromptTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  statsPromptText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  statsLoginButton: {
    backgroundColor: "#660033",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  statsLoginButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  authSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  authText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  authButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  loginButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#660033",
  },
  signUpButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#660033",
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#660033",
  },
});
