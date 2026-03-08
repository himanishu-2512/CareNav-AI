// Prescription Parser - Parse prescription data into structured objects
// Validates: Requirements 22.1, 22.2

/**
 * Medication entry in a prescription
 */
export interface MedicationEntry {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number; // days
  specialInstructions?: string;
  foodTiming?: 'before food' | 'after food' | 'with food' | 'anytime';
}

/**
 * Structured prescription object
 */
export interface ParsedPrescription {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  uhid: string;
  doctorId: string;
  doctorName: string;
  date: string; // ISO timestamp
  medications: MedicationEntry[];
  episodeId?: string;
}

/**
 * Parse result with error handling
 */
export interface ParseResult {
  success: boolean;
  prescription?: ParsedPrescription;
  error?: string;
}

/**
 * Parse prescription data into a structured Prescription object
 * Validates all required fields and returns descriptive errors for malformed data
 * 
 * @param data - Raw prescription data (can be JSON string or object)
 * @returns ParseResult with parsed prescription or error message
 */
export function parsePrescription(data: string | any): ParseResult {
  try {
    // Parse JSON string if needed
    let prescriptionData: any;
    
    if (typeof data === 'string') {
      try {
        prescriptionData = JSON.parse(data);
      } catch (error) {
        return {
          success: false,
          error: 'Invalid JSON format: Unable to parse prescription data'
        };
      }
    } else if (typeof data === 'object' && data !== null) {
      prescriptionData = data;
    } else {
      return {
        success: false,
        error: 'Invalid data type: Prescription data must be a JSON string or object'
      };
    }

    // Validate required fields
    const requiredFields = [
      'prescriptionId',
      'patientId',
      'patientName',
      'uhid',
      'doctorId',
      'doctorName',
      'date',
      'medications'
    ];

    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (!(field in prescriptionData) || prescriptionData[field] === null || prescriptionData[field] === undefined) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Validate field types
    if (typeof prescriptionData.prescriptionId !== 'string' || prescriptionData.prescriptionId.trim() === '') {
      return {
        success: false,
        error: 'Invalid prescriptionId: Must be a non-empty string'
      };
    }

    if (typeof prescriptionData.patientId !== 'string' || prescriptionData.patientId.trim() === '') {
      return {
        success: false,
        error: 'Invalid patientId: Must be a non-empty string'
      };
    }

    if (typeof prescriptionData.patientName !== 'string' || prescriptionData.patientName.trim() === '') {
      return {
        success: false,
        error: 'Invalid patientName: Must be a non-empty string'
      };
    }

    if (typeof prescriptionData.uhid !== 'string' || prescriptionData.uhid.trim() === '') {
      return {
        success: false,
        error: 'Invalid uhid: Must be a non-empty string'
      };
    }

    if (typeof prescriptionData.doctorId !== 'string' || prescriptionData.doctorId.trim() === '') {
      return {
        success: false,
        error: 'Invalid doctorId: Must be a non-empty string'
      };
    }

    if (typeof prescriptionData.doctorName !== 'string' || prescriptionData.doctorName.trim() === '') {
      return {
        success: false,
        error: 'Invalid doctorName: Must be a non-empty string'
      };
    }

    if (typeof prescriptionData.date !== 'string' || prescriptionData.date.trim() === '') {
      return {
        success: false,
        error: 'Invalid date: Must be a non-empty string'
      };
    }

    // Validate date format (ISO 8601)
    const dateObj = new Date(prescriptionData.date);
    if (isNaN(dateObj.getTime())) {
      return {
        success: false,
        error: 'Invalid date format: Must be a valid ISO 8601 date string'
      };
    }

    // Validate medications array
    if (!Array.isArray(prescriptionData.medications)) {
      return {
        success: false,
        error: 'Invalid medications: Must be an array'
      };
    }

    if (prescriptionData.medications.length === 0) {
      return {
        success: false,
        error: 'Invalid medications: At least one medication is required'
      };
    }

    // Validate each medication
    const medications: MedicationEntry[] = [];
    for (let i = 0; i < prescriptionData.medications.length; i++) {
      const med = prescriptionData.medications[i];
      const medResult = validateMedication(med, i);
      
      if (!medResult.success) {
        return {
          success: false,
          error: medResult.error
        };
      }

      medications.push(medResult.medication!);
    }

    // Construct parsed prescription
    const prescription: ParsedPrescription = {
      prescriptionId: prescriptionData.prescriptionId.trim(),
      patientId: prescriptionData.patientId.trim(),
      patientName: prescriptionData.patientName.trim(),
      uhid: prescriptionData.uhid.trim(),
      doctorId: prescriptionData.doctorId.trim(),
      doctorName: prescriptionData.doctorName.trim(),
      date: prescriptionData.date.trim(),
      medications,
      episodeId: prescriptionData.episodeId ? String(prescriptionData.episodeId).trim() : undefined
    };

    return {
      success: true,
      prescription
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error parsing prescription: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validate a single medication entry
 */
function validateMedication(med: any, index: number): { success: boolean; medication?: MedicationEntry; error?: string } {
  if (typeof med !== 'object' || med === null) {
    return {
      success: false,
      error: `Invalid medication at index ${index}: Must be an object`
    };
  }

  // Validate required medication fields
  const requiredMedFields = ['medicineName', 'dosage', 'frequency', 'duration'];
  const missingMedFields: string[] = [];
  
  for (const field of requiredMedFields) {
    if (!(field in med) || med[field] === null || med[field] === undefined) {
      missingMedFields.push(field);
    }
  }

  if (missingMedFields.length > 0) {
    return {
      success: false,
      error: `Medication at index ${index} missing required fields: ${missingMedFields.join(', ')}`
    };
  }

  // Validate medication field types
  if (typeof med.medicineName !== 'string' || med.medicineName.trim() === '') {
    return {
      success: false,
      error: `Medication at index ${index}: medicineName must be a non-empty string`
    };
  }

  if (typeof med.dosage !== 'string' || med.dosage.trim() === '') {
    return {
      success: false,
      error: `Medication at index ${index}: dosage must be a non-empty string`
    };
  }

  if (typeof med.frequency !== 'string' || med.frequency.trim() === '') {
    return {
      success: false,
      error: `Medication at index ${index}: frequency must be a non-empty string`
    };
  }

  if (typeof med.duration !== 'number' || med.duration <= 0 || !Number.isInteger(med.duration)) {
    return {
      success: false,
      error: `Medication at index ${index}: duration must be a positive integer`
    };
  }

  // Validate optional fields
  if (med.specialInstructions !== undefined && typeof med.specialInstructions !== 'string') {
    return {
      success: false,
      error: `Medication at index ${index}: specialInstructions must be a string`
    };
  }

  if (med.foodTiming !== undefined) {
    const validFoodTimings = ['before food', 'after food', 'with food', 'anytime'];
    if (!validFoodTimings.includes(med.foodTiming)) {
      return {
        success: false,
        error: `Medication at index ${index}: foodTiming must be one of: ${validFoodTimings.join(', ')}`
      };
    }
  }

  // Construct validated medication
  const medication: MedicationEntry = {
    medicineName: med.medicineName.trim(),
    dosage: med.dosage.trim(),
    frequency: med.frequency.trim(),
    duration: med.duration,
    specialInstructions: med.specialInstructions ? med.specialInstructions.trim() : undefined,
    foodTiming: med.foodTiming || undefined
  };

  return {
    success: true,
    medication
  };
}

/**
 * Validate that a prescription object is well-formed
 * Useful for testing and validation
 */
export function isValidPrescription(prescription: any): boolean {
  const result = parsePrescription(prescription);
  return result.success;
}
