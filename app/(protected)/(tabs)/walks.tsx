import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
  const icons = ['🌳', '🌆', '🏞', '🏖', '🏘', '⛰️', '🌃'];   

  // TODO: Replace with data from your Spring Boot backend
  const walks: Walk[] = [
    {
      id: '1',
      title: 'Morning Walk',
      date: '2025-11-15T08:30:00',
      distance: 2.3,
      duration: 32,
    },
    {
      id: '2',
      title: 'Evening Stroll',
      date: '2025-11-14T18:45:00',
      distance: 1.8,
      duration: 25,
    },
    {
      id: '3',
      title: 'Park Adventure',
      date: '2025-11-14T09:15:00',
      distance: 3.5,
      duration: 48,
    },
    {
      id: '4',
      title: 'Quick Run',
      date: '2025-11-13T07:00:00',
      distance: 1.2,
      duration: 15,
    },
    {
      id: '5',
      title: 'Beach Walk',
      date: '2025-11-12T17:30:00',
      distance: 4.2,
      duration: 62,
    },
    {
      id: '6',
      title: 'Neighborhood Loop',
      date: '2025-11-12T08:00:00',
      distance: 2.0,
      duration: 28,
    },
    {
      id: '7',
      title: 'Trail Hike',
      date: '2025-11-11T10:30:00',
      distance: 5.6,
      duration: 85,
    },
    {
      id: '8',
      title: 'City Walk',
      date: '2025-11-10T16:00:00',
      distance: 2.8,
      duration: 38,
    },
  ];

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

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'all' && styles.filterTextActive,
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'week' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter('week')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'week' && styles.filterTextActive,
            ]}
          >
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'month' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter('month')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'month' && styles.filterTextActive,
            ]}
          >
            This Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* Walks List */}
      <FlatList
        data={walks}
        renderItem={renderWalkItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: '#6366F1',
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
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
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
});

export default MyWalksScreen;