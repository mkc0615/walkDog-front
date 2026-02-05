import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function PublicLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EDE8D0" }}>
        <ActivityIndicator size="large" color="#660033" />
      </View>
    );
  }

  // If authenticated, redirect to protected tabs
  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="guestStartWalk" />
      <Stack.Screen name="guestActiveWalk" />
      <Stack.Screen name="guestWalkSummary" />
    </Stack>
  );
}
