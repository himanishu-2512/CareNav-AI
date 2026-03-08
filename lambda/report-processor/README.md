# Report Processor Lambda Function

## Overview

The Report Processor Lambda function handles medical report upload, OCR text extraction using Amazon Textract, AI-powered summarization using Amazon Bedrock, and medical timeline generation.

## Features

- **File Upload**: Accepts PDF, JPEG, and PNG files up to 10MB
- **S3 Storage**: Stores files with patient-specific prefix and server-side encryption
- **OCR Processing**: Extracts text from documents using Amazon Textract
- **AI Summarization**: Generates structured summaries using Amazon Bedrock (Claude 3)
- **Medical Timeline**: Creates chronological medical history from multiple reports
- **Red Flag Detection**: Identifies critical medical information (allergies, chronic conditions)
- **Error Handling**: Graceful fallback with "Manual review needed" message on OCR/AI failures

## API Endpoints

### POST /api/reports/upload

Upload and process a medical report.

**Request Body:**
```json
{
  "patientId": "string",
  "fileName": "string",
  "fileData": "base64-encoded-file-content"
}
```

**Success Response (200):**
```json
{
  "reportId": "uuid",
  "s3Key": "patientId/reportId.ext",
  "summary": {
    "reportDate": "YYYY-MM-DD",
    "reportType": "lab test | imaging | consultation note | discharge summary",
    "keyFindings": ["finding1", "finding2"],
    "diagnoses": ["diagnosis1"],
    "medications": ["medication1"],
    "procedures": ["procedure1"],
    "recommendations": ["recommendation1"],
    "redFlags": ["allergy", "chronic condition"]
  },
  "timeline": [...],
  "redFlags": ["allergy1", "chronic1"],
  "status": "success",
  "message": "Report processed successfully"
}
```

**Manual Review Response (200):**
```json
{
  "reportId": null,
  "s3Key": "patientId/reportId.ext",
  "status": "manual_review_needed",
  "message": "Manual review needed - OCR processing failed. The file has been stored securely.",
  "error": "OCR extraction failed"
}
```

**Error Response (400/500):**
```json
{
  "error": "Error message"
}
```

### GET /api/reports/timeline/:patientId

Get chronological medical timeline for a patient.

**Success Response (200):**
```json
{
  "patientId": "string",
  "timeline": [
    {
      "date": "YYYY-MM-DD",
      "reportType": "lab test",
      "keyFindings": ["finding1"],
      "diagnoses": ["diagnosis1"],
      "medications": ["medication1"]
    }
  ],
  "redFlags": ["allergy1", "chronic1"],
  "totalReports": 5
}
```

## File Validation

- **Supported Formats**: PDF, JPEG, JPG, PNG
- **Maximum Size**: 10MB
- **Validation**: Performed before upload to S3

## Processing Flow

1. **Validate Request**: Check required fields and file format/size
2. **Upload to S3**: Store with patient-specific prefix and encryption
3. **Extract Text**: Use Amazon Textract to perform OCR
4. **Summarize**: Use Amazon Bedrock to generate structured summary
5. **Store Report**: Save metadata and summary to DynamoDB
6. **Generate Timeline**: Create chronological medical history
7. **Return Response**: Include summary, timeline, and red flags

## Error Handling

### OCR Failures
- Textract extraction errors are caught
- File is still stored in S3
- Returns "manual_review_needed" status
- Logs error for debugging

### AI Summarization Failures
- Bedrock errors are caught
- Extracted text is preserved
- Returns "manual_review_needed" status
- Includes partial extracted text (first 500 chars)

### File Validation Errors
- Returns 400 error before processing
- Clear error messages for size/format issues

## Environment Variables

- `DYNAMODB_TABLE`: DynamoDB table name
- `REPORTS_BUCKET`: S3 bucket for medical reports
- `AWS_REGION`: AWS region (default: ap-south-1)

## IAM Permissions Required

- `s3:PutObject`, `s3:GetObject` - S3 bucket access
- `textract:DetectDocumentText` - OCR processing
- `bedrock:InvokeModel` - AI summarization
- `dynamodb:PutItem`, `dynamodb:Query` - Database operations
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` - CloudWatch logging

## Dependencies

- `@aws-sdk/client-s3` - S3 operations
- `@aws-sdk/client-textract` - OCR processing
- `@aws-sdk/client-bedrock-runtime` - AI summarization
- `@aws-sdk/client-dynamodb` - Database operations
- `uuid` - Report ID generation

## Testing

```bash
# Example upload request
curl -X POST https://api-url/api/reports/upload \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "fileName": "lab-report.pdf",
    "fileData": "<base64-encoded-content>"
  }'

# Example timeline request
curl -X GET https://api-url/api/reports/timeline/patient-123 \
  -H "Authorization: Bearer <token>"
```

## Implementation Notes

- Uses 60-second timeout for OCR processing
- Allocates 1024MB memory for document processing
- Implements retry logic for Bedrock API calls
- Preserves document structure in extracted text
- Sorts timeline by date (most recent first)
- Deduplicates red flags across all reports
