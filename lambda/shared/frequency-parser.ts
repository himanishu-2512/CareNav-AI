// Frequency parsing logic for medication schedules
// Converts frequency strings to specific dose times in HH:MM format

/**
 * Parse frequency string and return array of dose times
 * @param frequency - Frequency string (e.g., "twice daily", "every 8 hours")
 * @returns Array of times in HH:MM format (24-hour)
 */
export function parseFrequencyToTimes(frequency: string): string[] {
  const normalizedFrequency = frequency.toLowerCase().trim();

  // Standard frequency mappings
  const frequencyMap: Record<string, string[]> = {
    'once daily': ['08:00'],
    'once a day': ['08:00'],
    'daily': ['08:00'],
    'twice daily': ['08:00', '20:00'],
    'twice a day': ['08:00', '20:00'],
    'two times daily': ['08:00', '20:00'],
    'three times daily': ['08:00', '14:00', '20:00'],
    'three times a day': ['08:00', '14:00', '20:00'],
    'thrice daily': ['08:00', '14:00', '20:00'],
    'four times daily': ['08:00', '12:00', '16:00', '20:00'],
    'four times a day': ['08:00', '12:00', '16:00', '20:00'],
    'every 4 hours': ['06:00', '10:00', '14:00', '18:00', '22:00', '02:00'],
    'every 6 hours': ['06:00', '12:00', '18:00', '00:00'],
    'every 8 hours': ['08:00', '16:00', '00:00'],
    'every 12 hours': ['08:00', '20:00'],
    'every 24 hours': ['08:00'],
    'at bedtime': ['22:00'],
    'before bed': ['22:00'],
    'in the morning': ['08:00'],
    'in the evening': ['20:00'],
    'morning and evening': ['08:00', '20:00'],
    'morning and night': ['08:00', '22:00']
  };

  // Check for exact match
  if (frequencyMap[normalizedFrequency]) {
    return frequencyMap[normalizedFrequency];
  }

  // Try to parse "every X hours" pattern
  const everyHoursMatch = normalizedFrequency.match(/every\s+(\d+)\s+hours?/);
  if (everyHoursMatch) {
    const hours = parseInt(everyHoursMatch[1], 10);
    return generateTimesForInterval(hours);
  }

  // Try to parse "X times daily/a day" pattern
  const timesPerDayMatch = normalizedFrequency.match(/(\d+)\s+times?\s+(daily|a\s+day|per\s+day)/);
  if (timesPerDayMatch) {
    const timesPerDay = parseInt(timesPerDayMatch[1], 10);
    return generateTimesForFrequency(timesPerDay);
  }

  // Default fallback: once daily
  console.warn(`Unknown frequency pattern: "${frequency}". Defaulting to once daily.`);
  return ['08:00'];
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
  const dosesPerDay = Math.floor(24 / intervalHours);
  
  // Start at a reasonable time based on interval
  let startHour = 8; // Default start at 8 AM
  if (intervalHours === 6) startHour = 6;
  if (intervalHours === 4) startHour = 6;
  
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
    1: ['08:00'],
    2: ['08:00', '20:00'],
    3: ['08:00', '14:00', '20:00'],
    4: ['08:00', '12:00', '16:00', '20:00'],
    5: ['08:00', '11:00', '14:00', '17:00', '20:00'],
    6: ['08:00', '10:00', '12:00', '14:00', '16:00', '20:00']
  };

  return schedules[timesPerDay] || schedules[1];
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
 * Calculate stop date based on start date and duration
 * @param startDate - Start date (ISO string or Date object)
 * @param duration - Duration string (e.g., "7 days", "2 weeks", "1 month")
 * @returns Stop date as ISO string
 */
export function calculateStopDate(startDate: Date | string, duration: string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const normalizedDuration = duration.toLowerCase().trim();

  // Parse duration patterns
  const daysMatch = normalizedDuration.match(/(\d+)\s*days?/);
  const weeksMatch = normalizedDuration.match(/(\d+)\s*weeks?/);
  const monthsMatch = normalizedDuration.match(/(\d+)\s*months?/);

  let daysToAdd = 0;

  if (daysMatch) {
    daysToAdd = parseInt(daysMatch[1], 10);
  } else if (weeksMatch) {
    daysToAdd = parseInt(weeksMatch[1], 10) * 7;
  } else if (monthsMatch) {
    daysToAdd = parseInt(monthsMatch[1], 10) * 30; // Approximate month as 30 days
  } else {
    console.warn(`Unknown duration pattern: "${duration}". Defaulting to 7 days.`);
    daysToAdd = 7;
  }

  const stopDate = new Date(start);
  stopDate.setDate(stopDate.getDate() + daysToAdd);

  return stopDate.toISOString();
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
 * @returns Time of day category
 */
export function getTimeOfDay(time: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (!isValidTimeFormat(time)) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const hour = parseInt(time.split(':')[0], 10);

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
