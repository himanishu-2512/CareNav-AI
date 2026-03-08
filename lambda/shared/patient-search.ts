/**
 * Patient Search and Filtering Module
 * 
 * Provides search algorithms for patient lookup by name and UHID,
 * with status filtering and debounced search support.
 * 
 * Requirements: 2.2, 2.3, 2.4, 3.1, 3.2
 */

import { PatientListItem } from './types';

/**
 * Search options for patient filtering
 */
export interface PatientSearchOptions {
  /** Search query for name or UHID matching */
  query?: string;
  /** Filter by treatment status */
  statusFilter?: ('ongoing' | 'past')[];
  /** Case-sensitive search (default: false) */
  caseSensitive?: boolean;
}

/**
 * Search result with metadata
 */
export interface PatientSearchResult {
  /** Matching patients */
  patients: PatientListItem[];
  /** Total number of matches */
  totalMatches: number;
  /** Search query used */
  searchQuery?: string;
  /** Applied status filter */
  statusFilter?: ('ongoing' | 'past')[];
  /** Search execution time in milliseconds */
  executionTimeMs: number;
}

/**
 * Performs case-insensitive search on patient name and UHID
 * 
 * @param patients - List of patients to search
 * @param query - Search query string
 * @param caseSensitive - Whether to perform case-sensitive search (default: false)
 * @returns Filtered list of patients matching the query
 * 
 * Requirements:
 * - 2.2: Match against patient names and UHID values
 * - 2.4: Perform case-insensitive matching on patient names
 */
export function searchPatients(
  patients: PatientListItem[],
  query: string,
  caseSensitive: boolean = false
): PatientListItem[] {
  // Handle empty query
  if (!query || query.trim().length === 0) {
    return patients;
  }

  const searchTerm = caseSensitive ? query.trim() : query.trim().toLowerCase();

  return patients.filter(patient => {
    const name = caseSensitive ? patient.name : patient.name.toLowerCase();
    const uhid = caseSensitive ? patient.uhid : patient.uhid.toLowerCase();

    // Match if query is found in name or UHID
    return name.includes(searchTerm) || uhid.includes(searchTerm);
  });
}

/**
 * Filters patients by treatment status
 * 
 * @param patients - List of patients to filter
 * @param statusFilter - Array of statuses to include ('ongoing', 'past')
 * @returns Filtered list of patients matching the status filter
 * 
 * Requirements:
 * - 3.1: Provide filter options for "ongoing" and "past" treatment statuses
 * - 3.2: Display only patients with active Treatment_Episodes when "ongoing" selected
 */
export function filterByStatus(
  patients: PatientListItem[],
  statusFilter: ('ongoing' | 'past')[]
): PatientListItem[] {
  // If no filter or both statuses selected, return all patients
  if (!statusFilter || statusFilter.length === 0 || statusFilter.length === 2) {
    return patients;
  }

  return patients.filter(patient => 
    statusFilter.includes(patient.treatmentStatus)
  );
}

/**
 * Comprehensive search and filter function
 * Combines search query matching with status filtering
 * 
 * @param patients - List of patients to search and filter
 * @param options - Search and filter options
 * @returns Search result with matching patients and metadata
 * 
 * Requirements:
 * - 2.2: Match against patient names and UHID values
 * - 2.3: Display matching results within 500 milliseconds
 * - 2.4: Perform case-insensitive matching
 * - 3.2: Filter by treatment status
 */
export function searchAndFilterPatients(
  patients: PatientListItem[],
  options: PatientSearchOptions = {}
): PatientSearchResult {
  const startTime = Date.now();

  let results = patients;

  // Apply status filter first (more selective)
  if (options.statusFilter && options.statusFilter.length > 0) {
    results = filterByStatus(results, options.statusFilter);
  }

  // Apply search query
  if (options.query) {
    results = searchPatients(results, options.query, options.caseSensitive);
  }

  const executionTimeMs = Date.now() - startTime;

  return {
    patients: results,
    totalMatches: results.length,
    searchQuery: options.query,
    statusFilter: options.statusFilter,
    executionTimeMs
  };
}

/**
 * Sorts patients by last consultation date (most recent first)
 * 
 * @param patients - List of patients to sort
 * @returns Sorted list of patients
 * 
 * Requirements:
 * - 1.4: Display patients in descending order by last consultation date
 */
export function sortByLastConsultation(
  patients: PatientListItem[]
): PatientListItem[] {
  return [...patients].sort((a, b) => 
    new Date(b.lastConsultation).getTime() - new Date(a.lastConsultation).getTime()
  );
}

/**
 * Paginates a list of patients
 * 
 * @param patients - List of patients to paginate
 * @param page - Page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Paginated subset of patients
 * 
 * Requirements:
 * - 1.5: Paginate results with 20 patients per page
 */
export function paginatePatients(
  patients: PatientListItem[],
  page: number = 1,
  limit: number = 20
): {
  patients: PatientListItem[];
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
} {
  const totalCount = patients.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPatients = patients.slice(startIndex, endIndex);

  return {
    patients: paginatedPatients,
    page,
    totalPages,
    totalCount,
    hasMore: page < totalPages
  };
}

/**
 * Debounce utility for search operations
 * Returns a debounced version of the provided function
 * 
 * @param func - Function to debounce
 * @param delayMs - Delay in milliseconds (default: 500ms)
 * @returns Debounced function
 * 
 * Requirements:
 * - 2.3: Display matching results within 500 milliseconds of the last keystroke
 */
export function debounceSearch<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number = 500
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Validates search query input
 * 
 * @param query - Search query to validate
 * @returns Validation result with error message if invalid
 */
export function validateSearchQuery(query: string): {
  valid: boolean;
  error?: string;
} {
  if (typeof query !== 'string') {
    return {
      valid: false,
      error: 'Search query must be a string'
    };
  }

  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Search query cannot be empty'
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'Search query cannot exceed 100 characters'
    };
  }

  return { valid: true };
}

/**
 * Highlights search matches in text (for UI display)
 * 
 * @param text - Text to highlight matches in
 * @param query - Search query to highlight
 * @param caseSensitive - Whether to perform case-sensitive matching
 * @returns Text with match positions
 */
export function highlightMatches(
  text: string,
  query: string,
  caseSensitive: boolean = false
): {
  text: string;
  matches: { start: number; end: number }[];
} {
  if (!query || query.trim().length === 0) {
    return { text, matches: [] };
  }

  const matches: { start: number; end: number }[] = [];
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query.trim() : query.trim().toLowerCase();

  let startIndex = 0;
  while (true) {
    const index = searchText.indexOf(searchQuery, startIndex);
    if (index === -1) break;

    matches.push({
      start: index,
      end: index + searchQuery.length
    });

    startIndex = index + searchQuery.length;
  }

  return { text, matches };
}
