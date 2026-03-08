// S3 client for medical report storage
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Create S3 client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1'
});

export const REPORTS_BUCKET = process.env.REPORTS_BUCKET || 'carenav-medical-reports';

/**
 * Supported file formats for medical reports
 */
export const SUPPORTED_FORMATS = ['pdf', 'jpg', 'jpeg', 'png'];

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate file format and size
 */
export function validateFile(fileName: string, fileSize: number): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of 10MB. Current size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Check file format
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension || !SUPPORTED_FORMATS.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Upload a medical report to S3 with patient-specific prefix and encryption
 */
export async function uploadReport(
  patientId: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<string> {
  // Generate unique report ID
  const reportId = uuidv4();
  const extension = fileName.split('.').pop();
  
  // Create patient-specific S3 key
  const s3Key = `${patientId}/${reportId}.${extension}`;

  // Upload to S3 with encryption
  await s3Client.send(
    new PutObjectCommand({
      Bucket: REPORTS_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ServerSideEncryption: 'AES256', // Server-side encryption
      ContentType: getContentType(extension || ''),
      Metadata: {
        patientId,
        originalFileName: fileName,
        uploadedAt: new Date().toISOString()
      }
    })
  );

  return s3Key;
}

/**
 * Get a report from S3
 */
export async function getReport(s3Key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: REPORTS_BUCKET,
      Key: s3Key
    })
  );

  if (!response.Body) {
    throw new Error('Failed to retrieve report from S3');
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Get content type based on file extension
 */
function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png'
  };

  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}
