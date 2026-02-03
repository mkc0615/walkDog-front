import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Coordinate, CoordinateWithTimestamp } from './utils/walk-utils';

const PENDING_WALK_KEY = 'pending_guest_walk';
const GUEST_USER_KEY = 'guest_user_info';

export interface GuestUserInfo {
  name?: string;
  dogName?: string;
}

export interface GuestWalkData {
  id: string;
  startedAt: string;
  endedAt?: string;
  duration: number;
  distance: number;
  routeCoordinates: CoordinateWithTimestamp[];
  title?: string;
  notes?: string;
  startLatitude: number;
  startLongitude: number;
  guestUserInfo?: GuestUserInfo;
}

interface ActiveWalkState {
  id: string;
  startedAt: string;
  title?: string;
  notes?: string;
  startLatitude: number;
  startLongitude: number;
  guestUserInfo?: GuestUserInfo;
}

interface GuestWalkContextType {
  // Active walk state (while walking)
  activeWalk: ActiveWalkState | null;
  startWalk: (startCoord: Coordinate, title?: string, notes?: string, guestUserInfo?: GuestUserInfo) => string;
  endWalk: (duration: number, distance: number, routeCoordinates: CoordinateWithTimestamp[]) => Promise<void>;
  cancelWalk: () => void;

  // Pending walk (completed but not saved)
  pendingWalk: GuestWalkData | null;
  hasPendingWalk: boolean;
  updatePendingWalk: (updates: Partial<Pick<GuestWalkData, 'title' | 'notes'>>) => Promise<void>;
  clearPendingWalk: () => Promise<void>;
  getPendingWalk: () => Promise<GuestWalkData | null>;

  // Guest user info (persisted separately for registration)
  guestUserInfo: GuestUserInfo | null;
  setGuestUserInfo: (info: GuestUserInfo) => Promise<void>;
  clearGuestUserInfo: () => Promise<void>;

  // Loading state
  isLoading: boolean;
}

const GuestWalkContext = createContext<GuestWalkContextType | undefined>(undefined);

function generateWalkId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function GuestWalkProvider({ children }: { children: React.ReactNode }) {
  const [activeWalk, setActiveWalk] = useState<ActiveWalkState | null>(null);
  const [pendingWalk, setPendingWalk] = useState<GuestWalkData | null>(null);
  const [guestUserInfo, setGuestUserInfoState] = useState<GuestUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load pending walk and guest user info from AsyncStorage on mount
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedWalk, storedUserInfo] = await Promise.all([
        AsyncStorage.getItem(PENDING_WALK_KEY),
        AsyncStorage.getItem(GUEST_USER_KEY),
      ]);

      if (storedWalk) {
        setPendingWalk(JSON.parse(storedWalk));
      }
      if (storedUserInfo) {
        setGuestUserInfoState(JSON.parse(storedUserInfo));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setGuestUserInfo = async (info: GuestUserInfo) => {
    await AsyncStorage.setItem(GUEST_USER_KEY, JSON.stringify(info));
    setGuestUserInfoState(info);
  };

  const clearGuestUserInfo = async () => {
    await AsyncStorage.removeItem(GUEST_USER_KEY);
    setGuestUserInfoState(null);
  };

  const startWalk = (startCoord: Coordinate, title?: string, notes?: string, userInfo?: GuestUserInfo): string => {
    const id = generateWalkId();
    const walk: ActiveWalkState = {
      id,
      startedAt: new Date().toISOString(),
      title,
      notes,
      startLatitude: startCoord.latitude,
      startLongitude: startCoord.longitude,
      guestUserInfo: userInfo,
    };
    setActiveWalk(walk);

    // Also persist guest user info if provided
    if (userInfo && (userInfo.name || userInfo.dogName)) {
      setGuestUserInfo(userInfo);
    }

    return id;
  };

  const endWalk = async (
    duration: number,
    distance: number,
    routeCoordinates: CoordinateWithTimestamp[]
  ): Promise<void> => {
    if (!activeWalk) {
      throw new Error('No active walk to end');
    }

    const completedWalk: GuestWalkData = {
      id: activeWalk.id,
      startedAt: activeWalk.startedAt,
      endedAt: new Date().toISOString(),
      duration,
      distance,
      routeCoordinates,
      title: activeWalk.title,
      notes: activeWalk.notes,
      startLatitude: activeWalk.startLatitude,
      startLongitude: activeWalk.startLongitude,
      guestUserInfo: activeWalk.guestUserInfo,
    };

    // Save to AsyncStorage
    await AsyncStorage.setItem(PENDING_WALK_KEY, JSON.stringify(completedWalk));

    // Update state
    setPendingWalk(completedWalk);
    setActiveWalk(null);
  };

  const cancelWalk = () => {
    setActiveWalk(null);
  };

  const updatePendingWalk = async (updates: Partial<Pick<GuestWalkData, 'title' | 'notes'>>) => {
    if (!pendingWalk) return;

    const updated = { ...pendingWalk, ...updates };
    await AsyncStorage.setItem(PENDING_WALK_KEY, JSON.stringify(updated));
    setPendingWalk(updated);
  };

  const clearPendingWalk = async () => {
    await AsyncStorage.removeItem(PENDING_WALK_KEY);
    setPendingWalk(null);
  };

  const getPendingWalk = async (): Promise<GuestWalkData | null> => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_WALK_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const value: GuestWalkContextType = {
    activeWalk,
    startWalk,
    endWalk,
    cancelWalk,
    pendingWalk,
    hasPendingWalk: !!pendingWalk,
    updatePendingWalk,
    clearPendingWalk,
    getPendingWalk,
    guestUserInfo,
    setGuestUserInfo,
    clearGuestUserInfo,
    isLoading,
  };

  return (
    <GuestWalkContext.Provider value={value}>
      {children}
    </GuestWalkContext.Provider>
  );
}

export function useGuestWalk() {
  const context = useContext(GuestWalkContext);
  if (context === undefined) {
    throw new Error('useGuestWalk must be used within a GuestWalkProvider');
  }
  return context;
}
