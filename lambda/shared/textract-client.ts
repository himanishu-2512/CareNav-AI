// Amazon Textract client for OCR text extraction
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';

// Create Textract client
export const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

/**
 * Extract text from a document using Amazon Textract
 * @param s3Bucket S3 bucket name
 * @param s3Key S3 object key
 * @returns Extracted text as a single string
 */
export async function extractTextFromDocument(
  s3Bucket: string,
  s3Key: string
): Promise<string> {
  try {
    const command = new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Key
        }
      }
    });

    const response = await textractClient.send(command);

    if (!response.Blocks || response.Blocks.length === 0) {
      throw new Error('No text detected in document');
    }

    // Extract text from LINE blocks (preserves line structure)
    const textLines: string[] = [];
    
    for (const block of response.Blocks) {
      if (block.BlockType === 'LINE' && block.Text) {
        textLines.push(block.Text);
      }
    }

    if (textLines.length === 0) {
      throw new Error('No text lines extracted from document');
    }

    // Join lines with newlines to preserve document structure
    return textLines.join('\n');
  } catch (error: any) {
    console.error('Textract extraction error:', error);
    throw new Error(`Failed to extract text from document: ${error.message}`);
  }
}

/**
 * Extract text from a document buffer (for direct processing)
 * @param documentBuffer Document buffer (PDF or image)
 * @returns Extracted text as a single string
 */
export async function extractTextFromBuffer(documentBuffer: Buffer): Promise<string> {
  try {
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: documentBuffer
      }
    });

    const response = await textractClient.send(command);

    if (!response.Blocks || response.Blocks.length === 0) {
      throw new Error('No text detected in document');
    }

    // Extract text from LINE blocks
    const textLines: string[] = [];
    
    for (const block of response.Blocks) {
      if (block.BlockType === 'LINE' && block.Text) {
        textLines.push(block.Text);
      }
    }

    if (textLines.length === 0) {
      throw new Error('No text lines extracted from document');
    }

    return textLines.join('\n');
  } catch (error: any) {
    console.error('Textract extraction error:', error);
    throw new Error(`Failed to extract text from document: ${error.message}`);
  }
}
