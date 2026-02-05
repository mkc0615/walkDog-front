import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EDE8D0" }}>
        <ActivityIndicator size="large" color="#660033" />
      </View>
    );
  }

  // Redirect to public home if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(public)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="startWalk" />
      <Stack.Screen name="activeWalk" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}