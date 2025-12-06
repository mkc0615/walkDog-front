import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth-context';

interface WalkDetail {
  walkId: number;
  title: string;
  description?: string;
  distance: number;
  duration: number;
  startedAt: string;
  endedAt?: string;
  dogIds: number[];
}

const WalkDetailScreen: React.FC = () => {
  const params = useLocalSearchParams<{ walkId: string }>();
  const { token } = useAuth();
  const [walk, setWalk] = useState<WalkDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalkDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiUrl = process.env.EXPO_PUBLIC_API_SERVICE_URL || 'http://localhost:9010';
        const response = await fetch(`${apiUrl}/api/v1/walks/${params.walkId}`, {
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
        setWalk(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch walk details');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.walkId) {
      fetchWalkDetails();
    }
  }, [params.walkId, token]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleEdit = () => {
    // TODO: Navigate to edit screen
    console.log('Edit walk');
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Walk",
      "Are you sure you want to delete this walk? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const apiUrl = process.env.EXPO_PUBLIC_API_SERVICE_URL || 'http://localhost:9010';
              const response = await fetch(`${apiUrl}/api/v1/walks/${params.walkId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                router.replace("/(protected)/(tabs)/walks");
              } else {
                Alert.alert(
                  "Deletion Failed",
                  "Failed to delete the walk. Please try again."
                );
              }
            } catch (error) {
              console.error('Error deleting walk:', error);
              Alert.alert(
                "Deletion Failed",
                "An error occurred while deleting the walk. Please try again."
              );
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#660033" />
          <Text style={styles.loadingText}>Loading walk details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !walk) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Walk not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={styles.mapText}>Route Map</Text>
            <Text style={styles.mapSubtext}>
              GPS tracking would appear here
            </Text>
          </View>
          <View style={styles.walkIconOverlay}>
            <Text style={styles.walkEmojiLarge}>🐕</Text>
          </View>
        </View>

        {/* Walk Title and Time */}
        <View style={styles.titleSection}>
          <Text style={styles.walkTitle}>{walk.title || 'Walk Details'}</Text>
          <Text style={styles.walkDate}>{formatDate(walk.startedAt)}</Text>
          <Text style={styles.walkTime}>{formatTime(walk.startedAt)}</Text>
          {walk.dogIds && walk.dogIds.length > 0 && (
            <Text style={styles.walkSubtext}>
              Walking with {walk.dogIds.length} dog{walk.dogIds.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Main Stats */}
        <View style={styles.mainStats}>
          <View style={styles.mainStatCard}>
            <Text style={styles.mainStatIcon}>📍</Text>
            <Text style={styles.mainStatValue}>{walk.distance.toFixed(2)}</Text>
            <Text style={styles.mainStatUnit}>kilometers</Text>
          </View>
          <View style={styles.mainStatCard}>
            <Text style={styles.mainStatIcon}>⏱️</Text>
            <Text style={styles.mainStatValue}>{Math.floor(walk.duration / 60)}</Text>
            <Text style={styles.mainStatUnit}>minutes</Text>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>⚡</Text>
            </View>
            <Text style={styles.statValue}>
              {walk.duration > 0 ? ((walk.distance / (walk.duration / 3600)).toFixed(1)) : '0.0'}
            </Text>
            <Text style={styles.statLabel}>km/h</Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>🐕</Text>
            </View>
            <Text style={styles.statValue}>{walk.dogIds.length}</Text>
            <Text style={styles.statLabel}>Dog{walk.dogIds.length > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Notes Section */}
        {walk.description && (
          <View style={styles.notesSection}>
            <View style={styles.notesSectionHeader}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TouchableOpacity onPress={handleEdit}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{walk.description}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButtonLarge} onPress={handleEdit}>
            <Text style={styles.editButtonIcon}>✏️</Text>
            <Text style={styles.editButtonText}>Edit Details</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Walk</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

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
  backButton: {
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
  backIcon: {
    fontSize: 24,
    color: '#1A1A1A',
  },
  moreButton: {
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
  moreIcon: {
    fontSize: 24,
    color: '#1A1A1A',
  },
  mapContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    position: 'relative',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#999',
  },
  walkIconOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  walkEmojiLarge: {
    fontSize: 32,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  walkTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  walkDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  walkTime: {
    fontSize: 16,
    color: '#666',
  },
  walkSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
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
  mainStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: '#660033',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#660033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mainStatIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mainStatValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  mainStatUnit: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  notesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  editButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#660033',
  },
  notesCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1A1A1A',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 8,
  },
  shareButtonIcon: {
    fontSize: 18,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  editButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#660033',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  editButtonIcon: {
    fontSize: 18,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  deleteButton: {
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  bottomSpacer: {
    height: 32,
  },
});

export default WalkDetailScreen;