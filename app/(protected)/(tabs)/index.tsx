import { router } from "expo-router";
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth-context";

interface WalkStats {
  totalWalks: number;
  totalDistance: number;
  totalDuration: number;
}

export default function Index() {
  const { logout } = useAuth();

  const stats: WalkStats = {
    totalWalks: 127,
    totalDistance: 254.8,
    totalDuration: 6340,
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const handleStartWalk = () => {
    router.push("/(protected)/startWalk");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello!</Text>
            <Text style={styles.subGreeting}>Ready for a walk?</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
            <Text style={styles.profileIcon}>🐕</Text>
          </TouchableOpacity>
        </View>

        {/* Start Walk Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartWalk}>
          <View style={styles.startButtonContent}>
            <Text style={styles.startButtonIcon}>🚶‍♂️</Text>
            <View style={styles.startButtonText}>
              <Text style={styles.startButtonTitle}>Start New Walk</Text>
              <Text style={styles.startButtonSubtitle}>
                Track your adventure
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Weekly Progress */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weeklyCard}>
            <View style={styles.weeklyContent}>
              <Text style={styles.weeklyNumber}>{stats.thisWeek}</Text>
              <Text style={styles.weeklyLabel}>walks completed</Text>
            </View>
            <View style={styles.weeklyProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(stats.thisWeek / 7) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.weeklyGoal}>Goal: 7 walks/week</Text>
            </View>
          </View>
        </View> */}

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🐾</Text>
              <Text style={styles.statValue}>{stats.totalWalks}</Text>
              <Text style={styles.statLabel}>Total Walks</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📍</Text>
              <Text style={styles.statValue}>{stats.totalDistance} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>
                {formatDuration(stats.totalDuration)}
              </Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>
                {Math.round(stats.totalDistance / stats.totalWalks * 10) / 10} km
              </Text>
              <Text style={styles.statLabel}>Avg Distance</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Walks</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentWalk}>
            <View style={styles.recentWalkLeft}>
              <View style={styles.recentWalkIcon}>
                <Text style={styles.recentWalkEmoji}>🌳</Text>
              </View>
              <View>
                <Text style={styles.recentWalkTitle}>Morning Walk</Text>
                <Text style={styles.recentWalkDetails}>2.3 km • 32 min</Text>
              </View>
            </View>
            <Text style={styles.recentWalkTime}>Today, 8:30 AM</Text>
          </View>

          <View style={styles.recentWalk}>
            <View style={styles.recentWalkLeft}>
              <View style={styles.recentWalkIcon}>
                <Text style={styles.recentWalkEmoji}>🌳</Text>
              </View>
              <View>
                <Text style={styles.recentWalkTitle}>Evening Stroll</Text>
                <Text style={styles.recentWalkDetails}>1.8 km • 25 min</Text>
              </View>
            </View>
            <Text style={styles.recentWalkTime}>Yesterday, 6:45 PM</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileIcon: {
    fontSize: 24,
  },
  startButton: {
    backgroundColor: '#660033',
    marginHorizontal: 30,
    marginBottom: 24,
    borderRadius: 20,
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#660033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButtonIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  startButtonText: {
    flex: 1,
  },
  startButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  startButtonSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#660033',
    fontWeight: '600',
  },
  weeklyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weeklyContent: {
    marginBottom: 16,
  },
  weeklyNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#660033',
  },
  weeklyLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  weeklyProgress: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#660033',
    borderRadius: 4,
  },
  weeklyGoal: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recentWalk: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recentWalkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentWalkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentWalkEmoji: {
    fontSize: 20,
  },
  recentWalkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  recentWalkDetails: {
    fontSize: 14,
    color: '#666',
  },
  recentWalkTime: {
    fontSize: 12,
    color: '#999',
  },
})
