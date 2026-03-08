# Prescription Parser and Pretty Printer

Comprehensive modules for parsing and formatting prescription data according to medical prescription standards.

## Overview

This module provides two main components:

1. **Prescription Parser** (`prescription-parser.ts`): Parses prescription data into structured objects with comprehensive validation
2. **Prescription Pretty Printer** (`prescription-printer.ts`): Formats prescriptions for various display contexts

## Features

### Parser Features
- ✅ Parse JSON strings or objects into structured prescription data
- ✅ Comprehensive validation of all required fields
- ✅ Descriptive error messages for malformed data
- ✅ Type-safe TypeScript interfaces
- ✅ Support for optional fields (episodeId, specialInstructions, foodTiming)
- ✅ Validation of medication entries (dosage, frequency, duration)

### Printer Features
- ✅ Multiple output formats (standard, medical shop, patient app, plain text, JSON)
- ✅ Medical prescription standard formatting
- ✅ Customizable print options
- ✅ User-friendly displays with emojis for patient app
- ✅ Compact format for pharmacy/medical shop
- ✅ Round-trip property: parse(print(parse(data))) ≡ parse(data)

## Requirements Validated

- **Req 22.1**: Parse prescription data into structured Prescription object ✓
- **Req 22.2**: Return descriptive error message if prescription data is malformed ✓
- **Req 22.4**: Format prescriptions according to medical prescription standards ✓
- **Req 22.5**: Round-trip property (parse → print → parse) ✓

## Installation

The modules are located in `lambda/shared/`:
- `prescription-parser.ts`
- `prescription-printer.ts`

## Usage

### Basic Parsing

```typescript
import { parsePrescription } from './prescription-parser';

const prescriptionData = {
  prescriptionId: 'rx-12345',
  patientId: 'patient-001',
  patientName: 'John Doe',
  uhid: 'UHID-2024-001',
  doctorId: 'doctor-001',
  doctorName: 'Dr. Sarah Johnson',
  date: '2024-01-15T10:30:00Z',
  medications: [
    {
      medicineName: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'three times daily',
      duration: 7,
      foodTiming: 'after food',
      specialInstructions: 'Complete the full course'
    }
  ]
};

const result = parsePrescription(prescriptionData);

if (result.success) {
  console.log('Parsed prescription:', result.prescription);
} else {
  console.error('Parse error:', result.error);
}
```

### Parsing from JSON String

```typescript
const jsonString = JSON.stringify(prescriptionData);
const result = parsePrescription(jsonString);
```

### Validation Helper

```typescript
import { isValidPrescription } from './prescription-parser';

if (isValidPrescription(data)) {
  console.log('Prescription is valid');
}
```

### Standard Formatting

```typescript
import { printPrescription } from './prescription-printer';

const formatted = printPrescription(prescription);
console.log(formatted);
```

Output:
```
                                  PRESCRIPTION
================================================================================

Date: January 15, 2024
Doctor: Dr. Sarah Johnson
Doctor ID: doctor-001

Patient: John Doe
UHID: UHID-2024-001
Patient ID: patient-001

--------------------------------------------------------------------------------

MEDICATIONS:

1. Amoxicillin
   Dosage: 500mg
   Frequency: three times daily
   Duration: 7 days
   Timing: After food
   Instructions: Complete the full course

--------------------------------------------------------------------------------

Prescription ID: rx-12345
Valid for: 30 days from date of issue

                   This is a computer-generated prescription
```

### Medical Shop Format

```typescript
import { printPrescriptionForMedicalShop } from './prescription-printer';

const formatted = printPrescriptionForMedicalShop(prescription);
console.log(formatted);
```

Output:
```
═══════════════════════════════════════════════════════════════
                         PRESCRIPTION
═══════════════════════════════════════════════════════════════

Date: January 15, 2024          Rx ID: rx-12345
Patient: John Doe (UHID: UHID-2024-001)
Doctor: Dr. Sarah Johnson

───────────────────────────────────────────────────────────────
MEDICATIONS:
───────────────────────────────────────────────────────────────

1. AMOXICILLIN
   500mg | three times daily | 7 days
   Take: After food
   Note: Complete the full course

═══════════════════════════════════════════════════════════════
```

