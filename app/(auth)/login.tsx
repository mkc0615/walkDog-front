import { router } from "expo-router";
import * as Location from "expo-location";
import { memo, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../auth-context";

// Separate form component to avoid re-renders triggering useAuth()
const LoginForm = memo(({ onSubmit, isLoading }: {
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = () => {
      onSubmit(email, password);
    };

    return (
        <View style={styles.form}>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                />
            </View>

            <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>
                {isLoading ? 'Logging in...' : 'Log In'}
                </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default function LoginScreen() {
    const { login, isLoading, isAuthenticated } = useAuth();
    const loginRef = useRef(login);
    loginRef.current = login;

    // Navigate when authentication state changes
    useEffect(() => {
      if (isAuthenticated) {
        console.log("User authenticated, redirecting to protected area");
        const timeout = setTimeout(() => {
          router.replace("/(protected)/(tabs)");
        }, 100);
        return () => clearTimeout(timeout);
      }
    }, [isAuthenticated]);

    const handleLogin = async (email: string, password: string) => {
        if(!email || !password) {
          console.log("invalid email or password");
            return;
        }

        const success = await loginRef.current(email, password);

        if (success) {
          console.log("Login success !!!");

          // Request location permissions after successful login
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                "Location Permission",
                "Location access is needed to track your dog walks. You can enable it later in Settings.",
                [{ text: "OK" }]
              );
            }
          } catch (error) {
            console.log("Error requesting location permission:", error);
          }
        } else {
          console.log("Login failed, staying on login screen");
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
            <View style={styles.header}>
            <Text style={styles.pawIcon}>🐾</Text>
            <Text style={styles.title}>WalkDog</Text>
            <Text style={styles.subtitle}>Track every adventure with your pup</Text>
            </View>

            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE8D0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  pawIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  forgotPassword: {
    color: '#660033',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#660033',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#660033',
    fontSize: 14,
    fontWeight: '600',
  },
});