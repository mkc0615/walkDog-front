import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useAuth } from "./auth-context";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  // Animation values for paw stamps (bottom to top)
  const paw1 = useRef(new Animated.Value(0)).current;
  const paw2 = useRef(new Animated.Value(0)).current;
  const paw3 = useRef(new Animated.Value(0)).current;
  const paw4 = useRef(new Animated.Value(0)).current;
  const paw5 = useRef(new Animated.Value(0)).current;
  const paw6 = useRef(new Animated.Value(0)).current;

  // Animation value for title
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Start paw stamp animations from bottom to top
    const pawDuration = 250;
    const pawDelay = 150;

    Animated.sequence([
      // Paw stamps appear one by one from bottom to top
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
      Animated.delay(pawDelay),
      Animated.timing(paw5, {
        toValue: 1,
        duration: pawDuration,
        useNativeDriver: true,
      }),
      Animated.delay(pawDelay),
      Animated.timing(paw6, {
        toValue: 1,
        duration: pawDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After paw stamps, show title
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

    // Navigate after total animation time
    const totalAnimationTime = (pawDuration + pawDelay) * 6 + 1500;
    const navigationTimeout = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          router.replace("/(protected)/(tabs)");
        } else {
          router.replace("/(auth)/login");
        }
      }
    }, totalAnimationTime);

    return () => clearTimeout(navigationTimeout);
  }, [isAuthenticated, isLoading]);

  // Paw prints walking from bottom to top
  const pawPrints = [
    { anim: paw1, left: width * 0.2, top: height * 0.75, rotation: -15 },
    { anim: paw2, left: width * 0.6, top: height * 0.65, rotation: 15 },
    { anim: paw3, left: width * 0.25, top: height * 0.55, rotation: -10 },
    { anim: paw4, left: width * 0.65, top: height * 0.45, rotation: 10 },
    { anim: paw5, left: width * 0.3, top: height * 0.35, rotation: -5 },
    { anim: paw6, left: width * 0.7, top: height * 0.25, rotation: 5 },
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
          <Text style={styles.pawPrint}>🐾</Text>
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
        <Text style={styles.titleIcon}>🐾</Text>
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
    fontSize: 60,
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
    fontSize: 80,
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
