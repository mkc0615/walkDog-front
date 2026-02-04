import { router } from "expo-router";
import * as Location from "expo-location";
import { memo, useCallback, useEffect, useRef, useState } from "react";
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
import { useGuestWalk } from "../guest-walk-context";
import { validateLoginForm, sanitizeInput, PASSWORD_MIN_LENGTH } from "../utils/validation";
import { checkRateLimit, recordFailedAttempt, recordSuccessfulAttempt, RATE_LIMIT_ACTIONS } from "../utils/rate-limiter";

// Separate form component to avoid re-renders triggering useAuth()
const LoginForm = memo(({ onSubmit, isLoading, rateLimitMessage, isRateLimited }: {
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
  rateLimitMessage: string;
  isRateLimited: boolean;
}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

    const handleEmailChange = (text: string) => {
      setEmail(text);
      // Clear error when user starts typing
      if (errors.email) {
        setErrors(prev => ({ ...prev, email: undefined }));
      }
    };

    const handlePasswordChange = (text: string) => {
      setPassword(text);
      if (errors.password) {
        setErrors(prev => ({ ...prev, password: undefined }));
      }
    };

    const handleBlur = (field: 'email' | 'password') => {
      setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleSubmit = () => {
      // Mark all fields as touched
      setTouched({ email: true, password: true });

      // Validate
      const validation = validateLoginForm(email, password);

      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      // Sanitize and submit
      onSubmit(sanitizeInput(email), password);
    };

    const isDisabled = isLoading || isRateLimited;

    return (
        <View style={styles.form}>
            {/* Rate limit warning */}
            {rateLimitMessage ? (
              <View style={styles.rateLimitBanner}>
                <Text style={styles.rateLimitText}>{rateLimitMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                style={[styles.input, touched.email && errors.email && styles.inputError]}
                placeholder="your@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={handleEmailChange}
                onBlur={() => handleBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isRateLimited}
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                style={[styles.input, touched.password && errors.password && styles.inputError]}
                placeholder={`Min ${PASSWORD_MIN_LENGTH} characters`}
                placeholderTextColor="#999"
                value={password}
                onChangeText={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                secureTextEntry
                autoComplete="password"
                editable={!isRateLimited}
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
            </View>

            <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, isDisabled && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isDisabled}
            >
                <Text style={styles.buttonText}>
                {isLoading ? 'Logging in...' : isRateLimited ? 'Please wait...' : 'Log In'}
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
    const { login, isLoading, isAuthenticated, migrateGuestWalk } = useAuth();
    const { pendingWalk, hasPendingWalk, clearPendingWalk, clearGuestUserInfo } = useGuestWalk();
    const loginRef = useRef(login);
    const migrateRef = useRef(migrateGuestWalk);
    loginRef.current = login;
    migrateRef.current = migrateGuestWalk;
    const [isMigrating, setIsMigrating] = useState(false);

    // Rate limiting state
    const [rateLimitMessage, setRateLimitMessage] = useState("");
    const [isRateLimited, setIsRateLimited] = useState(false);
    const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Check rate limit status and update UI
    const updateRateLimitStatus = useCallback(() => {
      const status = checkRateLimit(RATE_LIMIT_ACTIONS.LOGIN);
      setIsRateLimited(!status.allowed);
      setRateLimitMessage(status.message);

      // If rate limited, schedule a re-check
      if (!status.allowed && status.waitMs > 0) {
        if (rateLimitTimerRef.current) {
          clearTimeout(rateLimitTimerRef.current);
        }
        rateLimitTimerRef.current = setTimeout(() => {
          updateRateLimitStatus();
        }, Math.min(status.waitMs, 1000)); // Update every second or when limit expires
      }
    }, []);

    // Check rate limit on mount and cleanup
    useEffect(() => {
      updateRateLimitStatus();
      return () => {
        if (rateLimitTimerRef.current) {
          clearTimeout(rateLimitTimerRef.current);
        }
      };
    }, [updateRateLimitStatus]);

    // Navigate when authentication state changes
    useEffect(() => {
      if (isAuthenticated && !isMigrating) {
        console.log("User authenticated, checking for pending walk...");

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

    const handleLogin = async (email: string, password: string) => {
        // Check rate limit before attempting login
        const rateLimitStatus = checkRateLimit(RATE_LIMIT_ACTIONS.LOGIN);
        if (!rateLimitStatus.allowed) {
          setRateLimitMessage(rateLimitStatus.message);
          setIsRateLimited(true);
          updateRateLimitStatus();
          return;
        }

        const success = await loginRef.current(email, password);

        if (success) {
          console.log("Login success !!!");
          // Record successful attempt (resets rate limit)
          recordSuccessfulAttempt(RATE_LIMIT_ACTIONS.LOGIN);
          setRateLimitMessage("");
          setIsRateLimited(false);

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
          // Record failed attempt
          recordFailedAttempt(RATE_LIMIT_ACTIONS.LOGIN);
          updateRateLimitStatus();
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

            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
              rateLimitMessage={rateLimitMessage}
              isRateLimited={isRateLimited}
            />
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
  rateLimitBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  rateLimitText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
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
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
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