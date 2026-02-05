import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useAuth } from "@/lib/auth-context";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  // Animation values for paw stamps (bottom left to upper right)
  const paw1 = useRef(new Animated.Value(0)).current;
  const paw2 = useRef(new Animated.Value(0)).current;
  const paw3 = useRef(new Animated.Value(0)).current;
  const paw4 = useRef(new Animated.Value(0)).current;

  // Animation value for title
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.5)).current;

  // Track if animation is complete
  const animationComplete = useRef(false);
  const hasNavigated = useRef(false);

  // Start animations on mount
  useEffect(() => {
    const pawDuration = 250;
    const pawDelay = 150;

    Animated.sequence([
      Animated.timing(paw1, {
        toValue: 1,
        duration: pawDuration,
        useNativeDriver: true,
      }),
      Animated.delay(pawDelay),
      Animated.timing(paw2, {
        toValue: 1,
        duration: pawDuration,
        useNativeDriver: true,
      }),
      Animated.delay(pawDelay),
      Animated.timing(paw3, {
        toValue: 1,
        duration: pawDuration,
        useNativeDriver: true,
      }),
      Animated.delay(pawDelay),
      Animated.timing(paw4, {
        toValue: 1,
        duration: pawDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Mark animation complete after total time
    const totalAnimationTime = (pawDuration + pawDelay) * 4 + 1500;
    const animationTimeout = setTimeout(() => {
      animationComplete.current = true;
    }, totalAnimationTime);

    return () => clearTimeout(animationTimeout);
  }, []);

  // Navigate when both animation is complete and auth state is loaded
  useEffect(() => {
    if (hasNavigated.current) return;
    if (isLoading) return;

    // Wait a bit for animation if auth loads quickly
    const checkAndNavigate = () => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      if (isAuthenticated) {
        router.replace("/(protected)/(tabs)");
      } else {
        router.replace("/(public)/home");
      }
    };

    if (animationComplete.current) {
      checkAndNavigate();
    } else {
      // Wait for animation to complete (max ~3 seconds)
      const timeout = setTimeout(checkAndNavigate, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, isLoading]);

  // Paw prints walking diagonally from bottom left to upper right
  const pawPrints = [
    { anim: paw1, left: width * 0.15, top: height * 0.7, rotation: -15 },
    { anim: paw2, left: width * 0.45, top: height * 0.65, rotation: 15 },
    { anim: paw3, left: width * 0.15, top: height * 0.3, rotation: -10 },
    { anim: paw3, left: width * 0.75, top: height * 0.2, rotation: 10 },
  ];

  return (
    <View style={styles.container}>
      {/* Paw prints */}
      {pawPrints.map((paw, index) => (
        <Animated.View
          key={index}
          style={[
            styles.pawContainer,
            {
              left: paw.left,
              top: paw.top,
              opacity: paw.anim,
              transform: [
                {
                  scale: paw.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
                {
                  rotate: `${paw.rotation}deg`,
                },
              ],
            },
          ]}
        >
          <FontAwesome name="paw" size={60} color="#000000" style={styles.pawPrint} />
        </Animated.View>
      ))}

      {/* Title */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ scale: titleScale }],
          },
        ]}
      >
        <Text style={styles.title}>WalkDog</Text>
        <Text style={styles.subtitle}>Track every adventure with your pup</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDE8D0",
    position: "relative",
  },
  pawContainer: {
    position: "absolute",
  },
  pawPrint: {
    opacity: 0.3,
  },
  titleContainer: {
    position: "absolute",
    top: height * 0.4,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  titleIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#660033",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
});
