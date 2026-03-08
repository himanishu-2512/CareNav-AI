// Prescription Parser and Printer Usage Examples
// Demonstrates integration with prescription handler and various use cases

import { 
  parsePrescription, 
  ParsedPrescription,
  isValidPrescription 
} from './prescription-parser';
import { 
  printPrescription,
  printPrescriptionForMedicalShop,
  printPrescriptionPlainText,
  printPrescriptionJSON,
  printPrescriptionForPatient,
  getMedicationSummary,
  getPrescriptionSummary
} from './prescription-printer';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║     PRESCRIPTION PARSER & PRINTER USAGE EXAMPLES              ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log();

// ============================================================================
// Example 1: Doctor Dashboard - Create and Validate Prescription
// ============================================================================
console.log('Example 1: Doctor Dashboard - Create and Validate Prescription');
console.log('─'.repeat(70));

function createPrescriptionInDoctorDashboard() {
  // Simulated form data from doctor
  const formData = {
    prescriptionId: 'rx-2024-001',
    patientId: 'patient-12345',
    patientName: 'Alice Smith',
    uhid: 'UHID-2024-12345',
    doctorId: 'doctor-789',
    doctorName: 'Dr. Emily Chen',
    date: new Date().toISOString(),
    episodeId: 'episode-456',
    medications: [
      {
        medicineName: 'Azithromycin',
        dosage: '500mg',
        frequency: 'once daily',
        duration: 3,
        foodTiming: 'before food',
        specialInstructions: 'Take on empty stomach, 1 hour before meals'
      },
      {
        medicineName: 'Cetirizine',
        dosage: '10mg',
        frequency: 'once daily',
        duration: 7,
        foodTiming: 'anytime',
        specialInstructions: 'May cause drowsiness'
      }
    ]
  };

  // Validate prescription data before saving
  const result = parsePrescription(formData);
  
  if (!result.success) {
    console.log('❌ Validation failed:', result.error);
    return null;
  }

  console.log('✅ Prescription validated successfully');
  console.log('   Prescription ID:', result.prescription!.prescriptionId);
  console.log('   Patient:', result.prescription!.patientName);
  console.log('   Medications:', result.prescription!.medications.length);
  console.log();
  
  // Display formatted prescription
  console.log('Formatted prescription for doctor review:');
  console.log(printPrescription(result.prescription!));
  
  return result.prescription;
}

const doctorPrescription = createPrescriptionInDoctorDashboard();
console.log();

// ============================================================================
// Example 2: Patient App - Display Prescription
// ============================================================================
console.log('Example 2: Patient App - Display Prescription');
console.log('─'.repeat(70));

function displayPrescriptionInPatientApp(prescription: ParsedPrescription) {
  console.log('Patient-friendly format:');
  console.log(printPrescriptionForPatient(prescription));
  console.log();
  
  // Also show summary
  console.log('Quick summary:', getPrescriptionSummary(prescription));
  console.log();
}

if (doctorPrescription) {
  displayPrescriptionInPatientApp(doctorPrescription);
}

// ============================================================================
// Example 3: Medical Shop - Verify and Display Prescription
// ============================================================================
console.log('Example 3: Medical Shop - Verify and Display Prescription');
console.log('─'.repeat(70));

function verifyPrescriptionAtMedicalShop(prescriptionData: any) {
  // Parse prescription from QR code or API
  const result = parsePrescription(prescriptionData);
  
  if (!result.success) {
    console.log('❌ Invalid prescription:', result.error);
    return;
  }

  console.log('✅ Prescription verified');
  console.log();
  console.log('Pharmacy display format:');
  console.log(printPrescriptionForMedicalShop(result.prescription!));
  console.log();
  
  // Show individual medication summaries for quick reference
  console.log('Medication checklist:');
  result.prescription!.medications.forEach((med, index) => {
    console.log(`  ${index + 1}. ${getMedicationSummary(med)}`);
  });
  console.log();
}

if (doctorPrescription) {
  verifyPrescriptionAtMedicalShop(doctorPrescription);
}

// ============================================================================
// Example 4: SMS/Email - Send Prescription
// ============================================================================
console.log('Example 4: SMS/Email - Send Prescription');
console.log('─'.repeat(70));

