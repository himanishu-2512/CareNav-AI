# Red Flag Highlighting Module

## Overview

The Red Flag Highlighting Module automatically detects and highlights critical patient information (allergies, chronic conditions, high-risk factors) to help doctors quickly identify important medical context.

## Features

### 1. Keyword Detection

The module scans for predefined red flag keywords:
- `allergy`
- `allergic`
- `chronic`
- `diabetes`
- `hypertension`
- `heart disease`
- `asthma`
- `seizure`
- `pregnant`
- `breastfeeding`

### 2. Multi-Source Scanning

Red flags are detected across multiple data sources:
- **Patient Profile**: Basic patient information
- **Symptom Reports**: Patient-reported symptoms and follow-up answers
- **Medical Reports**: Uploaded documents (OCR-extracted text and AI summaries)

### 3. Context Extraction

When a red flag keyword is detected, the module extracts surrounding context (up to 100 characters) to provide meaningful information to doctors.

### 4. Critical Information Section

Patient summaries include a dedicated "Critical Information" section that displays:
- Source of the red flag (Patient Profile, Symptom Report, or Medical Report)
- The detected information with context
- Detection timestamp
- Ordered by detection sequence (most recent first)

### 5. Visual Emphasis

Red flags are designed to be displayed with visual emphasis:
- Red badges or icons
- Highlighted text
- Prominent placement at the top of patient summaries

### 6. Automated Disclaimer

All red flag displays include the disclaimer:
> "Automated highlighting only—verify all information clinically. Red flags are detected automatically and may require clinical validation."

## API Endpoints

### Get Patient Summary with Red Flags

**Endpoint**: `GET /api/patients/summary/:patientId`

**Authorization**: Required (Doctor role)

**Response**:
```json
{
  "patient": {
    "patientId": "uuid",
    "name": "Patient Name",
    "age": 45,
    "gender": "Male",
    "contact": "+91-1234567890",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "criticalInformation": [
    {
      "source": "Medical Report",
      "information": "Patient has documented allergy to penicillin",
      "detectedAt": "2024-01-15T10:30:00Z"
    },
    {
      "source": "Symptom Report",
      "information": "Patient mentioned chronic back pain for 5 years",
      "detectedAt": "2024-01-14T15:20:00Z"
    }
  ],
  "redFlags": [
    "Patient has documented allergy to penicillin",
    "Patient mentioned chronic back pain for 5 years"
  ],
  "disclaimer": "Automated highlighting only—verify all information clinically. Red flags are detected automatically and may require clinical validation.",
  "totalRedFlags": 2
}
```

## Module Functions

### `detectRedFlags(text: string): string[]`

Scans text for red flag keywords and returns detected flags with context.

**Example**:
```typescript
import { detectRedFlags } from './red-flag-detector';

const text = "Patient has a known allergy to penicillin and chronic diabetes.";
const flags = detectRedFlags(text);
// Returns: ["known allergy to penicillin and chronic diabetes"]
```

### `scanMultipleSources(sources: string[]): string[]`

Scans multiple text sources and returns all unique red flags.

**Example**:
```typescript
import { scanMultipleSources } from './red-flag-detector';

const sources = [
  "Patient profile: 45 year old male",
  "Symptom: chronic back pain",
  "Report: allergic to aspirin"
];
const flags = scanMultipleSources(sources);
// Returns all detected red flags from all sources
```

### `hasRedFlags(text: string): boolean`

Quick check if text contains any red flag keywords.

**Example**:
```typescript
import { hasRedFlags } from './red-flag-detector';

const text = "Patient has diabetes";
const hasFlags = hasRedFlags(text); // Returns: true
```

### `getMatchingKeywords(text: string): string[]`

Returns the specific keywords that matched in the text.

**Example**:
```typescript
import { getMatchingKeywords } from './red-flag-detector';

const text = "Patient has diabetes and hypertension";
const keywords = getMatchingKeywords(text);
// Returns: ["diabetes", "hypertension"]
```

### `highlightRedFlags(text: string, startMarker?: string, endMarker?: string): string`

Wraps red flag keywords with markers for frontend display.

**Example**:
```typescript
import { highlightRedFlags } from './red-flag-detector';

const text = "Patient has diabetes";
const highlighted = highlightRedFlags(text, '<mark>', '</mark>');
// Returns: "Patient has <mark>diabetes</mark>"
```

## Integration with Report Processing

Red flags are automatically detected during report processing:

1. **OCR Extraction**: Text is extracted from uploaded medical documents using Amazon Textract
2. **AI Summarization**: Amazon Bedrock summarizes the report and identifies red flags
3. **Keyword Scanning**: The red flag detector scans both the summary and extracted text
4. **Storage**: Red flags are stored with the report in DynamoDB
5. **Timeline Generation**: All red flags are aggregated when generating the medical timeline

## Important Notes

### Clinical Validation Required

The system does NOT make clinical judgments about red flags—it only highlights them for doctor awareness. All red flags must be clinically validated by healthcare providers.

### No Diagnosis

The red flag module does not diagnose conditions. It simply detects keywords that may indicate important medical information requiring attention.

### Privacy and Security

- All red flag data is encrypted at rest in DynamoDB
- Access to patient summaries with red flags requires authentication and doctor role
- Red flags are only displayed to authorized healthcare providers

### Demo Data Only

As per system requirements, this module is designed for demonstration purposes only and should not be used with real patient data.

## Future Enhancements

Potential improvements for production use:

1. **Configurable Keywords**: Allow hospitals to customize red flag keywords
2. **Severity Levels**: Classify red flags by severity (critical, important, informational)
3. **Machine Learning**: Use ML to detect red flags beyond keyword matching
4. **Multilingual Support**: Detect red flags in Hindi, Tamil, Telugu, Bengali
5. **Alert System**: Send notifications to doctors when critical red flags are detected
6. **Audit Trail**: Track when doctors view and acknowledge red flags

## Testing

To test the red flag module:

```bash
# Run unit tests (when implemented)
npm test lambda/shared/red-flag-detector.test.ts

# Test with sample data
curl -X GET https://api-url/api/patients/summary/patient-id \
  -H "Authorization: Bearer doctor-jwt-token"
```

## Requirements Mapping

This module implements:
- **Requirement 6.1**: Scan for predefined red flag keywords
- **Requirement 6.2**: Highlight detected red flags with visual emphasis
- **Requirement 6.3**: Display in dedicated "Critical Information" section
- **Requirement 6.4**: No clinical judgments, only highlighting
- **Requirement 6.5**: Order by detection sequence
- **Requirement 6.6**: Include automated highlighting disclaimer