### Patient App Format

```typescript
import { printPrescriptionForPatient } from './prescription-printer';

const formatted = printPrescriptionForPatient(prescription);
console.log(formatted);
```

Output:
```
╔═══════════════════════════════════════════════════════════════╗
║                       Your Prescription                       ║
╚═══════════════════════════════════════════════════════════════╝

📅 Date: January 15, 2024
👨‍⚕️ Doctor: Dr. Sarah Johnson

💊 Your Medications:

1. Amoxicillin
   • Take: 500mg
   • When: three times daily
   • For: 7 days
   • 🍽️ After food
   ⚠️  Complete the full course

─────────────────────────────────────────────────────────────
Prescription ID: rx-12345
Valid for 30 days from date of issue
```

### Plain Text Format

```typescript
import { printPrescriptionPlainText } from './prescription-printer';

const formatted = printPrescriptionPlainText(prescription);
console.log(formatted);
```

Output:
```
PRESCRIPTION - January 15, 2024
Patient: John Doe (UHID-2024-001)
Doctor: Dr. Sarah Johnson

Medications:
1. Amoxicillin - 500mg - three times daily - 7 days - after food
   Complete the full course

Prescription ID: rx-12345
```

### JSON Format

```typescript
import { printPrescriptionJSON } from './prescription-printer';

// Pretty printed
const formatted = printPrescriptionJSON(prescription, true);

// Compact
const compact = printPrescriptionJSON(prescription, false);
```

### Custom Print Options

```typescript
const formatted = printPrescription(prescription, {
  includeHeader: true,
  includeFooter: true,
  includeValidityPeriod: true,
  validityDays: 60,
  lineWidth: 100
});
```

### Helper Functions

```typescript
import { 
  getMedicationSummary, 
  getPrescriptionSummary,
  getMedicationCount 
} from './prescription-printer';

// Get one-line medication summary
const medSummary = getMedicationSummary(medication);
// "Amoxicillin - 500mg - three times daily - 7 days - after food"

// Get prescription summary
const rxSummary = getPrescriptionSummary(prescription);
// "Prescription by Dr. Sarah Johnson on January 15, 2024 - 2 medications"

// Get medication count
const count = getMedicationCount(prescription);
// 2
```

## Data Structures

### ParsedPrescription

```typescript
interface ParsedPrescription {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  uhid: string;
  doctorId: string;
  doctorName: string;
  date: string; // ISO 8601 timestamp
  medications: MedicationEntry[];
  episodeId?: string; // Optional
}
```

### MedicationEntry

```typescript
interface MedicationEntry {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number; // days (positive integer)
  specialInstructions?: string; // Optional
  foodTiming?: 'before food' | 'after food' | 'with food' | 'anytime'; // Optional
}
```

### ParseResult

```typescript
interface ParseResult {
  success: boolean;
  prescription?: ParsedPrescription;
  error?: string;
}
```

## Validation Rules

### Required Fields
- `prescriptionId`: Non-empty string
- `patientId`: Non-empty string
- `patientName`: Non-empty string
- `uhid`: Non-empty string
- `doctorId`: Non-empty string
- `doctorName`: Non-empty string
- `date`: Valid ISO 8601 date string
- `medications`: Non-empty array

### Medication Validation
- `medicineName`: Non-empty string
- `dosage`: Non-empty string
- `frequency`: Non-empty string
- `duration`: Positive integer (days)
- `specialInstructions`: String (optional)
- `foodTiming`: One of ['before food', 'after food', 'with food', 'anytime'] (optional)

### Optional Fields
- `episodeId`: String (optional)

## Error Messages

The parser provides descriptive error messages:

```typescript
// Missing required field
"Missing required fields: patientName, uhid"

// Invalid field type
"Invalid prescriptionId: Must be a non-empty string"

// Invalid date format
"Invalid date format: Must be a valid ISO 8601 date string"

// Empty medications array
"Invalid medications: At least one medication is required"

// Invalid medication
"Medication at index 0: duration must be a positive integer"

// Invalid food timing
"Medication at index 1: foodTiming must be one of: before food, after food, with food, anytime"
```

