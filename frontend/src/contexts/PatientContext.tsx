import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import axios from '../lib/axios';

interface PatientListItem {
  patientId: string;
  uhid: string;
  name: string;
  lastConsultation: string;
  treatmentStatus: 'ongoing' | 'past';
  unreadMessages: number;
  trackedSymptomId?: string;
  trackedDiseaseName?: string;
}

interface PatientContextType {
  patients: PatientListItem[];
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchPatients: (page: number, limit: number, searchQuery?: string, statusFilter?: string[]) => Promise<void>;
  refreshPatients: () => void;
  invalidateCache: () => void;
  updatePatientStatus: (patientId: string, status: 'ongoing' | 'past') => void;
  removePatient: (patientId: string) => void;
  refetchPatientDetails: (patientId: string) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

interface PatientProviderProps {
  children: ReactNode;
}

export const PatientProvider: React.FC<PatientProviderProps> = ({ children }) => {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, { data: PatientListItem[]; totalPages: number; timestamp: number }>>(new Map());
  const [lastFetchParams, setLastFetchParams] = useState<{ page: number; limit: number; searchQuery?: string; statusFilter?: string[] } | null>(null);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const getCacheKey = (page: number, limit: number, searchQuery?: string, statusFilter?: string[]) => {
    return `${page}-${limit}-${searchQuery || ''}-${statusFilter?.join(',') || ''}`;
  };

  const fetchPatients = useCallback(async (
    page: number,
    limit: number,
    searchQuery?: string,
    statusFilter?: string[]
  ) => {
    const cacheKey = getCacheKey(page, limit, searchQuery, statusFilter);
    const cached = cache.get(cacheKey);
    const now = Date.now();

    // Return cached data if it's still fresh
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setPatients(cached.data);
      setTotalPages(cached.totalPages);
      setLastFetchParams({ page, limit, searchQuery, statusFilter });
      return;
    }

    setLoading(true);
    setError(null);
    setLastFetchParams({ page, limit, searchQuery, statusFilter });

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchQuery && { q: searchQuery }),
        ...(statusFilter && statusFilter.length > 0 && { status: statusFilter.join(',') })
      });

      const response = await axios.get(`/doctor/patients?${params}`);
      const fetchedPatients = response.data.patients;
      const fetchedTotalPages = response.data.totalPages;

      setPatients(fetchedPatients);
      setTotalPages(fetchedTotalPages);

      // Update cache
      const newCache = new Map(cache);
      newCache.set(cacheKey, {
        data: fetchedPatients,
        totalPages: fetchedTotalPages,
        timestamp: now
      });
      setCache(newCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const refreshPatients = useCallback(() => {
    if (lastFetchParams) {
      // Clear cache and refetch
      setCache(new Map());
      fetchPatients(
        lastFetchParams.page,
        lastFetchParams.limit,
        lastFetchParams.searchQuery,
        lastFetchParams.statusFilter
      );
    }
  }, [lastFetchParams, fetchPatients]);

  const invalidateCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const updatePatientStatus = useCallback((patientId: string, status: 'ongoing' | 'past') => {
    setPatients(prev =>
      prev.map(p => p.patientId === patientId ? { ...p, treatmentStatus: status } : p)
    );
    // Invalidate cache since data changed
    setCache(new Map());
  }, []);

  const removePatient = useCallback((patientId: string) => {
    setPatients(prev => prev.filter(p => p.patientId !== patientId));
    // Invalidate cache since data changed
    setCache(new Map());
  }, []);

  const refetchPatientDetails = useCallback(async (patientId: string) => {
    try {
      // Fetch updated patient profile
      const response = await axios.get(`/patients/${patientId}`);
      const updatedPatient = response.data;
      
      // Update the patient in the local state
      setPatients(prev =>
        prev.map(p => {
          if (p.patientId === patientId) {
            return {
              ...p,
              name: updatedPatient.name || p.name,
              uhid: updatedPatient.uhid || p.uhid
            };
          }
          return p;
        })
      );
      
      // Invalidate cache to ensure fresh data on next fetch
      setCache(new Map());
    } catch (err) {
      console.error('Failed to refetch patient details:', err);
    }
  }, []);

  return (
    <PatientContext.Provider
      value={{
        patients,
        totalPages,
        loading,
        error,
        fetchPatients,
        refreshPatients,
        invalidateCache,
        updatePatientStatus,
        removePatient,
        refetchPatientDetails
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};
