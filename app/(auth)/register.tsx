import { router } from "expo-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
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
import { validateRegisterForm, sanitizeInput, PASSWORD_MIN_LENGTH } from "../utils/validation";
import { checkRateLimit, recordFailedAttempt, recordSuccessfulAttempt, RATE_LIMIT_ACTIONS } from "../utils/rate-limiter";

const RegisterForm = memo(({ onSubmit, isLoading, initialName, rateLimitMessage, isRateLimited }: {
  onSubmit: (name: string, email: string, password: string) => void;
  isLoading: boolean;
  initialName?: string;
  rateLimitMessage: string;
  isRateLimited: boolean;
}) => {
    const [name, setName] = useState(initialName || "");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    }>({});
    const [touched, setTouched] = useState<{
      name?: boolean;
      email?: boolean;
      password?: boolean;
      confirmPassword?: boolean;
    }>({});

    const handleChange = (field: string, value: string) => {
      switch (field) {
        case 'name':
          setName(value);
          break;
        case 'email':
          setEmail(value);
          break;
        case 'password':
          setPassword(value);
          break;
        case 'confirmPassword':
          setConfirmPassword(value);
          break;
      }
      // Clear error when user starts typing
      if (errors[field as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    };

    const handleBlur = (field: string) => {
      setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleSubmit = () => {
      // Mark all fields as touched
      setTouched({ name: true, email: true, password: true, confirmPassword: true });

      // Validate
      const validation = validateRegisterForm(name, email, password, confirmPassword);

      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      // Sanitize and submit (don't sanitize password)
      onSubmit(sanitizeInput(name), sanitizeInput(email), password);
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
                <Text style={styles.label}>Name</Text>
                <TextInput
                style={[styles.input, touched.name && errors.name && styles.inputError]}
                placeholder="Your name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={(text) => handleChange('name', text)}
                onBlur={() => handleBlur('name')}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isRateLimited}
                />
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                style={[styles.input, touched.email && errors.email && styles.inputError]}
                placeholder="your@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => handleChange('email', text)}
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
                onChangeText={(text) => handleChange('password', text)}
                onBlur={() => handleBlur('password')}
                secureTextEntry
                autoComplete="password-new"
                editable={!isRateLimited}
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                style={[styles.input, touched.confirmPassword && errors.confirmPassword && styles.inputError]}
                placeholder="Re-enter your password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
                onBlur={() => handleBlur('confirmPassword')}
                secureTextEntry
                autoComplete="password-new"
                editable={!isRateLimited}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
            </View>

            <TouchableOpacity
                style={[styles.button, isDisabled && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isDisabled}
            >
                <Text style={styles.buttonText}>
                {isLoading ? 'Creating account...' : isRateLimited ? 'Please wait...' : 'Sign Up'}
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

    // Rate limiting state
    const [rateLimitMessage, setRateLimitMessage] = useState("");
    const [isRateLimited, setIsRateLimited] = useState(false);
    const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Check rate limit status and update UI
    const updateRateLimitStatus = useCallback(() => {
      const status = checkRateLimit(RATE_LIMIT_ACTIONS.REGISTER);
      setIsRateLimited(!status.allowed);
      setRateLimitMessage(status.message);

      // If rate limited, schedule a re-check
      if (!status.allowed && status.waitMs > 0) {
        if (rateLimitTimerRef.current) {
          clearTimeout(rateLimitTimerRef.current);
        }
        rateLimitTimerRef.current = setTimeout(() => {
          updateRateLimitStatus();
        }, Math.min(status.waitMs, 1000));
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

    const handleRegister = async (name: string, email: string, password: string) => {
        // Check rate limit before attempting registration
        const rateLimitStatus = checkRateLimit(RATE_LIMIT_ACTIONS.REGISTER);
        if (!rateLimitStatus.allowed) {
          setRateLimitMessage(rateLimitStatus.message);
          setIsRateLimited(true);
          updateRateLimitStatus();
          return;
        }

        const success = await registerRef.current(name, email, password);

        if (success) {
          console.log("Registration success !!!");
          // Record successful attempt (resets rate limit)
          recordSuccessfulAttempt(RATE_LIMIT_ACTIONS.REGISTER);
          setRateLimitMessage("");
          setIsRateLimited(false);
        } else {
          console.log("Registration failed, staying on register screen");
          // Record failed attempt
          recordFailedAttempt(RATE_LIMIT_ACTIONS.REGISTER);
          updateRateLimitStatus();
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
              rateLimitMessage={rateLimitMessage}
              isRateLimited={isRateLimited}
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
