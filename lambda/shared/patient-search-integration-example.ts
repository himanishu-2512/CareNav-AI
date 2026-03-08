/**
 * Integration Example: Patient Search with Doctor Handler
 * 
 * This example demonstrates how to integrate the patient search module
 * with the doctor-handler Lambda for efficient patient lookup.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDoctorPatients } from './patient-db';
import {
  searchAndFilterPatients,
  sortByLastConsultation,
  paginatePatients,
  validateSearchQuery,
  PatientSearchOptions
} from './patient-search';

/**
 * Enhanced patient search handler with integrated search and filtering
 * 
 * This replaces the basic search implementation in doctor-handler with
 * the optimized patient-search module.
 */
export async function handleEnhancedPatientSearch(
  event: APIGatewayProxyEvent,
  doctorId: string
): Promise<APIGatewayProxyResult> {
  try {
    const queryParams = event.queryStringParameters || {};
    
    // Extract search parameters
    const searchQuery = queryParams.q?.trim();
    const statusParam = queryParams.status;
    const page = parseInt(queryParams.page || '1', 10);
    const limit = parseInt(queryParams.limit || '20', 10);
    
    // Validate search query if provided
    if (searchQuery) {
      const validation = validateSearchQuery(searchQuery);
      if (!validation.valid) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: validation.error
          })
        };
      }
    }
    
    // Parse status filter
    let statusFilter: ('ongoing' | 'past')[] | undefined;
    if (statusParam) {
      const statuses = statusParam.split(',');
      const validStatuses = ['ongoing', 'past'];
      const invalidStatuses = statuses.filter(s => !validStatuses.includes(s));
      
      if (invalidStatuses.length > 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: `Invalid status values: ${invalidStatuses.join(', ')}`
          })
        };
      }
      
      statusFilter = statuses as ('ongoing' | 'past')[];
    }
    
    // Get all patients for the doctor from database
    const allPatientsResult = await getDoctorPatients(doctorId);
    
    // Apply search and filter using patient-search module
    const searchOptions: PatientSearchOptions = {
      query: searchQuery,
      statusFilter,
      caseSensitive: false // Always case-insensitive for user-friendly search
    };
    
    const searchResult = searchAndFilterPatients(
      allPatientsResult.patients,
      searchOptions
    );
    
    // Sort by last consultation (most recent first)
    const sortedPatients = sortByLastConsultation(searchResult.patients);
    
    // Apply pagination
    const paginatedResult = paginatePatients(sortedPatients, page, limit);
    
    // Return response with search metadata
    return {
      statusCode: 200,
      body: JSON.stringify({
        patients: paginatedResult.patients,
        totalCount: paginatedResult.totalCount,
        page: paginatedResult.page,
        totalPages: paginatedResult.totalPages,
        hasMore: paginatedResult.hasMore,
        searchQuery: searchResult.searchQuery,
        statusFilter: searchResult.statusFilter,
        executionTimeMs: searchResult.executionTimeMs,
        message: paginatedResult.patients.length === 0 
          ? 'No patients found matching your search criteria'
          : undefined
      })
    };
  } catch (error: any) {
    console.error('Error in enhanced patient search:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to search patients',
        details: error.message
      })
    };
  }
}

/**
 * Example: Frontend debounced search implementation
 * 
 * This shows how to use the debounceSearch utility in a React component
 * or frontend application.
 */
export function frontendSearchExample() {
  // This would be in a React component or similar
  const exampleCode = `
import { debounceSearch } from './patient-search';
import { useState, useCallback, useEffect } from 'react';

function PatientSearchComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Create debounced search function
  const debouncedSearch = useCallback(
    debounceSearch(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(
          \`/api/doctor/patients/search?q=\${encodeURIComponent(query)}\`
        );
        const data = await response.json();
        setResults(data.patients);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );
  
  // Trigger search on query change
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);
  
  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search patients by name or UHID..."
      />
      {loading && <div>Searching...</div>}
      <ul>
        {results.map(patient => (
          <li key={patient.patientId}>
            {patient.name} ({patient.uhid})
          </li>
        ))}
      </ul>
    </div>
  );
}
  `;
  
  return exampleCode;
}

/**
 * Example: Complete search flow with all features
 */
