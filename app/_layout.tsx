import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./auth-context";
import { GuestWalkProvider } from "./guest-walk-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GuestWalkProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(protected)" />
          </Stack>
        </GuestWalkProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
