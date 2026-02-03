import { router } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import {
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
import { useAuth } from "../auth-context";
import { useGuestWalk } from "../guest-walk-context";

const RegisterForm = memo(({ onSubmit, isLoading, initialName }: {
  onSubmit: (name: string, email: string, password: string, confirmPassword: string) => void;
  isLoading: boolean;
  initialName?: string;
}) => {
    const [name, setName] = useState(initialName || "");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = () => {
        onSubmit(name, email, password, confirmPassword);
    };

    return (
        <View style={styles.form}>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                />
            </View>

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
                autoComplete="password-new"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
                />
            </View>

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>
                {isLoading ? 'Creating account...' : 'Sign Up'}
                </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default function RegisterScreen() {
    const { register, isLoading, isAuthenticated, migrateGuestWalk } = useAuth();
    const { pendingWalk, hasPendingWalk, clearPendingWalk, guestUserInfo, clearGuestUserInfo } = useGuestWalk();
    const registerRef = useRef(register);
    const migrateRef = useRef(migrateGuestWalk);
    registerRef.current = register;
    migrateRef.current = migrateGuestWalk;
    const [isMigrating, setIsMigrating] = useState(false);

    // Navigate when authentication state changes (after successful registration)
    useEffect(() => {
      if (isAuthenticated && !isMigrating) {
        console.log("User registered and authenticated, checking for pending walk...");

        const handleMigration = async () => {
          if (hasPendingWalk && pendingWalk) {
            setIsMigrating(true);
            console.log("Found pending walk, migrating...");

            try {
              const migrationSuccess = await migrateRef.current(pendingWalk);

              if (migrationSuccess) {
                await clearPendingWalk();
                await clearGuestUserInfo();
                Alert.alert(
                  "Walk Saved!",
                  "Your walk has been saved to your account.",
                  [{ text: "OK", onPress: () => router.replace("/(protected)/(tabs)/walks") }]
                );
              } else {
                Alert.alert(
                  "Migration Failed",
                  "We couldn't save your walk. It's still stored locally - try again later.",
                  [{ text: "OK", onPress: () => router.replace("/(protected)/(tabs)") }]
                );
              }
            } catch (error) {
              console.error("Migration error:", error);
              Alert.alert(
                "Error",
                "Something went wrong while saving your walk.",
                [{ text: "OK", onPress: () => router.replace("/(protected)/(tabs)") }]
              );
            } finally {
              setIsMigrating(false);
            }
          } else {
            router.replace("/(protected)/(tabs)");
          }
        };

        const timeout = setTimeout(handleMigration, 100);
        return () => clearTimeout(timeout);
      }
    }, [isAuthenticated, hasPendingWalk, isMigrating]);

    const handleRegister = async (name: string, email: string, password: string, confirmPassword: string) => {
        if(!name || !email || !password || !confirmPassword) {
          Alert.alert("All fields are required");
          return;
        }

        if(password !== confirmPassword) {
          Alert.alert("Passwords don't match");
          return;
        }

        const success = await registerRef.current(name, email, password);

        if (success) {
          console.log("Registration success !!!");
        } else {
          console.log("Registration failed, staying on register screen");
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
            <View style={styles.header}>
            <Text style={styles.pawIcon}>🐾</Text>
            <Text style={styles.title}>Join WalkDog</Text>
            <Text style={styles.subtitle}>Start tracking adventures with your pup</Text>
            </View>

            <RegisterForm
              onSubmit={handleRegister}
              isLoading={isLoading}
              initialName={guestUserInfo?.name}
            />
            </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
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
  button: {
    backgroundColor: '#660033',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#660033',
    fontSize: 14,
    fontWeight: '600',
  },
});