function sendPrescriptionViaSMS(prescription: ParsedPrescription, phoneNumber: string) {
  // Format for SMS (plain text, compact)
  const smsText = printPrescriptionPlainText(prescription);
  
  console.log(`Sending to ${phoneNumber}:`);
  console.log();
  console.log(smsText);
  console.log();
  console.log('✅ SMS sent successfully');
  console.log();
}

if (doctorPrescription) {
  sendPrescriptionViaSMS(doctorPrescription, '+91-9876543210');
}

// ============================================================================
// Example 5: API Response - JSON Format
// ============================================================================
console.log('Example 5: API Response - JSON Format');
console.log('─'.repeat(70));

function sendPrescriptionAPIResponse(prescription: ParsedPrescription) {
  // Format as JSON for API response
  const jsonResponse = printPrescriptionJSON(prescription, true);
  
  console.log('API Response:');
  console.log(jsonResponse);
  console.log();
}

if (doctorPrescription) {
  sendPrescriptionAPIResponse(doctorPrescription);
}

// ============================================================================
// Example 6: Error Handling - Invalid Prescriptions
// ============================================================================
console.log('Example 6: Error Handling - Invalid Prescriptions');
console.log('─'.repeat(70));

function demonstrateErrorHandling() {
  const invalidCases = [
    {
      name: 'Missing patient name',
      data: {
        prescriptionId: 'rx-001',
        patientId: 'patient-001',
        // patientName missing
        uhid: 'UHID-001',
        doctorId: 'doctor-001',
        doctorName: 'Dr. Smith',
        date: new Date().toISOString(),
        medications: []
      }
    },
    {
      name: 'Empty medications array',
      data: {
        prescriptionId: 'rx-002',
        patientId: 'patient-002',
        patientName: 'Bob Jones',
        uhid: 'UHID-002',
        doctorId: 'doctor-002',
        doctorName: 'Dr. Johnson',
        date: new Date().toISOString(),
        medications: [] // Empty array
      }
    },
    {
      name: 'Invalid medication duration',
      data: {
        prescriptionId: 'rx-003',
        patientId: 'patient-003',
        patientName: 'Carol White',
        uhid: 'UHID-003',
        doctorId: 'doctor-003',
        doctorName: 'Dr. Brown',
        date: new Date().toISOString(),
        medications: [
          {
            medicineName: 'Aspirin',
            dosage: '100mg',
            frequency: 'once daily',
            duration: -5 // Invalid: negative
          }
        ]
      }
    },
    {
      name: 'Invalid food timing',
      data: {
        prescriptionId: 'rx-004',
        patientId: 'patient-004',
        patientName: 'David Green',
        uhid: 'UHID-004',
        doctorId: 'doctor-004',
        doctorName: 'Dr. Davis',
        date: new Date().toISOString(),
        medications: [
          {
            medicineName: 'Paracetamol',
            dosage: '500mg',
            frequency: 'twice daily',
            duration: 5,
            foodTiming: 'invalid-timing' // Invalid value
          }
        ]
      }
    }
  ];

  invalidCases.forEach(testCase => {
    console.log(`Testing: ${testCase.name}`);
    const result = parsePrescription(testCase.data);
    console.log(`  Result: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    if (!result.success) {
      console.log(`  Error: ${result.error}`);
    }
    console.log();
  });
}

demonstrateErrorHandling();

// ============================================================================
// Example 7: Round-Trip Validation
// ============================================================================
console.log('Example 7: Round-Trip Validation');
console.log('─'.repeat(70));

function demonstrateRoundTrip(prescription: ParsedPrescription) {
  console.log('Testing round-trip property: parse → print → parse');
  console.log();
  
  // Original
  const original = prescription;
  console.log('1. Original prescription ID:', original.prescriptionId);
  
  // Print as JSON
  const printed = printPrescriptionJSON(original);
  console.log('2. Printed as JSON (length:', printed.length, 'chars)');
  
  // Parse again
  const reparsed = parsePrescription(printed);
  console.log('3. Reparsed:', reparsed.success ? '✅ SUCCESS' : '❌ FAILED');
  
  if (reparsed.success) {
    // Compare
    const originalJSON = JSON.stringify(original);
    const reparsedJSON = JSON.stringify(reparsed.prescription);
    const isEquivalent = originalJSON === reparsedJSON;
    
    console.log('4. Data equivalence:', isEquivalent ? '✅ PASS' : '❌ FAIL');
    
    if (isEquivalent) {
      console.log('✅ Round-trip property validated successfully');
    }
  }
  console.log();
}

if (doctorPrescription) {
  demonstrateRoundTrip(doctorPrescription);
}

// ============================================================================
// Example 8: Batch Processing
// ============================================================================
console.log('Example 8: Batch Processing Multiple Prescriptions');
console.log('─'.repeat(70));

function processBatchPrescriptions() {
  const prescriptions = [
    {
      prescriptionId: 'rx-batch-001',
      patientId: 'patient-001',
      patientName: 'Patient One',
      uhid: 'UHID-001',
      doctorId: 'doctor-001',
      doctorName: 'Dr. One',
      date: new Date().toISOString(),
      medications: [
        {
          medicineName: 'Medicine A',
          dosage: '100mg',
          frequency: 'once daily',
          duration: 7
        }
      ]
    },
    {
      prescriptionId: 'rx-batch-002',
      patientId: 'patient-002',
      patientName: 'Patient Two',
      uhid: 'UHID-002',
      doctorId: 'doctor-002',
      doctorName: 'Dr. Two',
      date: new Date().toISOString(),
      medications: [
        {
          medicineName: 'Medicine B',
          dosage: '200mg',
          frequency: 'twice daily',
          duration: 5
        }
      ]
    },
    {
      // Invalid prescription (missing medications)
      prescriptionId: 'rx-batch-003',
      patientId: 'patient-003',
      patientName: 'Patient Three',
      uhid: 'UHID-003',
      doctorId: 'doctor-003',
      doctorName: 'Dr. Three',
      date: new Date().toISOString(),
      medications: []
    }
  ];

  console.log(`Processing ${prescriptions.length} prescriptions...`);
  console.log();

  let successCount = 0;
  let failureCount = 0;

  prescriptions.forEach((data, index) => {
    const result = parsePrescription(data);
    if (result.success) {
      successCount++;
      console.log(`✅ Prescription ${index + 1}: ${result.prescription!.prescriptionId} - VALID`);
    } else {
      failureCount++;
      console.log(`❌ Prescription ${index + 1}: ${data.prescriptionId} - INVALID`);
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log();
  console.log(`Summary: ${successCount} valid, ${failureCount} invalid`);
  console.log();
}

processBatchPrescriptions();

// ============================================================================
// Example 9: Integration with Prescription Handler Lambda
// ============================================================================
console.log('Example 9: Integration with Prescription Handler Lambda');
console.log('─'.repeat(70));

function simulatePrescriptionHandlerIntegration() {
  console.log('Simulating prescription handler Lambda integration...');
  console.log();

  // Simulated API request body
  const requestBody = {
    episodeId: 'episode-999',
    patientId: 'patient-999',
    doctorId: 'doctor-999',
    doctorName: 'Dr. Integration Test',
    medications: [
      {
        medicineName: 'Test Medicine',
        dosage: '250mg',
        frequency: 'three times daily',
        duration: 10,
        foodTiming: 'after food',
        specialInstructions: 'Test instructions'
      }
    ]
  };

  // Add required fields
  const prescriptionData = {
    prescriptionId: 'rx-integration-test',
    patientName: 'Test Patient',
    uhid: 'UHID-TEST-999',
    date: new Date().toISOString(),
    ...requestBody
  };

  // Validate
  const result = parsePrescription(prescriptionData);

  if (!result.success) {
    console.log('❌ Validation failed:', result.error);
    console.log('Would return 400 Bad Request');
    return;
  }

  console.log('✅ Prescription validated');
  console.log('Would save to DynamoDB and return 201 Created');
  console.log();
  console.log('Response body:');
  console.log(printPrescriptionJSON(result.prescription!, true));
}

simulatePrescriptionHandlerIntegration();

console.log();
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                    EXAMPLES COMPLETED                         ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