## Round-Trip Property

The parser and printer satisfy the round-trip property:

```typescript
const original = parsePrescription(data);
const printed = printPrescriptionJSON(original.prescription);
const reparsed = parsePrescription(printed);

// original.prescription ≡ reparsed.prescription
```

This ensures data integrity through multiple parse/print cycles.

## Integration with Prescription Handler

The modules integrate seamlessly with the prescription handler Lambda:

```typescript
// In prescription-handler/index.ts
import { parsePrescription } from '../shared/prescription-parser';
import { printPrescriptionForPatient } from '../shared/prescription-printer';

// Parse incoming prescription data
const parseResult = parsePrescription(body);
if (!parseResult.success) {
  return errorResponse(parseResult.error, 400);
}

// Format for patient display
const formatted = printPrescriptionForPatient(parseResult.prescription);
```

## Testing

Run the comprehensive test suite:

```bash
npx ts-node lambda/shared/test-prescription-parser-printer.ts
```

The test suite validates:
- ✅ Valid prescription parsing
- ✅ JSON string parsing
- ✅ Error handling for malformed data
- ✅ All output formats
- ✅ Round-trip property (5 iterations)
- ✅ Edge cases (single medication, minimal fields, many medications)
- ✅ Validation helper functions

## Use Cases

### 1. Doctor Dashboard - Create Prescription
```typescript
// Doctor creates prescription
const prescriptionData = {
  prescriptionId: uuidv4(),
  patientId: patient.id,
  patientName: patient.name,
  uhid: patient.uhid,
  doctorId: doctor.id,
  doctorName: doctor.name,
  date: new Date().toISOString(),
  medications: formData.medications
};

// Validate before saving
const result = parsePrescription(prescriptionData);
if (!result.success) {
  showError(result.error);
  return;
}

// Save to database
await savePrescription(result.prescription);
```

### 2. Patient App - Display Prescription
```typescript
// Fetch prescription from API
const prescription = await fetchPrescription(prescriptionId);

// Parse and validate
const result = parsePrescription(prescription);
if (!result.success) {
  showError('Invalid prescription data');
  return;
}

// Display in user-friendly format
const formatted = printPrescriptionForPatient(result.prescription);
displayPrescription(formatted);
```

### 3. Medical Shop - Verify Prescription
```typescript
// Scan prescription QR code
const prescriptionData = await scanQRCode();

// Parse and validate
const result = parsePrescription(prescriptionData);
if (!result.success) {
  showError('Invalid prescription');
  return;
}

// Display in pharmacy format
const formatted = printPrescriptionForMedicalShop(result.prescription);
displayForPharmacist(formatted);
```

### 4. SMS/Email - Send Prescription
```typescript
// Format prescription for SMS/email
const plainText = printPrescriptionPlainText(prescription);

// Send via SMS
await sendSMS(patient.phone, plainText);

// Send via email
await sendEmail(patient.email, 'Your Prescription', plainText);
```

## Best Practices

1. **Always validate before saving**: Use `parsePrescription()` to validate data before storing in database
2. **Use appropriate format**: Choose the right print format for your use case
3. **Handle errors gracefully**: Check `result.success` and display `result.error` to users
4. **Preserve data integrity**: Use JSON format for data interchange to maintain round-trip property
5. **Test edge cases**: Validate with single medications, many medications, and optional fields

## Performance

- **Parser**: O(n) where n is the number of medications
- **Printer**: O(n) where n is the number of medications
- **Memory**: Minimal overhead, suitable for large prescription lists

## Security Considerations

- Input validation prevents injection attacks
- All strings are trimmed to remove whitespace
- Type checking ensures data integrity
- No external dependencies (pure TypeScript)

## Future Enhancements

Potential improvements:
- [ ] Support for prescription images/PDFs
- [ ] Digital signature integration
- [ ] Barcode/QR code generation for prescriptions
- [ ] Multi-language support
- [ ] Prescription templates
- [ ] Drug interaction warnings

## Support

For issues or questions:
1. Check the test script for examples
2. Review error messages for validation issues
3. Ensure data matches the required structure
4. Verify date format is ISO 8601

## License

Part of the CareNav AI healthcare workflow system.
