import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from "../../auth-context";

interface Walk {
  id: string;
  title: string;
  date: string;
  distance: number;
  duration: number;
}

type FilterType = 'all' | 'week' | 'month';

const MyWalksScreen: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [walks, setWalks] = useState<Walk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const icons = ['🌳', '🌆', '🏞', '🏖', '🏘', '⛰️', '🌃'];

  // Get token from auth context
  const { token } = useAuth();

  // Fetch walks from API
  useEffect(() => {
    const fetchWalks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiUrl = process.env.EXPO_PUBLIC_API_SERVICE_URL || 'http://localhost:9010';
        const response = await fetch(`${apiUrl}/api/v1/walks`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setWalks(data);
      } catch (err) {
        console.error('Error fetching walks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch walks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalks();
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  const handleWalkPress = (walkId: string) => {
    router.push({
      pathname: '/(protected)/walkDetails',
      params: { walkId }
    });
  };

  const calculateTotals = () => {
    const total = walks.reduce(
      (acc, walk) => ({
        distance: acc.distance + walk.distance,
        duration: acc.duration + walk.duration,
      }),
      { distance: 0, duration: 0 }
    );

    return {
      distance: Math.round(total.distance * 10) / 10,
      duration: Math.floor(total.duration / 60),
    };
  };

  const totals = calculateTotals();

  const renderWalkItem = ({ item }: { item: Walk }) => (
    <TouchableOpacity
      style={styles.walkCard}
      onPress={() => handleWalkPress(item.id)}
    >
      <View style={styles.walkCardLeft}>
        <View style={styles.walkIcon}>
          <Text style={styles.walkEmoji}>{icons[0]}</Text>
        </View>
        <View style={styles.walkInfo}>
          <Text style={styles.walkTitle}>{item.title}</Text>
          <Text style={styles.walkDate}>{formatDate(item.date)}</Text>
          <View style={styles.walkStats}>
            <Text style={styles.walkStat}>📍 {item.distance} km</Text>
            <Text style={styles.walkStat}>⏱️ {item.duration} min</Text>
          </View>
        </View>
      </View>
      <Text style={styles.walkArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Walks</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{walks.length}</Text>
          <Text style={styles.summaryLabel}>Total Walks</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totals.distance} km</Text>
          <Text style={styles.summaryLabel}>Distance</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totals.duration}h</Text>
          <Text style={styles.summaryLabel}>Time</Text>
        </View>
      </View>

      {/* Walks List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#660033" />
          <Text style={styles.loadingText}>Loading walks...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : walks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🐾</Text>
          <Text style={styles.emptyText}>No walks yet</Text>
          <Text style={styles.emptySubtext}>Start your first walk to see it here!</Text>
        </View>
      ) : (
        <FlatList
          data={walks}
          renderItem={renderWalkItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE8D0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#660033',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E5E5',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  filterButtonActive: {
    backgroundColor: '#660033',
    borderColor: '#660033',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  walkCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  walkCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walkIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  walkEmoji: {
    fontSize: 28,
  },
  walkInfo: {
    flex: 1,
  },
  walkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  walkDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  walkStats: {
    flexDirection: 'row',
    gap: 12,
  },
  walkStat: {
    fontSize: 13,
    color: '#999',
  },
  walkArrow: {
    fontSize: 24,
    color: '#CCC',
    fontWeight: '300',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#660033',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MyWalksScreen;