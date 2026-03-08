# Frequency Parser V2 Documentation

## Overview

The Frequency Parser V2 module provides robust parsing of medication frequency specifications into specific dose times. It implements Requirements 23.1, 23.2, and 23.3 from the Doctor Dashboard Patient Management specification.

## Requirements Validation

### Requirement 23.1: Parse Frequency Specifications
✅ **Implemented**: Parses "once daily", "twice daily", "three times daily", "every N hours", and "as needed"

The parser supports:
- Standard daily frequencies (once, twice, three times, four times)
- Medical abbreviations (BID, TID, QID)
- Interval-based patterns ("every N hours")
- As-needed/PRN medications
- Time-specific patterns (bedtime, morning, evening)

### Requirement 23.2: Convert to Specific Time Intervals
✅ **Implemented**: Converts frequency specifications into specific time intervals

Examples:
- "twice daily" → `["09:00", "21:00"]`
- "every 6 hours" → `["06:00", "12:00", "18:00", "00:00"]`
- "three times daily" → `["09:00", "14:00", "21:00"]`

### Requirement 23.3: Return Error Messages
✅ **Implemented**: Returns descriptive error messages for invalid or ambiguous frequencies

Error handling includes:
- Empty or invalid input validation
- Ambiguous intervals (e.g., "every 5 hours" doesn't divide evenly into 24)
- Out-of-range values (e.g., "every 25 hours")
- Unrecognized patterns with helpful suggestions

## API Reference

### `parseFrequency(frequency: string): FrequencyParseResult`

Main parsing function that converts frequency strings to dose times.

**Parameters:**
- `frequency` (string): The frequency specification to parse

**Returns:** `FrequencyParseResult` object with:
- `success` (boolean): Whether parsing succeeded
- `times` (string[]): Array of dose times in HH:MM format (24-hour)
- `error` (string): Error message if parsing failed
- `isAsNeeded` (boolean): True if medication is as-needed/PRN

**Example Usage:**

```typescript
import { parseFrequency } from './frequency-parser-v2';

// Standard frequency
const result1 = parseFrequency('twice daily');
// { success: true, times: ['09:00', '21:00'] }

// Interval-based
const result2 = parseFrequency('every 8 hours');
// { success: true, times: ['06:00', '14:00', '22:00'] }

// As needed
const result3 = parseFrequency('as needed');
// { success: true, times: [], isAsNeeded: true }

// Invalid input
const result4 = parseFrequency('every 5 hours');
// { success: false, error: 'Ambiguous interval: "5 hours" does not divide evenly into 24 hours...' }
```

### `isValidTimeFormat(time: string): boolean`

Validates if a time string is in HH:MM format.

**Parameters:**
- `time` (string): Time string to validate

**Returns:** `boolean` - true if valid HH:MM format

**Example:**
```typescript
isValidTimeFormat('09:00'); // true
isValidTimeFormat('9:00');  // false (missing leading zero)
isValidTimeFormat('24:00'); // false (hour out of range)
```

### `getTimeOfDay(time: string): string`

Categorizes a time into time-of-day periods.

**Parameters:**
- `time` (string): Time in HH:MM format

**Returns:** `'morning' | 'afternoon' | 'evening' | 'night' | 'invalid'`

**Time Categories:**
- Morning: 05:00 - 11:59
- Afternoon: 12:00 - 16:59
- Evening: 17:00 - 20:59
- Night: 21:00 - 04:59

**Example:**
```typescript
getTimeOfDay('09:00'); // 'morning'
getTimeOfDay('14:00'); // 'afternoon'
getTimeOfDay('21:00'); // 'night'
```

### `calculateStopDate(startDate: Date | string, durationDays: number): string`

Calculates the stop date for a medication based on start date and duration.

**Parameters:**
- `startDate` (Date | string): Start date as Date object or ISO string
- `durationDays` (number): Duration in days

**Returns:** `string` - Stop date as ISO string

**Example:**
```typescript
const stopDate = calculateStopDate('2024-01-15T09:00:00Z', 7);
// '2024-01-22T09:00:00.000Z'
```

## Supported Frequency Patterns

### 1. Standard Daily Frequencies

| Pattern | Times Generated | Example |
|---------|----------------|---------|
| once daily | 09:00 | "once daily", "daily", "once a day" |
| twice daily | 09:00, 21:00 | "twice daily", "BID", "two times daily" |
| three times daily | 09:00, 14:00, 21:00 | "three times daily", "TID", "thrice daily" |
| four times daily | 09:00, 13:00, 17:00, 21:00 | "four times daily", "QID" |

### 2. Interval-Based Patterns

| Pattern | Times Generated | Notes |
|---------|----------------|-------|
| every 4 hours | 06:00, 10:00, 14:00, 18:00, 22:00, 02:00 | 6 doses per day |
| every 6 hours | 06:00, 12:00, 18:00, 00:00 | 4 doses per day |
| every 8 hours | 06:00, 14:00, 22:00 | 3 doses per day |
| every 12 hours | 09:00, 21:00 | 2 doses per day |
| every 24 hours | 09:00 | 1 dose per day |

**Valid intervals:** 1, 2, 3, 4, 6, 8, 12, 24 hours (must divide evenly into 24)

### 3. As-Needed / PRN Medications

| Pattern | Result |
|---------|--------|
| as needed | No scheduled times, `isAsNeeded: true` |
| PRN | No scheduled times, `isAsNeeded: true` |
| when needed | No scheduled times, `isAsNeeded: true` |
| if needed | No scheduled times, `isAsNeeded: true` |

### 4. Time-Specific Patterns

| Pattern | Times Generated |
|---------|----------------|
| at bedtime | 22:00 |
| before bed | 22:00 |
| in the morning | 09:00 |
| in the evening | 21:00 |
| morning and evening | 09:00, 21:00 |
| morning and night | 09:00, 22:00 |

### 5. Numeric Patterns

| Pattern | Times Generated |
|---------|----------------|
| 1 times daily | 09:00 |
| 2 times daily | 09:00, 21:00 |
| 3 times daily | 09:00, 14:00, 21:00 |
| 4 times daily | 09:00, 13:00, 17:00, 21:00 |
| 5 times daily | 09:00, 12:00, 15:00, 18:00, 21:00 |
| 6 times daily | 09:00, 11:00, 13:00, 15:00, 17:00, 21:00 |

**Valid range:** 1-6 times per day

## Error Handling Examples

### Invalid Intervals
```typescript
parseFrequency('every 5 hours');
// Error: "Ambiguous interval: '5 hours' does not divide evenly into 24 hours. 
//         Suggested intervals: 1, 2, 3, 4, 6, 8, 12, or 24 hours"

parseFrequency('every 25 hours');
// Error: "Invalid interval: '25 hours' must be between 1 and 24 hours"
```

### Invalid Frequencies
```typescript
parseFrequency('7 times daily');
// Error: "Invalid frequency: '7 times daily' exceeds maximum of 6 times per day. 
//         Consider using 'every X hours' instead"

parseFrequency('0 times daily');
// Error: "Invalid frequency: '0 times daily' must be at least 1"
```

### Unrecognized Patterns
```typescript
parseFrequency('take with food');
// Error: "Unrecognized frequency pattern: 'take with food'. 
//         Supported formats: 'once daily', 'twice daily', 'three times daily', 
//         'every N hours', 'as needed'"
```

### Empty Input
```typescript
parseFrequency('');
// Error: "Frequency must be a non-empty string"

parseFrequency('   ');
// Error: "Frequency cannot be empty"
```

## Design Decisions

### Time Selection Strategy

**Standard frequencies** start at 09:00 (9 AM) as a reasonable morning time for most medications.

**Interval-based frequencies** adjust start times for optimal spacing:
- 4-hour and 6-hour intervals start at 06:00 (6 AM) for better distribution
- 8-hour intervals start at 06:00 for 6 AM, 2 PM, 10 PM schedule
- 12-hour intervals start at 09:00 for 9 AM, 9 PM schedule

### Interval Validation

Only intervals that divide evenly into 24 hours are accepted to avoid ambiguity:
- ✅ Valid: 1, 2, 3, 4, 6, 8, 12, 24 hours
- ❌ Invalid: 5, 7, 9, 10, 11, 13+ hours

This ensures consistent daily schedules without partial doses.

### Frequency Limits

Maximum of 6 times per day for numeric patterns to maintain reasonable dosing schedules. Higher frequencies should use interval-based patterns (e.g., "every 4 hours" for 6 doses).

### Case Insensitivity

All patterns are case-insensitive to handle variations in input:
- "BID", "bid", "Bid" all work
- "As Needed", "as needed", "AS NEEDED" all work

## Integration with Medication Schedules

The parser is designed to integrate with medication schedule generators:

```typescript
import { parseFrequency, calculateStopDate } from './frequency-parser-v2';

function createMedicationSchedule(
  medicationName: string,
  frequency: string,
  durationDays: number,
  startDate: Date
) {
  const parseResult = parseFrequency(frequency);
  
  if (!parseResult.success) {
    throw new Error(`Invalid frequency: ${parseResult.error}`);
  }
  
  if (parseResult.isAsNeeded) {
    return {
      medicationName,
      type: 'as-needed',
      startDate: startDate.toISOString(),
      stopDate: calculateStopDate(startDate, durationDays)
    };
  }
  
  return {
    medicationName,
    type: 'scheduled',
    times: parseResult.times,
    startDate: startDate.toISOString(),
    stopDate: calculateStopDate(startDate, durationDays)
  };
}
```

## Testing

Run the comprehensive test suite:

```bash
npx tsx lambda/shared/test-frequency-parser-v2.ts
```

The test suite validates:
- All supported frequency patterns (Requirement 23.1)
- Time interval generation accuracy (Requirement 23.2)
- Error handling for invalid inputs (Requirement 23.3)
- Time format validation
- Time of day categorization
- Stop date calculation

## Migration from V1

If migrating from the original `frequency-parser.ts`:

**Key Differences:**
1. **Structured return type**: V2 returns `FrequencyParseResult` object instead of array
2. **Explicit error handling**: V2 returns errors instead of defaulting silently
3. **As-needed support**: V2 explicitly handles PRN medications
4. **Stricter validation**: V2 rejects ambiguous intervals instead of approximating

**Migration Example:**
```typescript
// V1 (old)
const times = parseFrequencyToTimes('every 5 hours');
// Returns ['08:00'] with console warning

// V2 (new)
const result = parseFrequency('every 5 hours');
if (!result.success) {
  console.error(result.error);
  // Handle error appropriately
}
```

## Future Enhancements

Potential improvements for future versions:
- Custom start times (e.g., "every 8 hours starting at 7 AM")
- Day-specific schedules (e.g., "Monday, Wednesday, Friday")
- Meal-relative timing (e.g., "30 minutes before meals")
- Dose tapering schedules
- Timezone support for international use

## License

Part of the CareNav AI healthcare workflow system.
