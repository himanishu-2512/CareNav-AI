// Enhanced frequency parsing logic for medication schedules
// Converts frequency strings to specific dose times with proper error handling
// Requirements: 23.1, 23.2, 23.3

export interface FrequencyParseResult {
  success: boolean;
  times?: string[];
  error?: string;
  isAsNeeded?: boolean;
}

/**
 * Parse frequency string and return structured result with dose times or error
 * @param frequency - Frequency string (e.g., "twice daily", "every 8 hours", "as needed")
 * @returns FrequencyParseResult with times array or error message
 * 
 * Requirement 23.1: Parse frequency specifications including "once daily", "twice daily", 
 * "three times daily", "every N hours", and "as needed"
 * 
 * Requirement 23.2: Convert frequency specifications into specific time intervals
 * 
 * Requirement 23.3: Return error message if frequency specification is invalid or ambiguous
 */
export function parseFrequency(frequency: string): FrequencyParseResult {
  if (!frequency || typeof frequency !== 'string') {
    return {
      success: false,
      error: 'Frequency must be a non-empty string'
    };
  }

  const normalizedFrequency = frequency.toLowerCase().trim();

  if (!normalizedFrequency) {
    return {
      success: false,
      error: 'Frequency cannot be empty'
    };
  }

  // Handle "as needed" / PRN medications (Requirement 23.1)
  if (isAsNeeded(normalizedFrequency)) {
    return {
      success: true,
      times: [],
      isAsNeeded: true
    };
  }

  // Standard frequency mappings (Requirement 23.1, 23.2)
  const frequencyMap: Record<string, string[]> = {
    'once daily': ['09:00'],
    'once a day': ['09:00'],
    'daily': ['09:00'],
    'once': ['09:00'],
    'twice daily': ['09:00', '21:00'],
    'twice a day': ['09:00', '21:00'],
    'two times daily': ['09:00', '21:00'],
    'bid': ['09:00', '21:00'], // Medical abbreviation
    'three times daily': ['09:00', '14:00', '21:00'],
    'three times a day': ['09:00', '14:00', '21:00'],
    'thrice daily': ['09:00', '14:00', '21:00'],
    'tid': ['09:00', '14:00', '21:00'], // Medical abbreviation
    'four times daily': ['09:00', '13:00', '17:00', '21:00'],
    'four times a day': ['09:00', '13:00', '17:00', '21:00'],
    'qid': ['09:00', '13:00', '17:00', '21:00'], // Medical abbreviation
    'at bedtime': ['22:00'],
    'before bed': ['22:00'],
    'in the morning': ['09:00'],
    'in the evening': ['21:00'],
    'morning and evening': ['09:00', '21:00'],
    'morning and night': ['09:00', '22:00']
  };

  // Check for exact match
  if (frequencyMap[normalizedFrequency]) {
    return {
      success: true,
      times: frequencyMap[normalizedFrequency]
    };
  }

  // Try to parse "every X hours" pattern (Requirement 23.1, 23.2)
  const everyHoursMatch = normalizedFrequency.match(/every\s+(\d+)\s+hours?/);
  if (everyHoursMatch) {
    const hours = parseInt(everyHoursMatch[1], 10);
    
    if (hours <= 0 || hours > 24) {
      return {
        success: false,
        error: `Invalid interval: "${hours} hours" must be between 1 and 24 hours`
      };
    }

    if (24 % hours !== 0) {
      return {
        success: false,
        error: `Ambiguous interval: "${hours} hours" does not divide evenly into 24 hours. Suggested intervals: 1, 2, 3, 4, 6, 8, 12, or 24 hours`
      };
    }

    try {
      const times = generateTimesForInterval(hours);
      return {
        success: true,
        times
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate times for interval'
      };
    }
  }

  // Try to parse "X times daily/a day" pattern
  const timesPerDayMatch = normalizedFrequency.match(/(\d+)\s+times?\s+(daily|a\s+day|per\s+day)/);
  if (timesPerDayMatch) {
    const timesPerDay = parseInt(timesPerDayMatch[1], 10);
    
    if (timesPerDay <= 0) {
      return {
        success: false,
        error: `Invalid frequency: "${timesPerDay} times daily" must be at least 1`
      };
    }

    if (timesPerDay > 6) {
      return {
        success: false,
        error: `Invalid frequency: "${timesPerDay} times daily" exceeds maximum of 6 times per day. Consider using "every X hours" instead`
      };
    }

    try {
      const times = generateTimesForFrequency(timesPerDay);
      return {
        success: true,
        times
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate times for frequency'
      };
    }
  }

  // No pattern matched - return error (Requirement 23.3)
  return {
    success: false,
    error: `Unrecognized frequency pattern: "${frequency}". Supported formats: "once daily", "twice daily", "three times daily", "every N hours", "as needed"`
  };
}