export async function completeSearchFlowExample(
  doctorId: string,
  searchQuery: string,
  statusFilter: ('ongoing' | 'past')[],
  page: number = 1,
  limit: number = 20
) {
  console.log('=== Complete Patient Search Flow ===');
  console.log(`Doctor ID: ${doctorId}`);
  console.log(`Search Query: "${searchQuery}"`);
  console.log(`Status Filter: ${statusFilter.join(', ')}`);
  console.log(`Page: ${page}, Limit: ${limit}`);
  console.log();
  
  // Step 1: Validate search query
  console.log('Step 1: Validating search query...');
  const validation = validateSearchQuery(searchQuery);
  if (!validation.valid) {
    console.error(`Validation failed: ${validation.error}`);
    return;
  }
  console.log('✓ Query is valid');
  console.log();
  
  // Step 2: Fetch all patients from database
  console.log('Step 2: Fetching patients from database...');
  const allPatients = await getDoctorPatients(doctorId);
  console.log(`✓ Retrieved ${allPatients.totalCount} patients`);
  console.log();
  
  // Step 3: Apply search and filter
  console.log('Step 3: Applying search and filter...');
  const searchResult = searchAndFilterPatients(allPatients.patients, {
    query: searchQuery,
    statusFilter
  });
  console.log(`✓ Found ${searchResult.totalMatches} matching patients`);
  console.log(`✓ Search completed in ${searchResult.executionTimeMs}ms`);
  console.log();
  
  // Step 4: Sort by last consultation
  console.log('Step 4: Sorting by last consultation date...');
  const sorted = sortByLastConsultation(searchResult.patients);
  console.log(`✓ Patients sorted (most recent first)`);
  console.log();
  
  // Step 5: Paginate results
  console.log('Step 5: Paginating results...');
  const paginated = paginatePatients(sorted, page, limit);
  console.log(`✓ Page ${paginated.page} of ${paginated.totalPages}`);
  console.log(`✓ Showing ${paginated.patients.length} patients on this page`);
  console.log();
  
  // Step 6: Display results
  console.log('Step 6: Results:');
  console.log('-'.repeat(60));
  if (paginated.patients.length === 0) {
    console.log('No patients found matching your search criteria');
  } else {
    paginated.patients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.name}`);
      console.log(`   UHID: ${patient.uhid}`);
      console.log(`   Status: ${patient.treatmentStatus}`);
      console.log(`   Last Consultation: ${patient.lastConsultation}`);
      console.log();
    });
  }
  
  return {
    patients: paginated.patients,
    totalCount: paginated.totalCount,
    page: paginated.page,
    totalPages: paginated.totalPages,
    hasMore: paginated.hasMore,
    executionTimeMs: searchResult.executionTimeMs
  };
}

/**
 * Example: Performance monitoring
 */
export function performanceMonitoringExample() {
  const exampleCode = `
// Monitor search performance and alert if slow
async function monitoredSearch(patients, query, statusFilter) {
  const result = searchAndFilterPatients(patients, {
    query,
    statusFilter
  });
  
  // Log performance metrics
  console.log(\`Search completed in \${result.executionTimeMs}ms\`);
  
  // Alert if search is slow (> 500ms requirement)
  if (result.executionTimeMs > 500) {
    console.warn('Search exceeded 500ms threshold!');
    // Send alert to monitoring system
    await sendAlert({
      type: 'SLOW_SEARCH',
      executionTime: result.executionTimeMs,
      patientCount: patients.length,
      query
    });
  }
  
  return result;
}
  `;
  
  return exampleCode;
}

/**
 * Example: Error handling best practices
 */
export function errorHandlingExample() {
  const exampleCode = `
async function robustPatientSearch(doctorId, searchQuery, statusFilter) {
  try {
    // Validate inputs
    if (!doctorId) {
      throw new Error('Doctor ID is required');
    }
    
    if (searchQuery) {
      const validation = validateSearchQuery(searchQuery);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          code: 'INVALID_QUERY'
        };
      }
    }
    
    // Fetch patients with timeout
    const patients = await Promise.race([
      getDoctorPatients(doctorId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]);
    
    // Perform search
    const result = searchAndFilterPatients(patients.patients, {
      query: searchQuery,
      statusFilter
    });
    
    // Check performance
    if (result.executionTimeMs > 500) {
      console.warn(\`Search took \${result.executionTimeMs}ms\`);
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Search failed:', error);
    return {
      success: false,
      error: error.message,
      code: 'SEARCH_FAILED'
    };
  }
}
  `;
  
  return exampleCode;
}

// Export all examples
export default {
  handleEnhancedPatientSearch,
  frontendSearchExample,
  completeSearchFlowExample,
  performanceMonitoringExample,
  errorHandlingExample
};