/**
 * Check if frequency indicates "as needed" / PRN medication
 * @param frequency - Normalized frequency string
 * @returns true if medication is as needed
 */
function isAsNeeded(frequency: string): boolean {
  const asNeededPatterns = [
    'as needed',
    'as required',
    'when needed',
    'prn',
    'p.r.n.',
    'if needed',
    'when required'
  ];

  return asNeededPatterns.some(pattern => frequency.includes(pattern));
}

/**
 * Generate dose times for a given interval in hours
 * @param intervalHours - Interval between doses in hours
 * @returns Array of times in HH:MM format
 */
function generateTimesForInterval(intervalHours: number): string[] {
  if (intervalHours <= 0 || intervalHours > 24) {
    throw new Error('Invalid interval: must be between 1 and 24 hours');
  }

  const times: string[] = [];
  const dosesPerDay = 24 / intervalHours;
  
  // Start at 9 AM for most intervals
  let startHour = 9;
  
  // Adjust start time for specific intervals
  if (intervalHours === 6) startHour = 6;  // 6am, 12pm, 6pm, 12am
  if (intervalHours === 4) startHour = 6;  // 6am, 10am, 2pm, 6pm, 10pm, 2am
  if (intervalHours === 8) startHour = 6;  // 6am, 2pm, 10pm
  
  for (let i = 0; i < dosesPerDay; i++) {
    const hour = (startHour + (i * intervalHours)) % 24;
    times.push(formatTime(hour, 0));
  }

  return times;
}

/**
 * Generate dose times for a given frequency per day
 * @param timesPerDay - Number of doses per day
 * @returns Array of times in HH:MM format
 */
function generateTimesForFrequency(timesPerDay: number): string[] {
  if (timesPerDay <= 0 || timesPerDay > 6) {
    throw new Error('Invalid frequency: must be between 1 and 6 times per day');
  }

  // Predefined schedules for common frequencies
  const schedules: Record<number, string[]> = {
    1: ['09:00'],
    2: ['09:00', '21:00'],
    3: ['09:00', '14:00', '21:00'],
    4: ['09:00', '13:00', '17:00', '21:00'],
    5: ['09:00', '12:00', '15:00', '18:00', '21:00'],
    6: ['09:00', '11:00', '13:00', '15:00', '17:00', '21:00']
  };

  return schedules[timesPerDay];
}

/**
 * Format hour and minute into HH:MM string
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @returns Time string in HH:MM format
 */
function formatTime(hour: number, minute: number): string {
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Validate if a time string is in HH:MM format
 * @param time - Time string to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Get time of day category for a given time
 * @param time - Time in HH:MM format
 * @returns Time of day category or error
 */
export function getTimeOfDay(time: string): 'morning' | 'afternoon' | 'evening' | 'night' | 'invalid' {
  if (!isValidTimeFormat(time)) {
    return 'invalid';
  }

  const hour = parseInt(time.split(':')[0], 10);

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculate stop date based on start date and duration
 * @param startDate - Start date (ISO string or Date object)
 * @param durationDays - Duration in days
 * @returns Stop date as ISO string
 */
export function calculateStopDate(startDate: Date | string, durationDays: number): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start date');
  }

  if (durationDays <= 0) {
    throw new Error('Duration must be positive');
  }

  const stopDate = new Date(start);
  stopDate.setDate(stopDate.getDate() + durationDays);

  return stopDate.toISOString();
}
